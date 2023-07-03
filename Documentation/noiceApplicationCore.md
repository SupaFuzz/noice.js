# noiceApplicationCore.js

Classes for creating Progressive Web Apps (PWAs). This file contains the following classes:

* **noiceLogMessage**
* **noiceLog**
* **noiceApplicationCore**

## requires

* **noiceCore.js** (`noiceCoreChildClass`, `noiceCoreNetworkUtility`)

---

## noiceLogMessage
this object models a log message

### attributes
* **message** `string` - content of the log message

* **time** `integer` - high resolution epochTimestamp(miliseconds)

* **fatal** `bool, default false`, if the log message was fatal set this boolean true

### functions

* `toString()` - returns a string representation of the log message

### example
```javascript

// called with explicit arguments
let logMesasge = new noiceLogMessage({
    message:    'this is my log message',
    time:       1637598326401,
    fatal:      true
});

// toString() is called automatically when you get value in string context
console.log(logMessage)

// should output
// [1637598326401 fatal] this is my log message

// can also be called with a string
// time defaults to now, fatal defaults to false
let logMessage = new noiceLogMessage('this is my log message');
```



---



## noiceLog
This is a basic logger (a chronologically ordered list of `noiceLogMessage` objects). This logger has the concept of holding a number of rows in-memory then "flushing" them (perhaps to non-volitile storage) via the `flushCallback`.

### attributes

* **maxLength** `integer, default: 0` - Keep no more than this many entries in the log. Once the log has grown to this length, the oldest entry is deleted upon each additional log being added. Set a value of `0` for unlimited length

* **autoFlush** `bool, default: false` - if true, the `flushCallback` function (if specified) is called asynchronously each time a message is added to the log

* **flushCallback** `function` - this function is called asynchronously when the `flush()` function is called (either explicitly or by way of the `autoFlush` flag). This function receives a JSON serialization of the entire `messageQueue`

* **messageQueue** `array` - the array of log entries

### functions

* `log(message, fatal, flushImmediate)`

    this creates a new `noiceLog` object with the given `message` and `fatal` attributes (with `time` set to current time), and appends it to the `messageQueue`.

    If `maxLength` is exceeded, the oldest log message is pruned. if `autoFlush` is set, or if `flushImmediate` is set, the `flush()` function is called.

    `fatal` and `flushImmediate` default false

* `flush()`

    this returns a promise to call the specified `flushCallback()` (if not specified, promise will reject)

### example
```javascript
let logger = new noiceLog({
    maxLength: 100,
    autoFlush: true,
    flushCallback: async function(logJSON){
        try {
            localStorage.setItem('myLogs', logJSON);
        }catch(e){
            throw(`localStorage.setItem failed: ${e}`);
        }
        return(true);
    }
});

logger.log("Hi I'm a log message!");
```



---



## noiceApplicationCore
This is the core of a PWA application. To write an application in noice, you'd extend this class, adding your own application-specific logic.

Objects of this type can instantiate worker threads, including a `serviceWorker`, provide logging infreastructure, and can store/restore themselves from `localStorage`

### attributes

* **localStorageKey** `string, default: this._className` - store copies of the application object state under this key in `localStorage` when the `save()` function is called

* **isCrashed** `bool, default: false` - to check if the application has received a fatal log message (or has been explicitly crashed), check the value of this boolean. If `true`, we are already in a crashed state. You can crash the app by sending a fatal log message, OR by explicitly setting this attribute to `true`, doing so will invoke a `store()` call and the `crashCallback()` (if specified).

* **crashCallback** `function` - if specified, this function is called when the value of `isCrashed` is set `true` from a non-true value. The function is called with a single argument, which is a reference to `this` (the `noiceApplicationCore` object). A handy use for this feature is to, for instance, use the crashCallback to popup a blocking dialog indicating crash and giving the user a recovery option.

* **logLimit** `integer, default: 0` - passthrough to `noiceLog` constructor (see notes above)

* **startTime** `integer (epochTimestamp)` - the high-res `epochTimestamp` at which the `noiceApplicationCore` object was created (usually this will correspond to the date/time of the last page load).

* **logHistory** `object` - each time the app is loaded (an instance of the `noiceApplicationCore` object is created), a `noiceLog` object is created in the object on this attribute with a key corresponding to the value of `this.startTime`. In this way, the current logger is kept in `this.logHistory[this.startTime]`, and we maintain a history of previous runs. NOTE: `autoFlush` is hard-coded `true` here so logs are immediately flushed when written.

* **logInstanceLimit** `integer, default: 0` -  limit the number of keys on `this.logHistory` to a maximum of this number. When this number is reached, the oldest key on `logHistory` will be deleted. If a value of `0` is specified, keep unlimited log instances (NOTE: until you fill up the disk quota on `localStorage` so be careful with that)

* **logToConsole** `bool, default: true` - if set `true`, echo log messages as they are received to `console.log()`

* **name** `string, default: this._className` - name of the application. This will be referenced in lots of places. Make it a good one.

* **version** `string, default this._version` - version of the application. Also referenced lots of places.

* **restoreOnInstantiate** `bool` - if set true, we will immediately call `restore()` on instantiate (which will look for the last saved version of the object in `this.localStorageKey`, restore object state and create a new entry on `logHistory`)

* **threads** `object` - a list of scripts to initiate on threads. Datastructure is `{ <threadName>: './script.js' }` (it is presumed that the threads will use the `noiceWorkerThread` infrastructure for signaling between the main thread (with the `noiceApplicationCore` object and the child threads specified here)

* **threadSignalHandlers** `object` - this is an object of callback functions for handling signals from child threads. The datastructure is of this form: `this.threadSignalHandlers[<threadName>][<type>] = function(<args>, <selfReferehce>)`. See `handleThreadMessage()` below.

* **enableServiceWorker** `bool` - if set `true`, and we have `serviceWorker` on `this.threads`, register it/set it up, etc on object instantiation. If set `false`, the object will *not* instantiate the `serviceWorker` even if it is specified (this can be a godsend troubleshooting cache issues)

* **appMode** `bool` - if the app is running as a standalone PWA (installed on homescreen on ios/safari, installed on desktop via chrome on windows or android), this flag will be `true` otherwise `false`

### functions

* `log(message, fatal, flushImmediate)`

    passthrough to `noiceLog` (see above). Log messages are stored in `this.logHistory[this.startTime]` (see `logHistory` notes above).

* `save()`

    save object state to `localStorage`, under `this.localStorageKey`

* `restore()`

    look at `localStorage` beneath the `this.localStorageKey` key, if that exists, run its value through `JSON.parse()`, then set those values as object attributes (restoring the last saved state of the object). Create a new instance on `logHistory` (so we don't append the last logInstance). Returns boolean `false` if no value was found in `localStorage` to restore, otherwise `true`.

* `writeAppData({key:value, ...})`

    append (or overwrite) the specified key/value pairs to `this._appData`, then call `this.save()`, persisting the key/value pairs in the stored version of the object

* `getAppData(key)`

    get the current value of the given `key` on `this._appData`, if `key` is not specified, return the entire `this._appData` object. This and `writeAppData()` are the "right" way to get and set values you want to be disk-persistent.

* `deleteAppData(key)`

    delete the specified `key` from `this._appData`, then call `this.save()`. If `key` is not specified, this will **delete all appData!** (be careful).

* `async threadResponse({args})`

    this will send a signal (with `messageType` and `data` specified on `postMessage` argument) to the child thread identified by `threadName`, and will return a promise that resolves or rejects when the thread responds with a signal specifying a `messageType` matching `awaitResponseType`.

    The promise will reject if `timeout` is exceeded or if the thread responds with a signal setting the error flag true. Otherwise will resolve with the `.data` object of the message event returned by the thread

    `{args}` are as follows:

    * **threadName** `string` - name of the thread (key on `this.threads` corresponding to the child thread with which you wish to communicate)

    * **postMessage** `object` - `{type: <messageType>, data: <arbitrary>}` - the content of the signal you wish to send to the child thread identified by `threadName`

    * **awaitResponseType** `string` `<messageType>` - do not resolve the promise until the child thread responds with a signal matching this messageType

    * **timeout** `integer` - reject the promise, if the child thread hasn't responded after this number of miliseconds

    * **isServiceWorker** `bool` - set it true if the thread you want to talk to is the serviceWorker (they're a little different to talk to, so this flag tells the code to await potential thread wakes, etc)

* `handleThreadMessage({args})`

    this handles asynchronous messages sent from child threads. This is distinct from `threadResponse` above, in that this is intended to catch signals initiated by the child thread (for instance log messages, alerts, etc). This will dispatch messages to the callback function specified in `this.threadSignalHandlers[<threadName>][<messageType>]` where threadName and messageType match.

    callbacks in `threadSignalHandlers` are passed an object of the form `{ threadName: <threadName>, event: <messageEvent>}` [see docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent)
