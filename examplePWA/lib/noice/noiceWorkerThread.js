/*
    noiceWorkerThread.js
    this is an object model for worker threads
*/
class noiceWorkerThread extends noiceCoreNetworkUtility {




/*
    constructor({

    })
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        // object infrastructure
        _version:       1,
        _className:     'noiceWorkerThread',
        threadHandle:   self,
        threadName:     'noiceWorkerThread',
        debug:          false,
        signalHandlers: {}
        // insert default attributes here

    }, defaults), callback);

    // setup handlers
    let that = this;
    that.threadHandle.addEventListener('message', function(evt){ that.signalFromParent(evt); });
    that.log(`loaded`);
}




/*
    signalParent({
        type:   <str> -- probably an enum in your code,
        data:   <obj> -- arbitrqary
    }, <transferrableObject>)

    https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage

    yes this seems pointless but it exists so you can override it in
    subclasses and do more insteresting
*/
signalParent(args){
    /*
    if (this.isServiceWorker === true){
        // serviceWorkers gotta be different
        self.clients.matchAll().then(function(clients){
            clients.forEach(function(client){
                client.postMessage(args);
            })
        })

    }else
    */
    if (this.threadHandle.postMessage instanceof Function){
        this.threadHandle.postMessage(args);
    }
}




/*
    signalFromParent(evt)
    this is the onmessage handler for the thrread

    https://developer.mozilla.org/en-US/docs/Web/API/Worker/onmessage

    we're going to look for a match in this.signalHandlers to dispatch
    the signal to
*/
signalFromParent(evt){
    if ((evt.data instanceof Object) && (this.isNotNull(evt.data.type))){
        if (this.signalHandlers.hasOwnProperty(evt.data.type)){
            try {
                this.signalHandlers[evt.data.type](evt.data.data, evt);
            }catch(e){
                this.log(`signalFromParent [${evt.data.type}] | signalHandler threw unexpectedly: ${e}`, true);
            }
        }else{
            this.log(`signalFromParent [${evt.data.type}] | no registered eventHandler`);
        }
    }else{
        this.log(`signalFromParent | called with no event data?`);
    }
}




/*
    log(message, fatal)
    this mimics the noiceApplicationCore log method
    we are going to signal the parent thusly
        {
            type:       'log',
            data: {
                message:    <message> (str),
                fatal:      <fatal> (bool)
            }
        }
    parent thread is listening for it or it isn't
    hopefully it is :-)
*/
log(message, fatal){
    //if (this.debug){ console.log(`thread debug [${this.threadName}] | log | ${message} ${(fatal===true)?'| fatal':''}`) }
    this.signalParent({
        type:       'log',
        data:   {
            message:    message,
            fatal:      (fatal === true)
        }
    });
}



} // end noiceWorkerThread class