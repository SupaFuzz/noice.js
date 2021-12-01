# noiceCoreUIFormElement.js

This file contains `noiceCoreUIElement` extension classes modeling [Form Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form). These can be used standalone, or within the context of a `formView`.

This file contains the following class tree:

* noiceCoreUIFormElement
    * noiceCoreUIFormElementInput
        * noiceCoreUIFormElementDateTime
        * noiceCoreUIFormElementPassword
        * noiceCoreUIFormElementSelect
        * noiceCoreUIFormElementText
        * noiceCoreUIFormElementNumber
            * noiceCoreUIFormElementDate
        * noiceCoreUIFormElementCheckbox
        * noiceCoreUIFormElementFile



---



# `noiceCoreUIFormElement`

This is the base class from which all other formElements descend.


## Synopsis

This class is a base class from which all of the formElement classed derive. As such you'd never directly make an object of this class, and it has no HTML template. This base class provides infrastructure common across all of the subclasses. So rather than the usual code dump for the Synopsis, it's more useful to talk about features provided by the class.


Ok so basically every derived subclass is going to render DOM content resembling this:
```
    this.labelLocation: left
     _____________   ______________________   ___________
    |    label    | |    field             | |  buttons  |
     -------------   ----------------------   -----------
    |    validation errors                               |
     -----------------------------------------------------

     this.labelLocation: top
     _____________  
    |    label    |
     -------------   
     ______________________   ___________
    |    field             | |  buttons  |
     ----------------------   -----------
    |    validation errors               |
     ------------------------------------

     this.labelLocation: none & embed
     ______________________   ___________
    |    field             | |  buttons  |
     ----------------------   -----------
    |    validation errors               |
     ------------------------------------     

```
The `validation errors` is only visible when the object contains validation errors. Likewise the `buttons` area is hidden in most cases and is only shown when you've got buttons explicitly enabled (for instance `this.undoable`)

The `field` in the diagram above, is an [HTML Form Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form). Typically an `input` or `textarea` but there are many. In the object, a reference to the DOM Element object for it is on the `this.formElement` attribute.

These objects have a `this.value` attribute that corresponds to the value currently in the `formElement`. If defined, the `valueChangeCallback()` is executed when `value` changes. This change in value is detected by an eventHandler (for instance `return` or `focusout` -- see `this.captureValueOn` attribute below).

When the `undoable` flag is set `true`, the object records the previous value when a value change is captured. This also will render the undo button and show the `buttons` section above

But basically, the gist of these is that there's a field (`this.formElement`), you can get or set it's value on via `this.value`, when the value changes (as defined by `this.captureValueOn`), we execute the `this.valueChangeCallback()` function (if defined)

that's the gist of it. There are an incredible number of options and details (see below)

## Attributes

* **validationErrors** `object` - an object of the form `{ <errorNumber>: <errorObject<>, ... }`. Within the context of a `formView`, when the `formView.validate()` function is called, any validation errors associated to this field will be inserted into this object where the key is the `<errorNumber>` and the value is a `<validationError>` object.

* **hasErrors** `bool` - this attribute is `true` when the `validationErrors` attribute contains at least one `<errorNumber>` key,

* **showValidationErrors** `bool` - if set to a value of `true`, the `validationErrorSection` Element is inserted into `this.DOMElement`, and any `<validationError>` objects present on `this.validationErrors` are rendered into it, showing the errors adjacent to the `formElement`. If set to `false` removes the `validationErrorsSection` from `this.DOMElement`;

* **dir** `enum(ltr, rtl, auto)` - passthrough to [`dir attribute`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir)

* **labelLength** `string (css passthrough), default '1em'` - length of label

* **valueLength** `string (css passthrough), default: '1fr'` - length of value

* **display** `bool, default: true` - if true show the element (`display: grid;`) else don't (`display: none;`)

* **edit** `bool, default: true` - if true, allow the user to set/change value on the field. Otherwise lock it

* **enable** `bool, default: true` - passthrough to [`disabled` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled). If true, field is enabled, if false, disabled

* **nullable** `bool, default: true` - if true, the field is allowed to carry a null value, otherwise a validation error is thrown if the field is null on a `validate()` call. Setting this field true also adds `this.requiredFieldClass` to the classList, and setting false removes it.

* **label** `string` - use this string for the label

* **labelLocation** `enum(left, top, none, embed)` sets the location of the label. The `embed` option only works with subclasses that support it (for instance drop-down menus where the first option is not selectable and is the label for instance "select a value", etc)

* **labelClass** `string` - set this string value on the CSS `classList` of the label

* **fieldClass** `string` - set this string value on the CSS `classList` of the formElement

* **name** `string` - (optional) 'name' of the formElement as separate and distinct from the label (this is often more handy than you'd think)

* **value** `string` - the current value in the formElement

* **oldValue** `string` - the value present on the formElement, before the current `value` was set. If there is no previous value, `null`

* **defaultValue** `string` - if a non-null value is given, set this as the initial value of the field when instantiating it. Callbacks are invoked when setting the defaultValue.

* **hasFormElement** `bool` - there is a phase during instantiation before `super.render()` has been called in which it is possible to set values and attributes of the object but the `formElement` has not yet been spawned into `this.DOMElement`. This attribute returns `true` if `this.DOMElement` contains the `formElement`, otherwise `false`

* **formElementLabel** `Element` - returns the DOMElement of the label object

* **formElement** `Element` - this is DOM element of the HTML base layer form element (an 'input', 'select', 'file', etc)

* **captureValueOn** `enum(focusout, return, focusoutOrReturn, keydown, input, change)` - specify the event(s) upon which we determine that the `value` has been set/changed and invoke the `valueChangeCallback()`

* **showButtons** `bool` - if true, display the buttonContainer

* **undoable** `bool` - if true, render the undo button in the buttonContainer, allowing the user to undo the last value change

* **removable** `bool` - if true, render the 'remove' button in the buttonContainer. Within a dynamic `formView`, this allows the user to remove the field from the view. Clicking the 'remove' button executes the `removeCallback()` if specified

* **hasExternalButtons** `bool` - this attribute returns true if external buttons are defined

* **externalButtons** `array` - if specified, this array of HTML `Element` objects (presumably buttons but I mean hey anything you want I guess) is inserted into buttonContainer, and displayed adjascent to the formElement if `showButtons` is true (attach your callbacks externally)

## Functions

* **`hasError(<errorNumber>)`** - returns boolean `true` if `this.validationErrors` contains a key matching `<errorNumber>`, else `false`

* **`addValidationError(<errorObject>)`** - set the given `<errorObject>` as the value associated to the key `<errorObject>.errorNumber` on `this.validationErrors`

* **`removeValidationError(<errorNumber>)`** - the opposite of `addValidationError()`, if `this.validationErrors` has a key matching `<errorNumber>`, delete it.

* **`clearValidationErrors()`** - remove all keys from `this.validationErrors`, and call `toggleValidationErrorClass()`

* **`toggleValidationErrorClass()`** - if `this.hasErrors == true`, add `this.validationErrorClass` to the classList  of `this.DOMElement` and set `this.showValidationErrors = true`. Else, remove `this.validationErrorClass` from the classList and set `this.showValidationErrors = false`

* **`resetOldValue()`** - if `this.undoable == true`, reset `this.oldValue` to `null` when this function is called.

* **`async setValue(<value>)`** - same as directly setting the `value` attribute, except that a promise that is rejected if callbacks throw, and resolves when/if the given `value` is set on the formElement

* **`setValueDirect(<value>)`** - same as directly setting the `value` attribute *except that no callbacks are invoked*

* **`setFocus()`** - give focus to the `formElement`

* **`toggleDefaultValueStyle()`** - if `this.value == this.defaultValue`, add `this.defaultValueClass` to the formElement's classList, otherwise remove it

* **`resetCaptureHooks()`** -- NOTE THIS NEEDS REWORK -- attempts to remove the eventListeners from `captureValueOn`

* **`captureValue(<event>)`** - this function is invoked by event(s) attached to the `formElement` (see `captureValueOn` attribute above). This invokes the `valueChangeCallback()` if specified

* **`setup()`** - internally called, sets up the formElement after render()



---



# `noiceCoreUIFormElementInput`
This class implements your standard 'character field', and supports `labelLocation: embed`. This also supports "typeahead" menus (value suggestions really, unless you enforce it on your own)

## Attributes

* **values** `Array` - list of values for typeahead menu

* **maxLentgh** `integer` - maximum number of characters accepted by the `<input>` objects

* **minLength** `integer` - passthrough to [minlength input attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/minlength)

* **readonly** `bool` - if true, the field is locked in the UI and its value can only be set programmatically

* **size** `integer` - passthrough to [size input attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/size)

* **spellcheck** `bool` - if true enable spell check feature

* **autocorrect** `bool` - if true (and the environment supports it), enable autocorrect (mobile, mostly)

* **autocomplete** `enum(off, on ... so many, see link)` - passthrough to the [autocomplete feature](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)

* **required** `bool` - in a `formView` context, a validation error will be thrown upon `validate()` if the `this.value` is null. also a passthrough to the [required attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required)

## Functions

### `updateOptions()`
This is internally triggered by setting the `this.values` attribute. This function syncs `this.values` into the [datalist](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist) object associated to `this.formElement` (for typeahead functionality)

### `embedLabel()`
this handles embedding the label (called internally)

## Example
```javascript
let myInput = new noiceCoreUIFormElementInput({
    name: 'petName',
    label: 'pet name',
    labelLocation: 'top',
    maxLength: 80,
    autocomplete: 'on',
    values: ['jazzy', 'mo', 'lucy', 'lilly', 'garfield'],
    required: true,
    valueChangeCallback: async function(newValue, oldValue, selfReference){
        console.log(`${selfReference.name} -> value changed from: ${oldValue} to ${newValue}`);
        return(newValue)
    }
}).append(document.body);
```



---
# `noiceCoreUIFormElementDateTime`

## LOH 11/30/21 @ 1821
