# NOTE 11/19/21 -- this documentation is incomplete

# formView.js

insert overview here




## error message numbers

1. bad config object
2. unknown field type
3. failed to instantiate formElement
4. no fields in config
5. duplicate fields in config
6. form mode change prevented
7. value on data setter is not object
8. setting value for field (set data) failed
9. filter threw error preventing save
10. filter exited preventing save (soft error)
11. saveCallback cancelled save
12. failed validation




## configuration format

this is the configuration datastructure. This is passed to the `this.config` attribute setter

```javascript
config = {
    fields:  { <fieldName>: {<fieldConfig>} },
    menus:   { <fieldName>: [menuValuesObject] },
    filters: []
}
```

* the `fields` key contains an object of the form `{ <fieldName>: {<fieldConfig>} ...}`, where:

    * **fieldName** (string)

    this is a *unique key* identifying a field in the formView.

    * **fieldConfig** (object)

    this is an object containing properties of the **formElement** identified by <fieldName>.
    This is an example of a fieldConfig object for a field with `fieldName: 'entryID'`

    ```javascript
    this.config.fields = {
        entryID: {
            type: 'char',
            maxLength: 15,
            label: 'Entry ID',
            labelLocation: 'left',
            labelLength: '14.754060723vw',
            valueLength: 'auto',
            displayOrder: 1,
            displaySection: 'identification',
            modes: {
                modify: { display:true, edit:false, nullable:true },
                create: { display:false, edit:false, nullable:true },
                clone:  { fieldMenu:false, inheritValue:false, nullable:true }
            }
        },
        ...
    }
    ```
    the root-level attributes are passed to the constructor of `noiceCoreUIFormElement` subclass corresponding to the `type` attribute (as defined in the `formView.getFormElement()` static class function, see below). The 'modes' object contains a tree of attribute values to be set by the `setFormMode()` function when the value of `this.formMode` is changed, where the `formMode` string value corresponds to a key of this object. For instance, in the example above, we set `display: true, edit: false, nullable:true` when `this.formView = 'modify'`

* the `menus` key contains an object of the form `{ <fieldName>: [menuValuesObject], ...}` where the `fieldName` key corresponds to a formElement field defined in the `fields` section of the config. The key points to an object compatible with the `values` setter of `noiceCoreUIFormElementInput` descendant classes (that is any formElement that can support a value list, so selects and type-ahead menus)

* the `filters` key is an object of this form:

    ```
    {
        <filterName>: {
            name:       <filterName>,
            enabled:    <bool>,
            executeOn:  <enum: save | validate | user-defined>,
            order:      <int>,
            formModes:  [ array, of, formModeStrings],
            executor:   async function(formViewReference, pipeData){

                // do stuff here

                return({
                    abort: <bool>,
                    pipeData: {<arbitrary data>}
                })
            }
        },
        ...
    }
    ```

    this object defines a set of `filter` objects (think unix-style filter in a pipe chain). These filter objects are executed in sequence ordered by the `order` (least < greatest), within the group of filter objects matching a given value of `executeOn`. There's a lot to write about here, see the **Filters** section below


## commonly overridden methods


### `get html()`
override this attribute getter to change the default html template for
`formMode: 'create'` and `formMode: 'modify'`


### `get cloneViewHTML()`
override this attribute getter to change the default html template for `formMode: 'clone'`


### `handleTemplate()`
override this attribute getter to setup the html template for a handle for the formView. Set `data-templatename` attributes in the HTML template to the `fieldName` of a field in the config to insert the `value` of that formElement into the handle when it changes (so for instance use `<span data-templatename="title"></span>` in your HTML template to have a text element in the handle containing the current value of the `title` formElement that is updated when the user changes the value of that field).


### `setupCallback()`
this callback executes *before* render, but *after* instantiation. This is useful
for setting up custom setup logic, however NOTE: child classes that override this function must call `super.setupCallback()` at the top of the function before other code. It's more likely you'll want to override `firstFocusCallback()` instead


### `firstFocusCallback()`
this callback fires the first time the UI is given focus. This is handy for setting up data structures, initializing menu values, etc. Unlike `setupCallback()`, there is no hard-coded class infrastructure present here, so this is safe to override without needing to make `super.*` calls. NOTE: formerly known as the `setup()` function.


### `renderCallback()`
this callback executes *after* the html is rendered, this is handy for setting up hooks and such. However, if you need to override this, be sure to call `super.renderCallback()` as there are bits of hard-coded object infrastructure here.


### `onScreenCallback()`
this callback is executed each time the UI is appended to an on-screen DOM element


### `async formModeChangeCallback(formMode)`
this asynchronous callback is executed each time the value of `*.formMode` is changed. If this function returns a rejected promise, the formMode change will not execute, so this callback can cancel formMode changes. Values of `formMode` are, in general, completely arbitrary, but generally are 'create', 'modify', and 'clone'


### `async fieldValueChangeCallback(fieldName, newValue, oldValue, formElement)`
this callback fires for every value change on every formElement, before the changeFlag is set (or unset). This function must return a promise. If that promise rejects, the field's value will not be changed. Whatever value your promise resolves to will be set as the field's value. In this way, you can intercept and modify field value changes. However, depending on your use case, using filters defined n the config will likely be the more extensible solution for logic meant to fire on field value changes. Arguments are as follows:

1. fieldName
the name of the field as defined in the configuration (`this.config.fields[<fieldName>]`)

2. newValue
the value the field is *changing to*

3. oldValue
the value the field is *changing from*

4. formElement
pointer to the formElement object for the field identified by <fieldName>


### `async saveCallback(formViewReference)`
this asynchronous callback function is executed when the user clicks the saveButton in all formModes except `formMode: 'clone'` (in that special case, we execute `cloneCallback(formViewReference)`, see below); If this function returns a rejected promise, the save is cancelled, and the changeFlag is not reset. If this function returns a resolved promise, the `changeFlag` is reset to a value of `false`. This function receives an input parameter of a pointer to self (the `formViewReference`) such that it can be defined completely externally of the child class if needed.


### `async cloneCallback(formViewReference)`
`this.cloneView` (that is the duplicate of self with `formMode: 'clone'`, see `get cloneView()` below), will see this as the `saveCallback`. This is executed *instead of the saveCallback()* when `formMode: 'clone'`. This allows you to define code to execute when the user saves a clone of the current object (for instance, not only writing indexedDB or a network resource, but also adding handles to the DOM and inserting new views into a UIHolder, etc -- see `recordEditorUI.js`). As with the saveCallback(), returning a rejected promise will cancel the save, and resolving will reset the changeFlag, etc.


### `async loseFocusCallback(formViewReference)`
this fires when `this.close()` is called, before the changeFlag is checked, the uiHolder removal and handle removal. Returning a rejected promise will cancel the close, returning a resolved promise allows you to continue. This is handy for saving state, etc.


### `async cloneableCallback(formViewReference, newBoolValue)`
this fires when the value of the `this.cloneable` attribute is changed, this mechanism exists primarily as a means to manage the state of btnClone in `recordEditorUILayout`. Like all the other callbacks, returning a resolved promise, allows the cloneable value change, and rejecting cancels it.


### `async removeFieldCallback(fieldName, formElement)`
this fires whenever the user clicks `btnRemove` on a formElement this is primarily useful in `formMode: 'clone'`, for managing the available fields list for the dropdown menu. As with other callbackes, rejected promise cancels the operation and resolved promise allows it to continue (for instance one could check changeFlag on the field, render an 'are you sure?' dialog before removing the field, etc)


### `async gainFocus(focusArgs)`
this is fired when `focus: true` is set (typically this will be within the context of a uiHolders `switchUI()` call). This is a handy place to do dynamic things when a formView gains focus (for instance sending args from another UI Screen, etc). As will the other async callbacks, return a rejected promise to abort, and a resolved promise to continue


### `rowID(value)`
`this.rowID` is the unique identifier of the formView *instance*, which allows your app to differentiate between many such formView instances. For instance in the case where you are rendering search results, and a background thread needs to update an already instantiated formView with data from the server, or a transmit status or what have you ... this is it's unique value. By default this is set to a dynamically-generated GUID at instantiation.




## infrastructure functions


### `formMode` (attribute)
this indicates the mode of the formView. These values can be arbitrarily defined, however, by default we have these three modes:

1. create
a formView mode for creating new rows

2. modify
a formView mode for modifying existing rows

3. clone
a formView mode for creating copies of existing rows, replacing selected values with new user input


### `setFormMode(formMode)`
this asynchronous function is invoked from the `formMode` value setter. This invokes the `formModeChangeCallback()` (see above) and applies properties to formElements defined in the `modes` object of the field's entry in the config (if defined). For example:

```
fields: {
    fieldName:  {
        type:   'char',
        label:  'fieldName',
        ...
        modes: {
            modify: { display:true, edit:false, nullable:true },
            create: { display:false, edit:false, nullable:true },
            clone:  { fieldMenu:false, inheritValue:false, nullable:true }
        }
    },
    ...
}
```


### `config` (attribute)
the `this.config` attribute setter parses the given string as JSON, instantiating `formElement` objects for each field defined in the config (see above).

```javascript
/*
    LOH - 10/4/21 @ 2301
    need to go ahead and write up everything about filters below, but we also
    need to finish running down the methods above. We don't even have `save()` yet.
*/
```




## Filters.

hooo-boy, I'll tell ya what.
