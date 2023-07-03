# noiceWorkerThread.js

an object model for child threads [see Web Worker API on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

this file contains the following classes:

* **noiceWorkerThread**

## requires

* **noiceCore.js** (`noiceCoreNetworkUtility`)

---


## attributes

* **signalHandlers** `object` - an object of the form `{<messageType>: <function>}` specifying function callbacks to handle messages of the specified `messageType`

* **threadHandle** `object` - WorkerGlobalScope.self [see docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/self)

## functions

### `signalParent({args}, {transferableObject})`
send a signal to the main thread. This is a wrapper for the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage)

```javascript
thread.signalParent(
    {
        type:   messageType,
        data:   {arbitrary: object}
    },
    [optional, array, of, transferrable, objects, see, docs]
);
```


### `signalFromParent({messageEvent})`
this is the `onmessage` event handler for the thread. [see docs](https://developer.mozilla.org/en-US/docs/Web/API/Worker/onmessage). The long and short of it is that we're going to look here `event.data.type` if that value matches a value in `signalHandlers`, we will dispatch the event to that function.


### `log(message, fatal)`
this is a hard-coded call to `signalParent` where the payload is:
```javascript
{
    type: 'log',
    data: {
        message:    'an arbitrary log message',
        fatal:      false
    }
}
```
