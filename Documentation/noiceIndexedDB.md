# noiceIndexedDB.js
an object model for interacting with the indexedDB API. There are two external resources that are well worth reading:

* [MDN IndexedDB API Docs](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

* [Breaking the Borders of IndexedDB](https://hacks.mozilla.org/2014/06/breaking-the-borders-of-indexeddb/)

## The long and short of it
The `indexedDB` API provides access to many hundreds of MB of nonvolatile data storage, in the form of `dataStore` objects, which are *somewhat* analogous to table objects within a traditional SQL relational database. However, `indexedDB` is *not* a relational database and does not use SQL.

Imagine a Table in an SQL database, except that every row can have wildly different data elements. Every row is actually an object with an arbitrary data structure (even nested data). This is an indexedDB `dataStore`. If you need to *search* for rows in the dataStore, then you need to define an `index` on it. So in this way, it's sort of like an SQL table where every row can have whatever, and you only have to define columns you want to search on.

That's the short story. There are *lots* of details when it comes to defining indexes, implementing complex search algorithms, etc. All of which you've got to do explicitly in your own code, which is very much the pain point compared to SQL. It's not so bad when you get a handle on it, and other than caches (which are fickle and can be dumped at any time by the user or the system), this is pretty much the only good way to stash a few hundred MB of data on disk for your PWA.

## requires

* **noiceCore.js** (`noiceCoreUtility`)

---

## Defining an indexedDB schema

In SQL you have `DDL` (Data Definition Language) operations that you use to define your tables and the  relational data structure. In `indexedDB`, you don't. Though you do need to define your `dataStore` objects and the indexes on them, at the API level this is not done via a language, but by explicit code implementation. For reasons that will become obvious as you dig in, this is extraordinarily unhelpful. As a result, this library implements a quick and dirty version of DDL, in the form of a `storeDefinitions` object of this form:

```text.plain
<storeName>: {
    createOptions: {
        keyPath: <keyPath>,
        autoIncrement: <bool>
    },
    indexes: {
        <indexName>: {
            keyPath:    <keyPath>
            unique:     <bool>
            multiEntry: <bool> (note keyPath needs to be an array if true)
        }
        ...
    }
},
...
```

* for `createOptions`, see [createObjectStore() docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/createObjectStore)

* for `indexes`, see [createIndex() docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/createIndex)

for clarity, here's a quick example of a `storeDefinitions` object from the included `examplePWA`:

```javascript
/*
    recipes
    the static table of recipies from the server.
    if changes are made by the user, they are queued in
    the journal table, and we apply them in chronological
    order to the record on view.
*/
recipes: {
    createOptions:  { keyPath: 'rowID' },
    indexes: {
        entryID:    { keyPath: 'entryID', unique: true},
        author:     { keyPath: 'author' },
        category:   { keyPath: 'category' },
        title:      { keyPath: 'title' }
    }
},

/*
    journal
    if the user creates a new recipe, or modifies an existing
    one, the data is written here. For changes to existing
    recipes, the 'rowId' is the 'entryID' value from the
    recipes table. Create transactions generate a GUID
    for the rowId, and subsequent changes to a created
    row share the same rowId
*/
journal: {
    createOptions:      { keyPath: 'journalId', autoIncrement: true },
    indexes: {
        rowId:          { keyPath: 'rowId' }
    }
},

/*
    menus
    contains menu values by fieldID
    objects of the form:
        {
            fieldID:  <int>,
            values:   <obj || array>
        }
*/
menus: {
    createOptions:      {keyPath: 'id', autoIncrement: true},
    indexes: {
        fieldID:        {keypath: 'fieldID'}
    }
}

```

### storeDefinitions versioning
Unlike an SQL database, *you cannot change data definitions on the fly*. For instance, if I needed to add an additional indexed field to the `recipes` dataStore in the above example, I must *shutdown* the indexedDB instance, and re-mount it with the modified `storeDefinition` to include the newly added index. This will invoke an `upgrade` event (which may take several minutes depending on the volume of data in the dataStore that was changed).

When you create a `noiceIndexedDB` object, you are creating an *interface to an indexedDB instance*, and also creating (or upgrading) that indexedDB instance. There are two attributes you must send to the constructor that identify that indexedDB instance:

* **dbName** `string` - the *name* of the indexedDB. This must be distinct within the domain on which you serve the code. For instance if I'm serving code from `hicox.com` that creates an indexedDB named `AmyDatabase`, this will be distinct in the browser from code loaded from say `godlovestrans.org` that also creates an indexedDB named `AmyDatabase`. Which is all to say **name your databases carefully within the same domain**

* **dbVersion** `integer` -
    this is the *version* of the `storeDefinition` used to create the indexedDB instance. **This number can never decrement**, that will throw an error and you won't be able to mount the db.

    For instance, if I created `AmyDatabase` with version `1`, and subsequently I decided to add an index on say the 'genre' field, then I'd need to change the JSON on the `storeDefinitions` object, but I would *also* need to increment the value of `dbVersion` to say `2`. Subsequently mounting the indexedDB would invoke the upgrade event. Once the indexedDB version has been changed, the old version cannot be mounted. There's a whole lot more detail in the MDN docs listed at the top. I highly recommend reading them. For now: just remember if you need to change the data structure you've got to increment `dbVersion`, and you can never decrement it.



---



## constructor
invoking the constructor creates a new `noiceIndexedDB` object, but does not create/mount the indexedDB instance (however, this does parse and validate storeDefinitions, etc)

### args
* **dbName** `string` (see notes above)

* **dbVersion** `integer` (see notes above)

* **storeDefinitions** `object` (see notes above)

### example
```javascript
let AmyDatabase = new noiceIndexedDB({
    dbName:          'AmyDatabase',
    dbVersion:       1,
    storeDefinitions: {
        pets: {
            createOptions:  { keyPath: 'petID', autoIncrement: true},
            indexes: {
                name:      { keyPath: 'name', unique: true },
                species:   { keyPath: 'species' },
                breed:     { keyPath: 'breed' }
            }
        }
    }
});
```




## `async open({args})`
this mounts the indexedDB instance identified by `dbName`, `dbVersion` and `storeDefinitions` specified on the constructor. This will also invoke the upgrade event as described above if a version change is detected.

### args
* **destructiveSetup** `bool, default: false` - if this is set to a value of `true`, any `dataStore` objects existing in the indexedDB but *not existing in the `storeDefinitions` object* are **deleted** when the indexedDB instance is mounted

* **setupCallback** `function(selfReference)` - if specified, we will call this function reference *if a version change is detected, requiring an upgrade event*, but before the upgrade is executed. NOTE: this is not implemented as an asynchronous callback, meaning we do not `await` the callback's return. This more of a notification for instance for driving a UI progress display, etc (though note to self: re-doing it as an `await`'d async function so you could for instance, backup data and such prior to an upgrade would be a neat enhancement)

### output
the function returns a promise that resolves to `this` when the indexedDB is finally mounted (after any upgrade event, etc exits). This allows chaining with the constructor, as in the following example:

### example
```javascript
let AmyDatabase = await new noiceIndexedDB({
    dbName:          'AmyDatabase',
    dbVersion:       1,
    storeDefinitions: {
        pets: {
            createOptions:  { keyPath: 'petID', autoIncrement: true},
            indexes: {
                name:      { keyPath: 'name', unique: true },
                species:   { keyPath: 'species' },
                breed:     { keyPath: 'breed' }
            }
        }
    }
}).open({
    destructiveSetup: true,
    setupCallback: function(selfReference){
        console.log(`upgrading ${selfReference.dbName} to version ${selfReference.dbVersion}`);
    }
}).catch(function(error){
    throw(`indexedDB open failed: ${error}`);
});
```




## `async getDescription(storeName)`
this returns a promise resolving to an object describing the specified `storeName`. If `storeName` is not given, the returned promise will resolve to an array of objects describing all `dataStore` object in the indexedDB instance. If `storeName` is given but does not exist in the indexedDB instance, the promise resolves to an error, as it will if any other errors are encountered along the way.

### output
```text.plain
[
    {
        name:           <storeNameString>,
        keyPath:        <keyPathString>,
        autoIncrement:  <autoIncrementBool>,
        count:          <numberOfRowsInteger>,
        indices:        [<arrayOfIndexNames>, ...]
    },
    ...
]
```

NOTE: `keyPath` and `autoIncrement` correspond to the `createOptions` object in the `storeDefinitions` entry corresponding to the dataStore identified by `name`


---


# CRUD Operations
the remaining functions of this class relate specifically to Creating, Reading, Updating and Deleting (`CRUD`) rows in a specific `dataStore` object. The most complicated bits of indexedDB are setting up dataStore objects, indexes, and complex queries. The CRUD operations, however, are fairly straightforward, with the exception that the API implements asynchronous operations via a cumbersome set of events and callbacks. As such, the remaining functions more or less mirror functions on the [IDBObjectStore API](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore), wrapped in promises. So where this documentation doesn't make things clear it will be greatly helpful to check out the linked operations from the API in the HTML5 spec.




## `async add({args})`
This function inserts a new object row onto the datastore specified by `storeName`, under the specified `key`. Key collisions throw errors. The function returns a promise resolving to a copy of the newly added object row upon success, and an error upon failure.

### API Documentation
[`IDBObjectStore.add()` API docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/add)

### args
* **storeName** `string` - the name of the `dataStore` object in the indexedDB to add the new object row to

* **object** `object` - the object you wish to add to the dataStore identified by `storeName`. If the object includes a value for the primary key (see `createOptions` on `storeDefinitions`) you do not need to specify `key`

* **key** `string (optional)` - if `object` does not include a value for the primary key, and if `autoIncrement` is not specified in the dataStore's `createOptions`, you can specify a value for the primary key on this argument

### example
```javascript
await AmyDatabase.add({
    storeName: 'pets',
    object: {
        name:      'Jazzy',
        species:   'Cat',
        breed:     'Calico'
    }
}).catch(function(error){
    throw(`add failed: ${error}`);
});
```




## `async put({args})`
This function is nearly identical to `add()` except that key collisions are ignored.

### API Documentation
[`IDBObjectStore.put()` API docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put)

### args
* **storeName** `string` - the name of the `dataStore` object in the indexedDB to add the new object row to

* **object** `object` - the object you wish to add to the dataStore identified by `storeName`. If the object includes a value for the primary key (see `createOptions` on `storeDefinitions`) you do not need to specify `key`

* **key** `string (optional)` - if `object` does not include a value for the primary key, and if `autoIncrement` is not specified in the dataStore's `createOptions`, you can specify a value for the primary key on this argument

### example
```javascript
await AmyDatabase.put({
    storeName: 'pets',
    object: {
        name:      'Jazzy',
        species:   'Cat',
        breed:     'Calico'
    }
}).catch(function(error){
    throw(`put failed: ${error}`);
});
```




## `async bulkPut({args})`
Do you need to pump mountains of data into a `dataStore`? This is your guy. This is `put()` with a hack -- specifically that hack is that, while inserting each row, we *don't await the exit event of the previous `put()`*. Though errors are still caught if a row fails to be inserted, simply not awaiting the exit signal before executing the next saves massive amounts of time (by a *significantly huge factor*). If you've got a couple hundred thousand rows to insert, this is pretty much the only way to do it. Think of it like Oracle's 'Data Pump' ... pretty much the same thing, except ... you know ... different.

### args
* **storeName** `string` - the name of the `dataStore` object in the indexedDB to pump the data into

* **objects** `array` - an array of objects to pump into the dataStore identified by `storeName`

### example
```javascript
await AmyDatabase.bulkPut({
    storeName:  'pets',
    objects:    thisHugeArrayOfObjectsToImport
}).catch(function(error){
    throw(`bulkPut failed: ${error}`);
})
```




## `async get({args})`
Gets a specific row object from the specified dataStore. If an index is specified, the key will be searched on that index, otherwise we will try to match the primary key (see `createOptions` in `storeDefinitions`). If the specified `key` is not found, the returned promise rejects (`messageNumber: 404`), otherwise it resolves to the requested object.

### API Documentation
* [`IDBObjectStore.get()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/get)

* [`IDBIndex.get()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/get)

### args
* **storeName** `string` - return the row matching `key` in this dataStore

* **indexName** `string, optional` - if specified, search for the row matching `key` on this index (if not specified, match the primary key)

* **key** `string` - find the row matching this key value (either the primary key or one on the index specified by `indexName`)

### example
```javascript
let data = await AmyDatabase.get({
    storeName:  'pets',
    indexName:  'name',
    key:        'jazzy'
}).catch(function(error){
    if (error.hasOwnProperty('messageNumber') && (error.messageNumber == 404)){
        throw(`record not found`);
    }else{
        throw(`get() failed: ${error}`);
    }
});
```




## `async getKey({args})`
I'm not entirely sure what this is intended for, but I'll betcha it's super useful when you want to use some advanced query techniques such as are described in `Breaking the Borders of IndexedDB` (link at the top). This appears in the API spec so I wrapped it in a promise for you :facepunch:

Basically, it looks like it's main utility is for searching a given key range?

### API Documentation
* [`IDBObjectStore.getKey()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getKey)

* [`IDBIndex.getKey()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/getKey)

### args
* **storeName** `string` - the dataStore

* **indexName** `string` - if specified search this index, otherwise by primary key

* **key** `string | IDBKeyRange` - what to look for

### example
```javascript

// get all of the pet records made in the last 24 hours
let records = await AmyDatabase.getKey({
    storeName:  'pets',
    indexName:  'createDate',
    key:        IDBKeyRange((AmyDatabase.epochTimestamp() - 86400), AmyDatabase.epochTimestamp())
}).catch(function(error){
    throw(`getKey failed: ${error}`)
});
```




## `async getAllKeys({args})`
this returns all of the keys for the keyPath on the dataStore matching the query, count and index options. NOTE: this returns only the *primary key* (see `createOptions` above), regardless of the value given for `indexName` (which controls the index used for the query but not the return value).

### API Documentation
* [`IDBObjectStore.getAllKeys()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAllKeys)

* [`IDBIndex.getAllKeys()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/getAllKeys)

* [`IDBKeyRange` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange)

### args
* **storeName** `string` - the dataStore

* **indexName** `string` - if specified execute `query` against this index, otherwise by primary key

* **query** `IDBKeyRange` - a range of key values to search for (see 'IDBKeyRange on MDN' link above, this is the closest thing to SQL's `where` we've got, and it's not really that close at all)

* **count** `integer` - maximum number of results (if you want unlimited results, don't specify this arg)

### example
```javascript
let primaryKeys = await AmyDatabase.getAllKeys({
    storeName:  'pets',
    indexName:  'createDate',
    count:      10,
    query:      IDBKeyRange((AmyDatabase.epochTimestamp() - 86400), AmyDatabase.epochTimestamp()),
}).catch(function(error){
    throw(`getAllKeys failed: ${error}`);
});
```




## `async getAll({args})`
This is as close to a `query()` function as we've got. It is `getAllKeys()`, except instead of returning the primary key of each matching row, we return instead the entire row object.


### API Documentation
* [`IDBObjectStore.getAll()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAll)

* [`IDBIndex.getAll()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/getAll)

* [`IDBKeyRange` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange)

### args
* **storeName** `string` - the dataStore

* **indexName** `string` - if specified execute `query` against this index, otherwise by primary key

* **query** `IDBKeyRange` - a range of key values to search for (see 'IDBKeyRange on MDN' link above, this is the closest thing to SQL's `where` we've got, and it's not really that close at all)

* **count** `integer` - maximum number of results (if you want unlimited results, don't specify this arg)

### example
```javascript
let matchingRows = await AmyDatabase.getAll({
    storeName:  'pets',
    indexName:  'createDate',
    count:      10,
    query:      IDBKeyRange((AmyDatabase.epochTimestamp() - 86400), AmyDatabase.epochTimestamp()),
}).catch(function(error){
    throw(`getAllKeys failed: ${error}`);
});
```




## `async clear({args})`
this deletes all row objects from the dataStore identified by `storeName`

### API Documentation
* [`IDBObjectStore.clear() on MDN`](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/clear)

### args
* **storeName** `string` - the dataStore to delete all rows on

### example
```javascript
await AmyDatabase.clear({
    storeName:  'pets'
}).catch(function(error){
    throw(`clear() failed: ${error}`);
});
```




## `async count({args})`
this counts the number of row objects on the dataStore identified by `storeeName`, optionally matching the given `query` otherwise all.

### API Documentation
* [`IDBObjectStore.count()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/count)

* [`IDBIndex.count()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/count)

* [`IDBKeyRange` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange)

### args
* **storeName** `string` - the dataStore to query

* **indexName** `string (optional)` - if specified, execute `query` against this index, otherwise against primary key.

* **query** `IDBKeyRange` - a range of key values to search for (see 'IDBKeyRange on MDN' link above)

### example
```javascript
let rowCount = await AmyDatabase.count({
    storeName: 'pets',
    index:      'createDate',
    query:      IDBKeyRange((AmyDatabase.epochTimestamp() - 86400), AmyDatabase.epochTimestamp())
}).catch(function(error){
    throw(`count failed: ${error}`);
})
```




## `async openCursor({args})`
opens a `cursor` on the dataStore identified by `storeName`, traversing row objects optionally matching the specified `query` against the index identified by `indexName`, otherwise all. The cursor executes the specified `callback` function for each row traversed by the cursor.

Also NOTE: the cursor callback itself is responsible for advancing the cursor one or more rows in the search result group,

This can blindly iterate all rows on a dataStore (analogous to an SQL table scan) astoundingly quickly. Using sort options on indexes, and clever logic for advancement of the cursor callback as described in 'Breaking the Borders of IndexedDB' article (link at the top) you can emulate surprisingly advanced analogs to many SQL query functions.

### API Documentation
* [`IDBObjectStore.openCursor()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor)

* [`IDBIndex.openCursor()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/openCursor)

* [`IDBKeyRange` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange)

* [`IDBCursorWithValue` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursorWithValue)

### args
* **storeName** `string` - the name of the dataStore to open the cursor on

* **indexName** `string` - if specified use the given index, else primary key

* **query** `IDBKeyRange (opional)` - if not specified, all rows, otherwise, matching rows

* **direction** `enum(next, nextunique, prev, prevunique), default: next` - traverse the query result in this direction (see docs above for details)

* **callback** `function(cursor)` - execute this callback with the `cursor` object (this is an `IDBCursorWithValue` object, see doc links above)

### example
```javascript
await AmyDatabase.openCursor({
    storeName:  'pets',
    callback:   function(cursor){
        /*
            do something for every row
            how about print it to the console?
        */
        if (AmyDatabase.isNotNull(cursor)){
            console.log(cursor.value);
            cursor.next();
        }
    }
}).catch(function(error){
    console.log(`openCursor failed: ${error}`);
});
```




## `async openKeyCursor({args})`
This is the exact same thing as `openCursor()` with the exception that the `cursor` object is an `IDBCursor` instead of an `IDBCursorWithValue`, which means `cursor.key` has a value, and `cursor.value` is undefined. If you have unimaginably large datasets to traverse, or you're up to your eyeballs building optimized searches this is your guy.

### API Documentation
* [`IDBObjectStore.openCursor()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor)

* [`IDBIndex.openCursor()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/openCursor)

* [`IDBKeyRange` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange)

* [`IDBCursor` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor)

### args
* **storeName** `string` - the name of the dataStore to open the cursor on

* **indexName** `string` - if specified use the given index, else primary key

* **query** `IDBKeyRange (opional)` - if not specified, all rows, otherwise, matching rows

* **direction** `enum(next, nextunique, prev, prevunique), default: next` - traverse the query result in this direction (see docs above for details)

* **callback** `function(cursor)` - execute this callback with the `cursor` object (this is an `IDBCursor` object, see doc links above)

### example
```javascript
await AmyDatabase.openKeyCursor({
    storeName:  'pets',
    callback:   function(cursor){
        /*
            do something for every row
            how about print it's key to the console?
        */
        if (AmyDatabase.isNotNull(cursor)){
            console.log(cursor.key);
            cursor.next();
        }
    }
}).catch(function(error){
    console.log(`openKeyCursor failed: ${error}`);
});
```




## `async deleteObject({args})`
deletes the row object on the dataStore identified by `storeName`, matching the specified `key`.

### API Documentation
* [`IDBObjectStore.delete()` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/delete)

* [`IDBKeyRange` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange)

### args
* **storeName** `string` - name of the dataStore to delete the row from

* **key** `string | IDBKeyRange` - delete the row(s) matching the specified primary key or IDBKeyRange

### example
```javascript
await AmyDatabase.deleteObject({
    storeName:  'pets',
    key:        '4'
});
```




## `async mergeObjects({args})`
This is a convenience function (not in the API), allowing you to send one or more objects to a datastore, and define behavior on key collisions. For instance you could send a batch of rows and on key collisions only write changed attributes to the row (or define a custom callback to handle the key collision).

### args
* **storeName** `string` - the name of the dataStore to write the row(s) to

* **objects** `array` - array of one or more objects to write to the dataStore

* **merge** `enum(update, overwrite, skip) | function` - this argument specifies the behavior on a key collision. If a function reference is given, it must be asynchronous and will be called with three arguments: `(selfReference, newObject, oldObject)` and must return an object (the returned object replaces the existing object in the dataStore). Other modes:

    * **update** - only write changed fields (blindly write new attributes, touch nothing else on the existing object)

    * **replace** - replace entire object with new object (delete the old object, write the new one)

    * **skip** - skip key collisions entirely (do nothing)

### output
this returns a promise either rejecting in the case of an error or resolving to an array of objects of this form (indicating the disposition of each row in the `objects` argument):
```text.plain
[{
    key:         <key>,
    disposition: <enum(created, updated, overwritten, skipped, error)>,
    errorObject: <errorObject> (if disposition = 'error')
}]
```

### example
```javascript
let result = await AmyDatabase.mergeObjects({
    storeName:  'pets',
    objects:    bigArrayOfPetObjects,
    merge:      'update'
}).catch(function(error){
    throw(`mergeObjects failed: ${error}`)
});
```
