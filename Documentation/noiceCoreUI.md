# noiceCoreUI.js
this file contains classes for constructing user interfaces (that is, interacting with the DOM inside the noice object model). This file contains the following class tree:

* noiceCoreUIElement
    * noiceCoreUIOverlay
        * noiceCoreUIDialog
            * noiceCoreUIYNDialog
            * noiceCoreUIHeaderMenu
        * noiceCoreUIScreen
        * noiceCoreUIScreenHolder
        * noiceCoreUIFloatingDialog

## requires

* **noiceCore.js** (`noiceCoreUtility`)

---    



## `noiceCoreUIElement`
This is an object model for any visible UI component you want to place on the screen. Inside the noice framework, every visible UI element is a subclass of this base class. In general, you subclass this parent class and override the `html` attribute getter.

## creating a subclass is not strictly necessary
```javascript
// create element and add it to document.body
let hiThere = new noiceCoreUIElement({
    message: "Hi There!",
    getHTMLCallback: function(selfReference){
        return(`<h1 data-templatename='message' data-templateattribute='true' style="color: red;"></h1>`);
    },
    renderCallback: function(selfReference){
      selfReference._DOMElements.message.addEventListener('click', function(event){
            selfReference._DOMElements.message.textContent = 'you clicked me!'
        })
    }
}).append(document.body);

// change the message
hiThere.message = "I changed the message!"

// remove it
hiThere.remove();

// add it back
hiThere.append(document.body);
```    

OKAY, so that's a quick and dirty intro to what's happening here. Brace yourself, the details are coming :smile:

## ogres are like onions, donkey
So you need to put some stuff on the screen. At the end of they day, that "stuff" is going to end up as Elements in the DOM. There's basically two ways that can happen: you can manually construct some elements using the [DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), which while cumbersome and extraordinarily verbose, allows the greatest flexibility ... or you could just write some HTML and insert it into the DOM via methods like [`innerHTML()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) and [`insertAdjascentHTML()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML).

There are ways to use both methods with `noiceCoreUIElement`, though primarily we are concerned with the later (writing HTML).

When you create a `noiceCoreUIElement` object (or an object of a `noiceCoreUIElement` extension class), there are some layers we go through in this order:

1. **get html**

    the class constructor is going to attempt to get it's own HTML content. In subclasses, this is accomplished by overriding the `get html()` attribute getter. Outside of a subclass (as in the example above), you can specify a callback function (`getHTMLCallback`). You can specify two dataset attributes on elements in the HTML that are very handy:

    * `data-templatename='<string>'`

       specify a unique name on this dataset attribute, and the `render` phase will pull a reference to the corresponding DOM element and place it on `this._DOMElements[<string>]`

    * `data-templateattribute='<bool>'`

       if you specify a (string) value of "true" on this attribute, the `render` phase will create an object attribute matching `data-templatename`. The getter for this attribute will return the `textContent` of the DOM element, the setter for this attribute (if you send it a string) will set the `textContent`, if you send an `Element` object, it will be appended.

2. **render**

    the `render()` function is called by the constructor after the HTML content has been obtained (see above). This step uses the `innerHTML` method to insert the HTML content into an offscreen [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment), rendering it into a DOM tree, and setting up accessors for specially tagged objects (see `templatename` and `templateattribute` above).

    A `div` object is created in the `DocumentFragment` content of `this.html` is set into it via [`innerHTML()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML). The `div` object becomes the root-level element (`this.DOMElement`)


3. **setup**

    after rendering the HTML content into a DOM tree and pulling out references to tagged Elements, etc (as described above), you will frequently need to perform programmatic operations on these elements. For instance, as in the example above, you might want to hang hooks with `addEventListner()` and other such things. The `setup` phase is accessible by specifying a `renderCallback()` function.

4. **show it**

    after all of the above the time will come that you wish to show the stuff to the user on the screen. To do that, call the `append()` function (see below), and the `remove()` function to remove it.

## Attributes

* **html** `string (getter/setter)` - this attribute accessor gets and sets the HTML string for the object. Setting a new value on this attribute invokes the `update()` function (see below)

* **deferRender** `bool, default: false` - if set true, do *not* call `render()` from the constructor (this is a handy hook for subclasses which might need to do complicated things before calling render). If you set this, you'll need to manually invoke `render()`

* **DOMElement** `Element` - `this.html` is inserted into this `div` element via [`innerHTML()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML). This is first inserted into the `DocumentFragment` (see above), then inserted into the visible DOM with `append()` (see below)

* **visibility** `enum(null, hidden, collapse)` - hard-coded passthrough to [`css visibility`](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility) attribute on the root level Element (`this.DOMElement`). This allows one to toggle visibility of the `noiceCoreUIElement` without removing it from the DOM (NOTE: `visibilty: collapse;` does NOT work as advertised on *most* browsers, at the end of the day you're probably better just calling `remove()` and dealing with that overhead but hey it's here if you wanna give it a try)

* **classList** `array` - [see MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList). This is a passthrough to the CSS ClassList on `this.DOMElement`. By default `this._className` (the name of the class the object is instantiated from) is inserted into the classList.

* **onScreen** `bool` - this read-only bool is managed by the `append()` and `remove()` functions, querying it can tell you if the object is currently in the visible DOM (though it may or may not be actually visible to the user) or in the DocumentFragment (definitely not visible)

* **_DOMElements** `object` - this is an object of references to `Element` objects within the DOM subtree under (`this.DOMElement`). These are named references determined by the `data-templatename` attribute on elements specified in `this.html` (see above).

* **getHTMLCallback** `function` - when the `this.html` attribute getter is invoked (someone tried to get the value of `this.html`), if this callback function is specified, the string value returned by this function is returned on `this.html` (see example above)

* **renderCallback** `function` - when the `render()` function is called (either via the constructor, or from `update()` via resetting the `this.html` value, or just when `render()` is specifically called, this callback function is executed after the rendering is complete. This is a way to execute setup tasks (setting up listeners, etc, etc -- see above)

## Functions

### `render()`

as described above, this function is either called from the object constructor, from a call to `update()`, resulting from setting the value of `this.html`, or explicitly (if `deferRender` is set true). This sets `this.html` as the `innerHTML` of a dynamically generated `div` element (`this.DOMElement`), which renders the DOM subtree by inserting it into an offscreen `DocumentFragment`.

### `update()`

the `this.html` attribute can be read (and the content determined either by overriding the html attribute getter or setting up a `getHTMLCallback` in a subclass). However, this atribute can also be *written*. I'm **not saying you should do this**, it works but it's just kind of a hacky thing to do and doesn't do great things for the understandability of your code. But you can. You can totally blow a brand new HTML string into `this.html` which will delete the old content of `this.DOMElement` and replace it with whatever you sent in, then this function will be called which will remove any defunct attribute accessors, then call `render()` again (including the `renderCallback` being executed again).

### `append(<Element>)`

append `this.DOMElement` to the specified Element object. This places it on screen, I mean if the  `<Element>` you specify is on screen. I guess you could always append it to the `this.DOMElement` of another `noiceCoreUIElement` object that itself may not be on screen. But yeah this is how it's done

### `remove()`

remove `this.DOMElement` from wherever it is and put it back in the `DocumentFragment` so (again, probably), taking it off screen.

### `getEventListenerWrapper(<function>)`

Event Handlers are so easy to create and so impossible to remove. Seriously, freakin' impossible, check the docs on [`removeEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener). Makes it look nice n' simple right? Well none of that crap actually works in like every context I've ever tried. No joke. The reason appears to be some handwavy vagueness in the spec, regarding *how it matches function pointers* -- So here's what this function will do for you. If you pass it a function reference, it will return unto you a reference to a new function that calls the other function, so that when it comes time to remove it you know *damn sure* you're giving it an explicitly specific function pointer, and it will work.

```javascript
function testMe(event, selfReference){
    console.log(`someone called me`);

    // remove the listener after the first time we get called
    selfReference._DOMElements.message.removeEventListener('click', selfReference.eatMe)
}

let hiThere = new noiceCoreUIElement({
    message: "Hi There!",
    getHTMLCallback: function(selfReference){
        return(`<h1 data-templatename='message' data-templateattribute='true' style="color: red;"></h1>`);
    },
    renderCallback: function(selfReference){
      selfReference.eatMe = selfReference.getEventListenerWrapper(testMe);
      selfReference._DOMElements.message.addEventListener('click', selfReference.eatMe);
    }
}).append(document.body);

```



---



## `noiceCoreUIOverlay`
This class implements a (potentially full-screen) absolutely positioned div with a defined z-index (a UI "layer" if you will), as an extension of `noiceCoreUIElement`. This is intended as a base class for building things like splash screens, modal dialogs and floating menus.

at the end of the day, this is simply a `noiceCoreUIElement` object with hard-coded CSS attributes linked to attribute accessors:

```javascript
{
    position:       this.fullscreen?'absolute':'relative',
    overflow:       'hidden',
    display:        'flex',
    justifyContent: this.justifyContent,
    alignItems:     this.alignItems,
    width:          this.width,
    height:         this.height,
    left:           this.x,
    top:            this.x,
    zIndex:         this.z
}
```

## Attributes
in addition to those inherited from `noiceCoreUIElement`:

* **fullscreen** `bool, default: true` - if true, position the element `absolute`

* **justifyContent** `string, default: 'center'` - passthrough to [CSS `justify-content`](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content)

* **alignItems** `string, default: 'center'` - passthrough to [CSS `align-items`](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items)

* **width** `string, default: '100%'` - passthrough to [CSS `width`](https://developer.mozilla.org/en-US/docs/Web/CSS/width)

* **height** `string, default: 100%` - passthrough to [CSS `height`](https://developer.mozilla.org/en-US/docs/Web/CSS/height)

* **x** `string, default: '0'` - passthrough to [CSS `left`](https://developer.mozilla.org/en-US/docs/Web/CSS/left)

* **y** `string, default: '0'` - passthrough to [CSS `top`](https://developer.mozilla.org/en-US/docs/Web/CSS/top)

* **z** `string, default: 0` - passthrough to [CSS `z-index`](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)

## Functions

* **`applyNecessaryStyle()`** - this applies hard-coded CSS attributes as described above. It is handy to override this function in child classes to apply hard-coded CSS attributes.

## Example
```javascript
let hiThere = new noiceCoreUIOverlay({
    message: "Hi There!",
    getHTMLCallback: function(selfReference){
        return(`<h1 data-templatename='message' data-templateattribute='true' style="color: red;"></h1>`);
    }
}).append(document.body);
```



---



## `noiceCoreUIDialog`
This class extends `noiceCoreUIOverlay` to implement a modal dialog (thiat is, a full-screen `overlay` with an HTML payload centered on the screen, blocking access to all other UI elements). We set a super high z-index by default (`999`), if you have multiple objects of this kind, you'll need to implement a system on your own to manage the `z-index` values or you may have new dialogs spawning beneath one already open, or layout issues from them spawning on the same `z-index`

by default, `this.html` is:
```javascript
`<div class="${this.dialogContentClass}">
    <span class="${this.dialogMessageClass}">${this.message}</span>
 </div>`

```

### Attributes

* **dialogContentClass** `string, default: 'dialogContentClass'` - use this string for `class` on the `div` element containing the message (in the default HTML template)

* **dialogMessageClass** `string, default: 'dialogMessageClass'` - use this string for `class` on the `span` containing the message (in the default HTML template)

* **message** `string: default: null` - set this string as the `textContent` of the span containing the message in the default HTML template

* **messageDOMElement** `Element` - the DOM element reference to the `span` containing the message in the default HTML template

* **showCallback** `Function(selfReference)` - if specified, execute this function when the `show()` function is called, before `this.DOMElement` is added to the visible DOM. If this function throws, it will cancel the `show()` function before the element is added to the DOM (so the callback can cancel the `show()` call by throwing)

* **hideCallback** `Function(selfReference)` - if specified, execute this function when the `hide()` function is called, before `this.DOMElement` is removed from the visible DOM and placed back into the `DocumentFragment`. Like `showCallback`, this function can cancel the `hide()` call by throwing/

* **alert** `bool, default: false` - if set to a value of `true`, add the `alert` class to `this.DOMElement`, if set `false` from a previously `true` value, remove `alert` from the classList

* **altContent** `Element` - if specified, replace the `span` element in the default HTML template with this HTML `Element`


### Functions

* **`show(targetElement)`** - pretty much the exact same thing as `noiceCoreUIElement.append()`, except that the `showCallback()` is invoked.

* **`hide()`** - pretty much the exact same thing as `noiceCorUIElement.remove()`, except that the `hideCallback()` is invoked


### Example
```javascript
// make nice dialog content
let dialogContent = document.createElement('div');
let dialogMessage = document.createElement('h1');
dialogMessage.textContent = 'Click Button To Close';
dialogContent.appendChild(dialogMessage);
let btnClose = document.createElement('button');
btnClose.textContent = 'close me';
dialogContent.appendChild(btnClose);

// make dialog
let dialog = new noiceCoreUIDialog({
    altContent: dialogContent,
    showCallback: function(){ console.log("dialog on screen!"); },
    hideCallback: function(){ console.log("dialog off screen!"); }
}).show(document.body);

// hook up the close button
btnClose.addEventListener('click', function(){ dialog.hide(); });
```



---



## `noiceCoreUIYNDialog`
this extends `noiceCoreUIDialog` to implement your basic `yes/no` modal dialog. By default, `this.html` is:

```javascript
`<div class="${this.dialogContentClass}">
    <h1 class="${this.dialogHeadingClass}">${this.heading}</h1>
    <div class="${this.dialogMessageContainerClass}"><p class="${this.dialogMessageClass}" data-templatename="_dialogMessage">${this.message}</p></div>
    <div class="${this.dialogButtonContainerClass}">
        <button class="${this.noButtonClass}" data-templatename="btnNo">${this.noButtonTxt}</button>
        <button class="${this.yesButtonClass}" data-templatename="btnYes">${this.yesButtonTxt}</button>
    </div>
</div>`
```

### Attributes
in addition to those inherited from `noiceCoreUIElement`, `noiceCoreUIOverlay`, and `noiceCoreUIDialog`:

* **dialogHeadingClass** `string, default: 'dialogHeadingClass'` - use this string for the `class` on the `h1` element (`this.heading`) used in the default HTML template (see above)

* **heading** `string, default: null` - use this string for the `textContent` of the `h1` element in the default HTML template (see above)

* **showYesButton** `bool, default: true` - if set to a value of `true`, display the yes button

* **yesButtonClass** `string, default: 'dialogYesButtonClass'` - use this string for the CSS class applied to the yes button in the default HTML template (see above)

* **yesButtonTxt** `string, default: 'yes'` - use this string as the `textContent` of the yes button

* **showNoButton** `bool, default: true` - if set to a value of `true`, display the no button

* **noButtonClass** `string, default: 'dialogNoButtonClass'` - use this string for the CSS class applied to the no button in the default HTML template (see above)

* **noButtonTxt** `string, default: 'no'` - use this string for the `textContent` of the no button

* **zTmpDialogResult** `bool` - the value of this boolean is set `true` if the user clicks the `yes button` and `false` if the user clicks the `no button`

* **dialogButtonContainerClass** `string, default: dialogButtonContainerClass` - use this string for the `class` attribute of the div containing the yes and no buttons

### Example
```javascript
let dialog = new noiceCoreUIYNDialog({
    heading:    'Launch Escape Pods?',
    message:    'with droids and stolen death star plans?',
    hideCallback: function(selfReference){
        alert(`you clicked: ${(selfReference.zTmpDialogResult)?'Yes':'No'}`)
    }
}).show(document.body);
```



---



## `noiceCoreUIHeaderMenu`
this extends `noiceCoreUIDialog` to create an overlay welded to the top of the viewport
(or the containing block).

The overlay has a minimum size, such that the "bottom" is always visible on screen.
We will call this the **"menuHandle"**. When clicked, the menuHandle expands the overlay
downward to expose arbitrary html content (probably your menu with some buttons). We
will call this the **"menuContent"**. When subsequently clicked, the menuHandle collapses
the overlay to it's minimum height, hiding the menuContent

default HTML template is:

```javascript
`<div class="${this.menuContainerClass}">
    <div class="${this.dialogContentClass}">${this.menuContent}</div>
    <div class="${this.menuHandleClass}">
        <span class="${this.menuHandleTitleClass}">${this.menuHandleTitle}</span>
        <span class="${this.dialogMessageClass}" data-templatename="_dialogMessage">${this.message}</span>
        <svg
            class="${this.menuHandleIconClass}"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="1em"
            height="1em"
            viewBox="0 0 512 512"
            enable-background="new 0 0 512 512"
            xml:space="preserve"
        ><path
            d="M256 90.002c91.74 0 166 74.2 166 165.998c0 91.739-74.245 165.998-166 166 c-91.738 0-166-74.242-166-165.998C90 164.3 164.2 90 256 90 M256 50.002C142.229 50 50 142.2 50 256 c0 113.8 92.2 206 206 205.998c113.77 0 206-92.229 206-205.998C462 142.2 369.8 50 256 50.002L256 50.002z M252.566 371.808c-28.21 9.913-51.466-1.455-46.801-28.547c4.667-27.098 31.436-85.109 35.255-96.079 c3.816-10.97-3.502-13.977-11.346-9.513c-4.524 2.61-11.248 7.841-17.02 12.925c-1.601-3.223-3.852-6.906-5.542-10.433 c9.419-9.439 25.164-22.094 43.803-26.681c22.27-5.497 59.5 3.3 43.5 45.858c-11.424 30.34-19.503 51.276-24.594 66.9 c-5.088 15.6 1 18.9 9.9 12.791c6.959-4.751 14.372-11.214 19.806-16.226c2.515 4.1 3.3 5.4 5.8 10.1 C295.857 342.5 271.2 365.2 252.6 371.808z M311.016 184.127c-12.795 10.891-31.76 10.655-42.37-0.532 c-10.607-11.181-8.837-29.076 3.955-39.969c12.794-10.89 31.763-10.654 42.4 0.5 C325.577 155.3 323.8 173.2 311 184.127z"
        /></svg>
    </div>
</div>`
```

### Attributes
in addition to those inherited from `noiceCoreUIElement`, `noiceCoreUIOverlay` and `noiceCoreUIDialog`:

* **menuContent** `HTML string | Element` - raw html for the menuContent. has an accessor so updating it updates live

* **getMenuContentCallback** `function(selfReference)` - like `getHTMLCallback()` but specifically for `this.menuContent`

* **menuContentCallback** `function(selfReference)` - if specified, we call this external function when the value of `menuContent` is set handy for setting up hooks on buttons that might change

* **menuHandleTitleClass** `string, default: 'menuHandleClass'` - apply this class to the div containing the menuHandle

* **menuHandleTitle** `string, default: ${this._className}/${this._version}` -  this is the title of the menu displayed on the left-hand side of the menuHandle keep it short

* **messageCallback** `function(selfReference)` - if specified, we call this external function before changing the value of `this.message` in the setter function. If specified, `messageCallback` must return
a promise so that we can await its completion before changing the value on screen. this is for insertion of jazz-hands.

* **openCallback** `function(selfReference)` - like `messageCallback`, if specified, this function must return a promise, which we will await before completing the open() action.

* **closeCallback** `function(selfReference)` - same deal but for `close()`

* **minHeight** `string, default: '1em'` - when collapsed, the minimum height of the overlay, to show the menuHandle the overlay's height is set to this value when `close()` is called or the object is instantiated

* **maxHeight** `string, default: 'auto'` - if specified, the menu will expand to the specified height when open() is called the default setting of 'auto' should insure that the entirety of `this.menuContent`
is visible.

### Functions

* **`async setMessage(<string>)`** - this returns a promise to change the value of this.message to <str>
if `messageCallback()` is defined (see above), we await it's completion before changing the value of `this.message`.

* **`async open()`** - expand the vertical dimension to reveal `menuContent`. call `openCallback()` if we have one. This is an async function so openCallback() must return a promise such that we can await it (see above)

* **`async close()`** - collapse the vertical dimension to hide `menuContent`. call `closeCallback()` if we have one. just like `open()`, this is an async function so closeCallback() must return a promise (see above).

### Example
```javascript
let hdrMenu = new noiceCoreUIHeaderMenu({
  menuHandleTitle:    `I'm a headerMenu now!`,
  renderCallback:     function(self){
      ['one', 'two', 'three', 'four'].forEach(function(screenName){
          let b = document.createElement('button');
          b.textContent = screenName;
          b.dataset.screenname = screenName;
          b.addEventListener('click', function(e){
              alert(`you clicked ${e.target.dataset.screenname}`)
              self.close();
          });
          self.menuContentDOMElement.appendChild(b);
      });
  },
  defaultMessage:     "ready",
  messageCallback:    async function(msg, self){
      self.messageDOMElement.style.opacity = 0;
      setTimeout(function(){
          self.messageDOMElement.textContent = msg;
          self.messageDOMElement.style.opacity = 1;
          setTimeout(function(){
              self.messageDOMElement.textContent = self.defaultMessage;
          }, (30 * 1000));
      }, 2000);
  },
  openCallback:       async function(self){
      // do something after the menu opens? I dunno ...
  },
  maxHeight:          '120px',
  minHeight:          '50px'
}).append(document.body);

// give it a visible background color
hdrMenu.DOMElement.style.backgroundColor = 'blue';

```



---



## `noiceCoreUIScreen`
This extends `noiceCoreUIOverlay` to implement a `UIScreen`, which is a single UI unit that can be displayed to the user. For instance, think of something like a set of UI Tabs, where the content of each tab is a `noiceCoreUIScreen` object, and the tabset is a `noiceCoreUIScreenHolder` (a collection of `noiceCoreUIScreen` objects where only one is given focus at a time)

inheriting from CoreUIOverlay gives us a full width/height div with a z-index into which *.html will be inserted as a flex object. This can be changed by overriding `applyNecessaryStyle()` in subclasses.

This is the base class for a great many UI widgets, including `formView`

### Attributes:
* **name** `string, default: this._className` - the name of the UI (this is important, and should be unique within the context of a `noiceCoreUIScreenHolder`);

* **focus** `bool, default: false` (read-only) a UIScreen object defines a boolean state of "focus". When inside a `noiceCoreUIScreenHolder`, only one `noiceCoreUIScreen` may have the display at once. In that context, `focus`, means that the object has the display inside the parent `noiceCoreUIScreenHolder`. More generically, the concept of 'focus' is more arbitrary in that it may or may not control if the object is visible, however, changing this state invokes the `focusCallback()` (if specified).

* **setupCallback** `function(selfReference)` - if specified, this function is called in the constructor after `super()` is called. This is like a hard-coded `renderCallback`, this gives you a nice place to do setup on UI elements and initiate UI state before showing the UI to the user.

* **firstFocusCallback** `async function(focusArgs)` - if specified, the first time `this.focus` is set to a value of `true` from a non-true value (via `setFocus()`), this function will be executed. If `focusArgs` are specified on the call to `setFocus()`, the will be passed to the callback. This function must return a promise. If that promise rejects the `setFocus()` call is aborted and the `focus` attribute will not be set.

* **gainFocus** `async function(focusArgs)` - if specified, this function will be executed each time `setFocus()` is called with a `true` value. If `focusArgs` are passed to `setFocus()`, they will be passed to the callback. This function can abort the focus change event by rejecting the returned promise.

* **loseFocus** `async function(focusArgs)` - if specified, this function will be executed each time `setFocus()` is called with a `false` value. If `focusArgs` are passed to `setFocus()`, they will be passed to the callback. This function an abort the focus change event by rejecting the returned promise.

* **onScreenCallback** `async function(selfReference)` - if specified, execute this function each time the `append()` function is called

### Functions

* **`async setFocus(<bool>, <{focusArgs}>)`** - set the value of `this.focus` to the given `<bool>`, invoking callbacks if specified. The optional `<{focusArgs}>` object will be passed to callbacks (see above)

* **`async receiveMessage(<{args}>)`** - this is a placeholder function, it's expected you'll override this in subclasses. This receives messages from `noiceCoreUIScreenHolder/sendMessage()` function.

### Example
```javascript
let uiScreen = new noiceCoreUIScreen({
    name:            'petList',
    gainFocus:       function(focusArgs){ console.log('petList has gained focus'); },
    getHTMLCallback: function(selfReference){
        return(`<h1>this is the petList UI</h1>`);
    }
});
```



---



## `noiceCoreUIScreenHolder`
this implements a UI Controller, as a collection of `noiceCoreUIScreen` (or descendant) objects, only one of which is granted focus at a time (i.e. is visible to the user).

### Attributes

* **UIList** `object, default: {}` - list of child `noiceCoreUIScreen` (or descendant) objects, where the key on the object is a unique name given to the UI (by default this is `noiceCoreUIScreen.name`, but can be overridden in `addUI()` - see below)

* **currentUI** `string, default: null` - the `name` of the currently focussed UI (key on `this.UIList`, see above)

* **defaultUI** `string, default: null` - if specified, tag the UI identified by `defaultUI` as the default UI which is automatically given focus when the object is instantiated (if `showDefaultUI` is true), and when `setDefaultUI()` is called

* **showDefaultUI** `bool, default: false` - if set true, the `defaultUI` (if specified) is given focus on object instantiation.

* **ignoreFocusErrors** `bool, default: false` - if set true, ignore rejected promises in `gainFocus()` and `loseFocus()` callbacks of child `noiceCoreUIScreen` objects in the context of a `switchUI()` call (see below)

### Functions

* **`addUI(<noiceCoreUIScreen>, <screenName>)`** - call this function to add a new `noiceCoreUIScreen` (or descendant) to the `UIList`. NOTE: you can also simply specify an entire set of `noiceCoreUIScreen` objects on `UIList` at instantiation. If `<screenName>` is specified use this string as the key on `UIHolder` (that is, the UI's unique identifier within the context of the screen holder), otherwise `noiceCoreUIScreen.name` will be used.

* **`getUI(<screenName>)`** - return a reference to the `noiceCoreUIScreen` (or descendant) object matching the given `<screenName>` on `this.UIList`

* **`changeUIName(<oldUIName>, <newUIName>)`** - move the `UIList` object identified by `<oldName>` to `<newName>`

* **`removeUI(<uiName>)`** - remove the screen identified by `<uiName>` from `this.UIList`, returning a reference to it

* **`async switchUI(<uiName>)`** - give focus to the screen identified by `<uiName>`. If there's already a screen with focus, set focus `false` on that screen, invoking `loseFocus()` callback, see `noiceCoreUIScreen`, above. If `loseFocus()` returns a rejected promise, this will **abort the focus change** and the specified UI will not be shown. This also invokes `gainFocus()` callback on the screen identified by `<uiName>`, which *also* can abort the focus change event. Sending `null` on `<uName>` will hide any currently focussed screens, displaying nothing (like a 'clear screen' function).

* **`setDefaultUI()`** - if `defaultUI` is specified, show it when this function is called

* **`listUIs()`** return the list of keys on `this.UIList`

* **`sendMessage(<{object}>)`** - send `<{object}>` to the `receiveMessage()` function of all screens in `this.UIList`, if any of those return a rejected promise, throw.

### Example
```javascript
let UIHolder = new noiceCoreUIScreenHolder({
    UIList: {
        catList: new noiceCoreUIScreen({
            name:            'catList',
            gainFocus:       function(focusArgs){ console.log('catList has gained focus'); },
            getHTMLCallback: function(selfReference){
                return(`<h1>this is the catList UI</h1>`);
            }
        }),
        dogList: new noiceCoreUIScreen({
            name:            'dogList',
            gainFocus:       function(focusArgs){ console.log('dogList has gained focus'); },
            getHTMLCallback: function(selfReference){
                return(`<h1>this is the dogList UI</h1>`);
            }
        }),
        gerbilList: new noiceCoreUIScreen({
            name:            'gerbilList',
            gainFocus:       function(focusArgs){ console.log('gerbilList has gained focus'); },
            getHTMLCallback: function(selfReference){
                return(`<h1>this is the gerbilList UI</h1>`);
            }
        }),
    }
}).append(document.body);
UIHolder.switchUI('dogList');
```



---



## `noiceCoreUIFloatingDialog`
this is an absolutely positioned high z-index div containing a "handle" and a body. Both could be anything you like but with some basic css this makes the classic "title bar" / "window" UI which is draggable within it's parent's dimensions.

This makes a good control panel, or non-modal dialog (see examples)

### Attributes

 * **title** `string` - string for the handle, keep it short

 * **bodyHTML** `string` - this is the HTML for the 'body' of the dialog

### Example
```javascript
let logWindow = new noiceCoreUIFloatingDialog({
    title:              'debug logger',
    html:               `<div class="log" style="display:grid; grid-template-columns: 1fr; margin: .25em;"></div>`,
    renderCallback:     function(myself){
        myself.logDOMElement = myself.DOMElement.querySelector('div.log');
        if (myself.logDOMElement){

            // boldness
            myself.appendLog = function(log){
                if (log instanceof Element){
                    myself.logDOMElement.appendChild(log);
                    return(true);
                }else{
                    let tmp = document.createElement('div');
                    tmp.className = 'debugLogEntry';
                    tmp.textContent = log;
                    myself.logDOMElement.appendChild(tmp);
                    myself.logDOMElement.scrollTop = myself.logDOMElement.scrollHeight;
                    return(true);
                }
            }
        }
    }
}).append(document.body);
logWindow.DOMElement.style.backgroundColor = 'green';
setInterval(function(){ logWindow.appendLog(`the time is: ${logWindow.epochTimestamp(true)}`); }, 500);
```
