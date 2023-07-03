# noiceCore.js
Core classes for the noice framework. All classes in the noice framework descend from these.

This file contains the following class tree

* **noiceObjectCore**
    * **noiceCoreChildClass**
        * **noiceException**
        * **noiceCoreUtility**
            * **noiceCoreNetworkUtility**


---
## noiceObjectCore
every object in the noice framework descends from this parent class. This defines a constructor model and self-serialization accessor, plus minimal utility functions needed across all object types.

### Synopsis
```javascript

// create object
let myObject = new noiceObjectCore({

    // args
    {
        regularAttribute:   "someValue",
        _hiddenAttribute:   "someOtherValue"
    },

    // defaults
    {
        hiddenAttribute:    "again, a different value"
        _regularAttribute:  "defaultValue"
    },

    // callback
    function(selfReference){
        // do something with the newly created object here
    }
});

// dump the object to json
let serialized = myObject.json;

// set attribute values from json
myObject.json = `{"regularAttribute": "someOtherValue"}`;

// nullness checks
if (myObject.isNull(someRandomString))){ console.log("someRandomString is null!"); }
if (myObject.isNotNull(someRandomString)){ console.log("someRandomString is not null!"); }

// what's the epoch time?
console.log(myObject.epochTimestamp());

// does the object have a non-null attribute?
if (myObject.hasAttribute('shabidoo')){ console.log(`myObject has 'shabidoo!'`); }

```

#### args

* **position 0** the first argument to the constructor is the `{args}` object - is an object reference modeling user-specified arguments to the constructor every enumerable attribute will be copied into the resulting object.

* **position 1** the second (optional) argument to the constructor is the `{defaults}` object - is an object reference modelling class-default attributes, every enumerable attribute will be copied into the resulting object, however {args} overrides attributes found here

* **position 2** the third (optional) argument to the constructor is the `callback` -- a function reference, if specified, we will call this external function with a single argument consisting of the newly constructed object, before the constructor exits.

#### a note about attributes
anything that comes in via `{args}` and `{defaults}` will become an object attribute. Keys on `{defaults}` will be set as attributes, only if a corresponding key does not exist on `{args}`

attributes that are prefixed with the underscore char `_` are created as non-enumerable (meaning they are hidden from Object.keys and
JSON.stringify).

attributes that are prefixed with a double underscore `__` are also non-enumerable, however they ARE exposed via the `this.json` accessor,
meaning they are restorable from JSON.

IF you specify a non-enumerable underscore-prefixed attribute on either `{args}` or `{defaults}` the default constructor will NOT
create attributes for the non-underscore prefixed attribute.

In the example given in the `Synopsis` above, the default constructor will NOT create an attribute for either `this.hiddenAttribute` nor `this.regularAttribute`.

The reason is that underscore-prefixed versions of each also exist, we presume there are class-defined getter and setter functions for these if we define non-underscore-prefixed versions of these attributes, the child class getters and setters will be overridden by the constructor.

So instead the constructor will remove these attributes and put them in the hidden `this.__getterSetterAttributesFromInstantiation` key.

It is then the job of the subclass. to initialize these values through their own setters after calling `super()` in the constructor.

#### function reference

* `static mergeClassDefaults({defaults}, {args})`
this is a static function for merging args to defaults and is called at the top of most every constructor across all subclasses in the framework. This merges the two given objects `{defaults}` and `{args}` with defaults going into the resulting object first, and args going in second so that colliding keys are overwritten by args.

* `isNull(var)`
returns true if the given `var` has a value that is any one of the numerous ways javascript indicates "no value"

* `isNotNull(var)`
inverse of `isNull`. same logic, just inveterted

* `hasAttribute(str)`
if the given `str` corresponds to an attribute of the object and the attribute `isNotNull()`, return `true` otherwise `false`

* `epochTimestamp(bool)`
if `bool` is false or not specified, returns the number of seconds elapsed since `1/1/1970 00:00:00 GMT`. If `bool` is true, returns the number of milliseconds elapsed since the same date

#### attribute reference

* **json** `string` - Getting this string will return a JSON serialization of the object (as described above). Setting the value of this string will set keys on the given JSON object into the object as attributes (possibly overwriting existing values)



---



## noiceCoreChildClass
this class has no unique attributes or functions, however the constructor handles pass-through defaults (as described above) and will handle attribute initialization *after* `super()` is called. So basically

```html
descend child classes from here, unless you've got good reason not to
```



---



## noiceException
this is an exception class to handle exceptions thrown by our own code.

### attributes
* **errorNumber** `integer`
* **message** `string`
* **thrownBy** `string`
* **fatal** `bool` (default: `false`)
* **sendExceptionEvent** `bool` (default: `true`)
* **exceptionEventName** `string` (default: `_noiceException`)

If `sendExceptionEvent` is set true, the constructor will send a copy of the noiceException object to the document event defined by `exceptionEventName`. External things that might care about exception throws (for instance loggers) can subscribe to that event. One very useful application of this feature is an app-global crash recovery dialog ... for instance.

### functions
* `toString()`
returns a string representation of the error



---



## noiceCoreUtility
this adds utility functions to `noiceCoreChildClass` many subclasses descend from here

### functions
* `toEpoch(date, fine)`

    convert the `date` string to epoch (number of seconds elapsed since `1/1/1970 00:00:00 GMT`). If the `fine` argument is set to boolean `true`, return milliseconds instead of seconds.

    `date` is passed to `Date.parse()` see [documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse) for details.

* `fromEpoch(integer, type)`

    interpret the given `integer` value as an epoch timestamp and return a formatted dateTime based on the `type`

    values of `type`

    * `date` -          returns `YYYY-MM-DD`
    * `time` -          returns `HH:MM:SS`
    * `dateTime` -      returns `YYYY-MM-DDTHH:mm:ss.sssZ` [ISO 8601 Extended Format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
    * `dateTimeLocale`  returns format determined by locale and user preference [Date.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString)


* `getGUID()`

    returns a globally unique identifier (GUID) [see additional info](https://en.wikipedia.org/wiki/Universally_unique_identifier). This is a string that can reasonably be presumed to be globally unique.



---



## noiceCoreNetworkUtility
this adds a network request dispatcher (XHR based) to `noiceCoreUtility`. Any class that needs to interact with the network will descend from here

### functions

#### `fetch({args})`
this creates an XHR of the specified `method`, pointing to the specified `endpoint` with specified `headers` and `content`, and returns a rejected or resolved promise. Rejected promises are `noiceExceptions`, and are triggered either from timeout being exceeded or from not receiving an HTTP status response matching `expectHtmlStatus`. Resolved promises return the XHR object and the caller can work out what to do with that. [See also XHR docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)

##### args
* **endpoint** `string` - URL

* **method** `enum(GET, POST, PUT, DELETE)` - use this method to access the URL identified by `endpoint` [complete method list here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

* **headers** `object` - an object of `{header: value, ...}` key value pairs as [described here](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader)

* **content** `object` | `string` | `arrayBuffer` - the content you want to send to the server if you're using a method that sends like `POST`. If `encodeContent` is true, this value will be passed through `JSON.stringify()` before being sent [see MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send)

* **expectHtmlStatus** `integer` - if the XHR returns an HTML status code other than the one you've specified here, it will reject the returned promise, generating an error. Very handy for building REST clients, for isntance

* **timeout** `integer` - abort XHR and reject promise if opened XHR persists longer than this many miliseconds (note: on Chrome and Safari the max is 2 minutes no matter what you set here)

* **encodeContent** `bool` - if set true pass `content` through `JSON.stringify()` before sending

* **responseType** `string` - [see MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType)

* **progressCallback** `function` - call this function asynchronously from the `progress` event on the `XHR` object [see docs](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/progress_event)

##### output
the function returns a promise that resolves to the value of `this` inside the `load` event callback on the `XHR` object when the request completes. In general, you'll be wanting the `.responseText` attribute of the returned object, but there's tons of stuff in there you might want [see docs](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/load_event)
