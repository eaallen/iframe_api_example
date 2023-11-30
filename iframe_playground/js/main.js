/**
 * This is just an object to handle dispatch messages to the iframe. 
 */
const IframeWorker = {
    dispatch() {
        throw ('Unable to send to iframe');
    }
}

const Slick = {
    /**
     * Adds and listener for the message event. You should only call this method once.
     * @param {(event: MessageEvent<*>)=> Object.<string, any>} handlerCallback 
     */
    createReceiver(handlerCallback) {
        window.addEventListener("message",
            event => {
                try {
                    const data = handlerCallback(event)
                    event.source.postMessage({ ...data, __slick_id__: event.data.__slick_id__ }, event.origin)
                } catch (error) {
                    event.source.postMessage({ __slick_error__: error, id: event.data.id }, event.origin)
                }
            }
        );
    },

    /**
     * An object that has the post method, used for making cross origin requests across i-frames. 
     */
    requester: function () {
        const requests = {}
        window.addEventListener(
            "message",
            (e) => {
                if (requests[e.data.__slick_id__]) {
                    if (e.data.__slick_error__) {
                        requests[e.data.__slick_id__].reject(e.data.__slick_error__)
                    } else {
                        requests[e.data.__slick_id__].resolve(e.data)
                    }
                }
            },
        );
        return {
            async post(contentWindow, data, origin = "*") {
                const __slick_id__ = Math.random()
                const promise = new Promise((resolve, reject) => {
                    requests[__slick_id__] = { resolve, reject }
                })
                contentWindow.postMessage({ ...data, __slick_id__ }, origin)
                const result = await promise
                delete requests[__slick_id__]
                return result
            }
        }
    }()
}

// creates the iframe
function createIframe() {
    const iframe = document.createElement("iframe")
    iframe.id = "iframe"
    iframe.src = "http://localhost:3001"
    iframe.onload = async function () {
        console.log("the iframe has loaded");
        console.log("window source", window.location.href);
        console.log(await Slick.requester.post(iframe.contentWindow, { a: "eli", b: "gove" }, "*"))
    }
    // window.onmessage = iframeHandler // we put a handler for `onmessage` to let us handle
    document.body.append(iframe)
    // requests from the child iframe
}

// this is the handler
// function iframeHandler(e) {
//     switch (e.data.type) {
//         case "init":
//             console.log("init event", e);
//             return initIframe(e)
//         default:
//             console.log("other event", e);
//             requests[e.data.id].resolve(e.data)
//             return;
//     }
// }

// this function lets call back to the iframe by giving the worker 
// a function to call the iframe with post message
function initIframe(event) {
    console.log("calling init iframe");
    console.log(event);
    IframeWorker.dispatch = data => {
        // event.source is the window object for the iframse
        // event.origin is the host:port, which is very important
        event.source.postMessage(data, event.origin)

    }

}

// this function sends a message to the iframse
function sendMessage() {
    IframeWorker.dispatch({
        payload: {
            message: "This is a message sent from the parent js to the iframe",
            title: "It works!",
            kind: "success",
            seconds: 10,
            show: true
        },
        type: "message"
    })
}


function ready(fn) {
    if (document.readyState !== 'loading') {
        console.log("are you ready? 1");
        fn();
    } else {
        console.log("are you ready? 2");
        document.addEventListener('DOMContentLoaded', fn);

    }
}

ready(createIframe)
