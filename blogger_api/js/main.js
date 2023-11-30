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


Slick.createReceiver(event=>{
    return {
        message: "ok, this is nice and abstracted",
        value: 1,
        cool: true
    }
})
