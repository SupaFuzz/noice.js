# recordEditorUI.js
this is a UI screen (noiceCoreUIScreen subclass) for creating and editing records. The layout is something like this

```
--------------------------------------------------------------------------
| < back (s) (+) (c) (=) |                                               |
|                        |                                               |
| [title]                |                                               |
|------------------------|                                               |
|                        |                                               |
|  [handle list]         |              [selected record]                |
|                        |                                               |
|                        |                                               |
|                        |                                               |
```

* `< back` - back is a button returning the user to the main (or other) UI
* `(s)` - is the search button
* `(+)` -  is a button to create a new record
* `(c)` - is the clone button
* `(=)` -  is a burger menu
* `[title]` - is a templateElement, arbitrary string
* `[handle list]` -  is a div into which we insert rowHandles for rows the UI is managing
* `[selected record]` - is the formView for the rowHandle selected in the [handle list]

This is somewhat abstract, it may help to look at the included `examplePWA` app, but basically subclass this and override `addRow()` & `cloneRow()`, and send in content
for `burgerMenu` and you're good to go


## Attributes

* **burgerMenu** `noiceBalloonDialog` - attach this `noiceBalloonDialog` object to the `(=)` Element in the diagram above. Open this externally provided burger menu when the user click/touch's the burger menu icon.  

* **showBurgerButton** `bool, default: true` - if `false`, do not include the `(=)` Element in the diagram above, in the DOM subtree. Don't show the burger menu icon if `false`, otherwise, do show it.

* **showAddButton** `bool, default: true` - if `false`, do not include the `(+)` Element in the diagram above, in the DOM subtree. Don't show the add button icon if `false`, otherwise, do show it.

* **showCloneButton** `bool, default: true` - if `false`, do not include the `(c)` Element in the diagram above, in the DOM subtree. Don't show the clone button icon if `false`, otherwise, do show it.

    NOTE: the state of this button is managed by the `handleRowSelect` function. When a rowHandle is given focus, referencing a `formView` that has the `cloneable` attribute set `true`, the button is activated, else it is deactivated. When touched, it will open a `noiceBalloonDialog` attached to the clone button (`c`, above) where the `dialogContent` is set to the `cloneView` of the currently selected `formView`

* **leftColWidth** `string (CSS passthrough), default: '38.195302843vw'` - this attribute specifies the width of the left column in the diagram above. This is a direct pass through to the `CSS Width` property, so ay value accepted by that is accepted here. By default we use a value of `38.195302843vw`, which correspondes to the width of the viewport less the width of the viewport divided by the golden ratio.

* **searchMenu** `noiceBalloonDialog` - much like `burgerMenu`, show this externally provided search menu when someone click/touch's the search button icon `(s)` in the diaram above.

* **openSearchMenuCallback** `async function(selfReference)` - execute this asynchronous callback when the user touches the search button icon (`s` in the diagram above). If this async function returns a rejected promise, the `searchMenu` is not shown. If the promise is not rejected, the `searchMenu` is shown. Use this callback for fetching data from the indexedDB or the network or what have you. The menu won't open until you get your result.

* **handleList** `array` - array of rowHandles (shown in `[handle list]` in the diagram above)

* **uiHolder** `noiceCoreUIScreenHolder` - the screen holder containing all of the screens associated to the rowHandles (`formViews` in practice, which are `noiceCoreUIScreen` descendants)

## Functions

* **`addRow()`**

    It is expected this will be overridden in subclasses. This function adds a `rowHandle` to the `handleList` (`[handle list]` in the above diagram), and creates a corresponding `noiceCoreUIScreen` placeholder UI (in practice these would be `formView` descendant objects). The placeholder UI is inserted into the object's `uiHolder` attribute (a `noiceCoreUIScreenHolder`), and a click/touch event handler is attached to the new rowHandle such that touching it deselects all other rowHandles (awaiting `loseFocus` on any selected UIs -- see `saveChangesDialog` below), and after any deselect events resolve, we will then give focus to the `noiceCoreUIScreen` object we created for this rowHandle.

    make a new rowhandle and a new detail view, then show it to the user, basically.

* **`handleRowSelect(rowHandle)`**

    This is the handler for the click/touch event on a rowHandle. Its a pretty capable "single select" arrangement, that respects awaiting the `loseFocus` and `gainFocus` events on the rowHandle's corresponding `noiceCoreUIScreen` (or descendant) class. You might need to override this if you need something more complicated in a subclass, however this is good enough most of the time on it's own.


* **`saveChangesDialog(formViewReference, focusArgs)`**

    This function pops up the 'are you sure?' dialog. Typically, you'll wire this to the `areYouSureCallback()` of `formView` objects you place into `this.uiHolder` via `addRow()`. The end result of wiring like that is to pop up the dialog when the user executes an action that results in a `loseFocus` event on a `formView` where the changeFlag is set true.

    NOTE: in the `formView`, set `this._pendingExit  = true` to get the "you're discarding these changes" version versus the "you will need to return and save" version.


## Example
```javascript

/*
    'that' being a reference to an noiceApplicationCore descendant object
    and getBurgerMenu() being a function in that app returning menu content
    see the included examplePWA app for more detailed example.
    Specifically recipeEditorUI.js, which is a practical example of a
    recordEditorUI subclass
*/

let UI = new recordEditorUI({
    _app:       that,
    title:      "create / edit",
    burgerMenu: that.getBurgerMenu()
}).append(document.body)
```
