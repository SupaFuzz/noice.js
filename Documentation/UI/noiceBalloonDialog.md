# noiceBalloonDialog.js

This implements a floating modal dialog with a CSS-configurable "pointer", where click/touch outside the dialog will close it. It can optionally be "stuck" to a given screen position (for instance anchored relative to another, dynamically positioned element), via the `setPosition()` call back (by default this listens to `orientationchange` events, but others such as `resize` are possible)

This is the hard-coded CSS layout, we only set poisitioning and layout options, the rest is up to you and highly configurable (for instance see CSS on the included `examplePWA` app)

```
         ____/\________________________
        |  <title>  | <hdrContent>      |
         -------------------------------
        |                               |
        |      <dialogContent>          |
        |                               |
        |                               |
         -------------------------------
```

## Requires

* **noiceCore.js** (`noiceCoreUtility`)
* **noiceCoreUI.js** (`noiceCoreUIElement`)

## Attributes

* **title** `string | Element` - if string set `textContent` of the `<title>` element in the diagram above, if an Element, append it as the only child of same.

* **hdrContent** `string | Element` - same deal as `title` except for the `<hdrContent>` element in the layout above. Darn good place for buttons and search boxes.

* **dialogContent** `string | Element` -

* **x** `integer (px)` -

* **y** `integer (px)` -

* **right** `integer (px)` -

* **bottom** `integer (px)` -

* **width** `string, css passthrough` -

* **zIndex** `integer, default: 8` - set the CSS z-index of the dialog

* **arrow** `enum(bottom, bottomLeft, top, topMid, topRight, topLeft), arbitrary CSS passthrough` -

* **setPosition** `function(event, selfReference)` -

* **allowExit** `bool, default: true` - if set false, forces modality (touch/click outside dialog will not close it, you'll have to close explicitly on your own)

## Example
here's a brief code example pulled from the included `examplePWA` project. Here, we create a DOM subtree with menu content, then instantiate a noiceBalloonDialog to hold it


```javascript

/*
    getBurgerMenu()
    get an instance of the system-level burger menu
*/
getBurgerMenu(){
    let that = this;
    let _burgerMenu = document.createElement('div');
    _burgerMenu.className = 'burgerMenu';

    let burgerStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr',
        placeItems: 'center'
    }
    Object.keys(burgerStyle).forEach( function(c){ _burgerMenu.style[c] = burgerStyle[c]; } );

    // check for updates button
    let btnUpdate = document.createElement('button');
    btnUpdate.className = "btnUpdate";
    btnUpdate.textContent = 'check for updates';
    btnUpdate.addEventListener('click', function(evt){ that.checkForUpdates(evt); });
    _burgerMenu.appendChild(btnUpdate);

    // reset button
    let btnReset = document.createElement('button');
    btnReset.className = "btnReset";
    btnReset.textContent = 'reset';
    btnReset.addEventListener('click', function(evt){ that.resetApp(evt); });
    _burgerMenu.appendChild(btnReset);

    // export button
    let btnExport = document.createElement('button');
    btnExport.className = "btnExport";
    btnExport.textContent = 'export to file';
    btnExport.addEventListener('click', function(evt){ that.exportFile(evt); });
    _burgerMenu.appendChild(btnExport);

    // import button
    let btnImport = document.createElement('button');
    btnImport.className = "btnImport";
    btnImport.textContent = 'import from file';
    btnImport.addEventListener('click', function(evt){ that.importFile(evt); });
    _burgerMenu.appendChild(btnImport);

    // make 'em all text buttons
    _burgerMenu.querySelectorAll('button').forEach(function(el){ el.classList.add('textButton'); });

    return(_burgerMenu);
}

/*
    setupCallback()
    create the burger menu. note the setPosition() function
*/
setupCallback(){
    let that = this;
    that.burgerMenuDialog = new noiceBalloonDialog({
        title:         '',
        hdrContent:    '',
        dialogContent: this.getBurgerMenu(),
        arrow:         'topMid',
        setPosition:    function(selfReference){
            let tbox = that._DOMElements.btnBurger.getBoundingClientRect();
            let dbox = selfReference._DOMElements.dialog.getBoundingClientRect();
            selfReference.y = (tbox.bottom + 5);
            selfReference.x = (tbox.x - (dbox.width/2));
        }
    });


    // hook for burgerMenu button
    that._DOMElements.btnBurger.addEventListener('click', function(evt){
        that.burgerMenuDialog.append(that.DOMElement);
    });
}
```

## Example CSS
as mentioned above, layout CSS is hard-coded to provide basic functionality only. To make an actually usable menu, you'll need to set up some external CSS. Here's some basic CSS, again taken from the included `examplePWA` app

```css
/*
 	ballooonDialog
*/
.noiceBalloonDialog > * {
	cursor: default;
	user-select: none;
}
.noiceBalloonDialog .dialog .body {
	border: 2px solid rgb(191, 191, 24);
	border-radius: .25em;
	overflow:hidden;
}
.noiceBalloonDialog .dialog .dialogHeader {
	background-color: rgb(191, 191, 24);
	padding: .25em;
	margin: 0;
}
.noiceBalloonDialog .dialog .dialogHeader .dialogHeaderTitle {
	font-size: .55em;
	font-family: Comfortaa;
}
.noiceBalloonDialog .dialog .dialogContent {
	padding: .25em;
	background-color: rgb(20, 22, 23);
}
.noiceBalloonDialog[data-arrow='bottom'] .dialog:after {
	content: '';
	position: absolute;
	bottom: 0;
	right: 21px;
	width: 0;
	height: 0;
	border: 10px solid transparent;
	border-top-color: rgb(191, 191, 24);
	border-bottom: 0;
	margin-left: -10px;
	margin-bottom: -10px;
}
.noiceBalloonDialog[data-arrow='bottomLeft'] .dialog:after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 21px;
	width: 0;
	height: 0;
	border: 10px solid transparent;
	border-top-color: rgb(191, 191, 24);
	border-bottom: 0;
	margin-left: -10px;
	margin-bottom: -10px;
}
.noiceBalloonDialog[data-arrow='top'] .dialog:after {
	content: '';
	position: absolute;
	top: 0;
	left: 21px;
	width: 0;
	height: 0;
	border: 10px solid transparent;
	border-bottom-color: rgb(191, 191, 24);
	border-top: 0;
	margin-left: -10px;
	margin-top: -10px;
}
.noiceBalloonDialog[data-arrow='topMid'] .dialog:after {
	content: '';
	position: absolute;
	top: 0;
	left: 50%;
	width: 0;
	height: 0;
	border: 10px solid transparent;
	border-bottom-color: rgb(191, 191, 24);
	border-top: 0;
	margin-left: 0px;
	margin-top: -10px;
}
.noiceBalloonDialog[data-arrow='topRight'] .dialog:after {
	content: '';
	position: absolute;
	top: 0;
	right: 21px;
	width: 0;
	height: 0;
	border: 10px solid transparent;
	border-bottom-color: rgb(191, 191, 24);
	border-top: 0;
	margin-left: -10px;
	margin-top: -10px;
}
.noiceBalloonDialog[data-arrow='topLeft'] .dialog:after {
	content: '';
	position: absolute;
	top: 0;
	left: 21px;
	width: 0;
	height: 0;
	border: 10px solid transparent;
	border-bottom-color: rgb(191, 191, 24);
	border-top: 0;
	margin-left: -10px;
	margin-top: -10px;
}
.noiceBalloonDialog .dialogContent button {
	width: 100%;
	font-size: .66em;
	padding: .25em 2em .25em .25em;
	text-align: right;
}
```
