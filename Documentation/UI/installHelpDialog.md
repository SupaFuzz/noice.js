# installHelpDialog.js

This implements a modal PWA install prompt banner looking something like this:

```
                                       /\
 --------------------------------------  -----------
| <message>                  | <addtitionalContent> |
 ---------------------------------------------------
```
the `/\` in the diagram above is configured via external CSS (see `External CSS` section below) and is meant to (more or less) line up to the 'install' prompt in browsers that support PWA install.


## Requires

* **noiceCore.js** (`noiceCoreUtility`)
* **noiceCoreUI.js** (`noiceCoreUIElement`, `noiceCoreUIOverlay`)

## Attributes

* **message** `string | Element` - this is the message to display to the user. By default it reads "Install this webapp on your device: tap `<iosShareIcon>` then Add to Homescreen `<iosAddToHomescreenIcon>`"

* **additionalContent** `string | Element` - if you wish to specify additional content, send a string value here, or an Element

* **cheatCode** `string` - if specified, this implements a "cheat code" that an end user can type (anywhere, as long as the browser viewport has focus). If entered, this will execute the `cheatCodeCallback()`

* **cheatCodeCallback** `function(selfReference)` - if specified, (and `cheatCode` is also specified), this function is executed when the user successfully enters the cheat code. This is useful for instance, if you wish to allow users to run the full PWA in the browser context without installing it (but only if you give them the secret code). Super handy for debugging, getting access the console, etc, etc.


## Built-in SVG icons

* **`class="iosShareIcon"`** - elements specifying this class in the html template have an SVG of the iOS "share" icon loaded into them

* **`class="iosAddToHomescreenIcon"`** - elements specifying this class in the html template have an SVG of the iOS "add to homescreen" icon loaded into them


## Example
```javascript
let dialog = new installHelpDialog({
    cheatCode: 'shabidoo',
    cheatCodeCallback: function(selfReference){
        // for instance ...
        selfReference._app.writeAppData({ '_enforceAppModeOverride': true });
        selfReference.remove();
        selfReference._app.initUI();
    },
}).append(document.body);
```

## External CSS
As mentioned previously, hard-coded CSS values implement bare-bones layout only. To make a useable widget you'll need to implement some external CSS. This example is taken from the included `examplePWA` app:

```css
/*
	installHelpDialog -- (the install banner)
*/
.installHelpDialog {
	max-height: 5em;
	user-select: none;
	margin: 0;
	padding: 0 0 .5em 0;
    -webkit-user-select: none;
}

.installHelpDialog .msg {
	font-size: 2em;
	text-align: right;
	padding: .25em 1em .25em 0;
}
.installHelpDialog a {
	text-decoration: none;
	color:		     rgb(2, 6, 9);
	border:          3px solid rgb(2, 6, 9);
	border-radius:  .45em;
	padding: 		.25em;
	background-color: rgba(2, 6, 9, .1);
}
.ihHeadingMessageClass {
	display: block;
	font-size: .3em;
}
.ihDialog {
	position: absolute;
	background: url('./gfx/hicox_flower.svg');
	background-size: contain;
	background-repeat: no-repeat;
	background-color: #F2B134;
	border-radius: .45em;
	width: max-content;
	padding-left: 4.5em;
	right: .4em;
	top: 0;
	border: 3px solid rgba(17, 47, 65, .8);
    color: rgba(17, 47, 65, .8);
	margin-top:	.96em;
}
.ihDialog:after {
	content: 					'';
	position: 					absolute;
	top: 						0;
	right: 						12.5%;
	width: 						0;
	height: 					0;
	border: 					0.906em solid transparent;
	border-bottom-color: 		#F2B134;
	border-top: 				0;
	margin-left:		 		-0.906em;
	margin-top: 				-0.906em;
}

```
