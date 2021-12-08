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


## requires

* **noiceCore.js** (`noiceCoreUtility`)
* **noiceCoreUI.js** (`noiceCoreUIElement`)


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
This class is incomplete and needs work. At present, it is effectively read-only (meaning it can  display data but cannot take user input). The `value` attribute can accept epoch (integer) or ISO-8601 format dateTime strings only. The format displayed to the user is determined by the user's locale settings (see `noiceCore.fromEpoch()`)

## Example
```javascript
let myDateTime = new noiceCoreUIFormElementDateTime({
    name: 'pickupTime',
    label: 'pickup time',
    valueChangeCallback: async function(newValue, oldValue, selfReference){
      console.log(`${selfReference.name} -> value changed from: ${oldValue} to ${newValue}`);
      return(newValue)
    }
}).append(document.body);

// set value to current time
myDateTime.value = myDateTime.epochTimestamp();

```



---



# `noiceCoreUIFormElementPassword`
this is a char field, with `type="password"` and with masked out chars. You know ... like you'd use for a password. :smile:

It has no attributes and functions beyond those inherited from `noiceCoreUIFormElementInput`

## Example
```javascript
let myPassword = new noiceCoreUIFormElementPassword({
    name: 'pass',
    label: 'password',
    valueChangeCallback: async function(newValue, oldValue, selfReference){
      console.log(`${selfReference.name} -> I gochyo password sucka!: ${newValue}`);
      return(newValue)
    }
}).append(document.body);
```



---



# `noiceCoreUISelect`
your basic drop-down menu. supports `labelLocation = 'embed'`

## Attributes

* **values** `<array>` - list of values for the dropdown menu.

    ```javascript
    // as a flat list of strings
    noiceCoreUISelect.values = [ 'option 1', 'option 2', 'option 3'];

    // as an array of objects with labels (a cascading menu)
    noiceCoreUISelect.values = [
        { label: 'cats', values: ['meowry', 'bootsie', 'lilly', 'chonkerton', 'mo', 'jazzy'] },
        { label: 'dogs', values: ['scotty', 'missy', 'grizzly', 'molly']}
    ];

    // as an array of objects (value aliases)
    noiceCoreUISelect.values = [
        { 0: 'New' },
        { 1: 'Assigned' },
        { 2: 'Error' },
        { 3: 'Work in Progress' },
        { 4: 'Resolved' },
        { 5: 'Complete' },
        { 6: 'Archive' }
    ];
```

* **includeNull** `<bool>, default: true` - include a null option (i.e. "no choice"). If false, do not allow null selection.

* **selectedOption** `<integer>` - the `index` of the currently selected value. Setting this value changes the selected value as well.

* **selectedOptionElement** `<Element>` - the `Option` element within the `select` element that is currently selected

* **selectedOptionLabel** `<string>` - the 'label' (if specified) of the selected option, else the selected option's `textContent`

* **selectedOptionGroup** `<string>` - the 'label' of the optionGroup parent of the currently selected option (if within a cascading menu -- see above) -- that is -- what sub-menu the selected option is inside of

## Example
```javascript
let mySelect = new noiceCoreUIFormElementSelect({
    name: 'petName',
    label: 'pet name',
    labelLocation: 'top',
    values:[
    	{ label: 'cats', values: ['meowry', 'bootsie', 'lilly', 'chonkerton', 'mo', 'jazzy'] },
    	{ label: 'dogs', values: ['scotty', 'missy', 'grizzly', 'molly']}
    ],
    valueChangeCallback: async function(newValue, oldValue, selfReference){
        console.log(`${selfReference.name} -> value changed from: ${oldValue} to ${newValue}`);
        return(newValue)
    }
}).append(document.body)
```



---



# `noiceCoreUIFormElementText`
This is very similar to `noiceCoreUIFormElementInput` with the exception that the `formElement` is rendered as a [`<textarea>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea), so (if specified) the element can have multiple rows.

## Attributes

* **autocapitalize** `enum(none, sentences, words, characters), default: none` - as you might expect, if set to an option other than 'none', init-cap's sentences, words or chars

* **cols** `integer, default: 20` - allow this many characters on a single row

* **rows** `integer, default: 1` - allow this many rows

* **wrap** `enum(off, hard, soft), default: off` - if set, wrap lines with the specified method (see textarea MDN docs link above)

## Example
```javascript
let myText = new noiceCoreUIFormElementText({
    name: 'instr',
    label: 'special instructions',
    labelLocation: 'top',
    cols: 40,
    rows: 10
}).append(document.body);
```



---



# `noiceCoreUIFormElementNumber`
This is a number input with  stepper UI buttons and a specifiable step increment. [See Number Input Docs on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)

*NOTE:* hiding and otherwise CSS styling the "spinner" (value stepper) buttons is a *complete hassle* but is possible though CSS styling but is seemingly inaccessible from javascript [see docs](https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-inner-spin-button)

## Attributes

* **min** `number` - minimum numeric value

* **max** `number` - maximum numeric value

* **step** `number` - increment for the stepper ("spinner") UI buttons (see docs link above)

## Example
```javascript
let myNumber = new noiceCoreUIFormElementNumber({
    name: 'count',
    label: 'count',
    labelLocation: 'top',
    min: 0,
    max: 10,
    step: 1
}).append(document.body);
```


---



# `noiceCoreUIFormElementDate`
This is a date input with a browser-native (decidedly lo-fi) date picker. This is an extension of `noiceCoreUIFormElementNumber` as this class also uses the `min`, `max` and `step` attributes. This is an `<input>` element with `type="date"` [see docs on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)

NOTE: browser implementations of the date element vary wildly. Generally this seems ok on Firefox & Safari,(mobile & desktop) however these platforms don't render value increment (spinner) buttons, but instead a calendar based date-picker (which is actually quite nice) and respects `min` & `max`.

Overall this is pretty good, and it beats the hell out of homegrown date-picker things. That being said, check it out on your target platform before you trust it.

## Attributes

* **min** `date string (yyyy-mm-dd)` - the minimum allowed date value

* **max** `date string (yyyy-mm-dd)` - the maximum allowed date value

* **step** `integer` - number of days for one increment of the value stepper "spinner" buttons

## Example
```javascript
let myDate = new noiceCoreUIFormElementDate({
    name: 'bDay',
    label: 'birthday',
    labelLocation: 'top',
    min: `1974-10-03`,
    max: `2021-12-03`,
    step: 1
}).append(document.body);
```



---




# `noiceCoreUIFormElementCheckbox`
this is an input with `type="checkbox"` see [documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox).

## Attributes

* **value** `bool` - unlike the HTML checkbox primitive it is based on, the `value` attribute is a boolean value where `true` has the checkbox selected and `false` if not (this value is settable as well)

## Example
```javascript
let myCheck = new noiceCoreUIFormElementCheckbox({
    name: 'doIeet',
    label: 'do it?',
    labelLocation: 'left',
    valueChangeCallback: async function(newValue, oldValue, selfReference){
        console.log(`${selfReference.name} -> value changed from: ${oldValue} to ${newValue}`);
        return(newValue)
    }
}).append(document.body);
```



---



# `noiceCoreUIFormElementFile`
This implements a file input. In addition to the good old file selector, these can be used to capture stills and video from cameras and audio from microphones via the [`capture` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)

getting access to the File objects can be tricky and requires use of the [`File API`](https://developer.mozilla.org/en-US/docs/Web/API/File), See also [this handy documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications)

## Attributes

* **accept** `string (mimeType)` - passthrough to [`accept` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept)

* **multiple** `bool, default: false` - passthrough to [`multiple` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/multiple)

## Example
```javascript
let myFile = new noiceCoreUIFormElementFile({
    label:              'file',
    labelLocation:      'top',
    valueChangeCallback: function(newValue, oldValue, selfReference){
        /*
            for the file input we get fileList objects:
            https://developer.mozilla.org/en-US/docs/Web/API/FileList

            you may be interested in this as well:
            https://developer.mozilla.org/en-US/docs/Web/API/File

            oldValue is just a second copy of newValue as the FileList
            returned by the change event is a pointer to whatever is currently
            selected in the file widget. If that's a problem, you could
            override the setter and actually grab the file contents, but this
            seems like overkill and I'm not actually sure I'd want it to work that way.

            here's a quickie demo. if you give it a CSV file, we'll try to read it
            and report some stats, otherwise just file properties. not testing
            multiple files with this one though that might be a good next step
        */

        // report new file if we've got one
        let that = selfReference;
        if ((this.isNotNull(newValue)) && (newValue.length > 0)){
            console.log('new file:');
            // spit some stats
            ['name', 'lastModified', 'size', 'type'].forEach(function(a){
                if (a == 'lastModified'){
                    console.log(`\t[${a}]: ${that.fromEpoch(newValue[0][a], 'dateTime')}`);
                }else{
                    console.log(`\t[${a}]: ${newValue[0][a]}`);
                }
            });

            // is it a csv?
            if (newValue[0].type == 'text/csv'){
                // do csv thangs ...
                let reader = new FileReader();
                reader.onload = function(evt){
                    // evt.target.result has the entire csv file as a strang
                    let rows = 0;
                    evt.target.result.split(/\n/).forEach(function(row,rowNum){
                        // dumb test
                        rows++;
                    });
                    console.log(`\t[CSV Row Count]: ${rows}`)
                }
                reader.readAsText(newValue[0]);
            }
        }

    }
}).append(document.body);
```
