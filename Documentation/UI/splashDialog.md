# splashDialog.js

This is a better version of startupDialog.js. This is a full-screen modal splash screen dialog with user interaction hooks (start, refresh buttons, optional user/pass inputs), progress display capability (a noicePieChart) with animation hooks and a configurable welcome image.

This is the hard-coded layout. You may wish to enhance this with external CSS (see `external CSS` section below)




## Requires

* noiceCore.js
* noiceCoreUI.js
* noicePieChart.js
* noiceRadialPolygonPath.js
* noiceCoreUIFormElement.js




## Synopsis

```text.plain
 ---------------------------------
| <title>                         |
|---------------------------------|
|          |                      |
|  <gfx>   |    <screenHolder>    |
|          |                      |
 ---------------------------------
```

* `<title>` is an optional heading text (see `title` attribute)

* `<gfx>` is a screenHolder with two screens:

    * `welcomeImage` - shows a welcome image (see `welcomeImage` attribute override)

    * `pieChart` - displays the pie chart (see `showPieChart` attribute)

* `<screenHolder>` is a screenHolder with two built-in screens (you may wish to add more externally for your own needs)

    * `welcomeMessage` - displays a welcome message (see `welcomeTitle` and `welcomeMessage` attributes), as well as optional start and reload buttons (see `showStartButton`, `startButtonText`, `startButtonCallback`, `showReloadButton`, `reloadButtonText`, `reloadButtonCallback`)

    * `auth` - displays Login ID and Password user input fields along with the start and reload buttons (optionally)

## Examples
```javascript

// make a splash screen with a start button
var dlg = new splashDialog({

    // do these things when the user clicks the start button
    startButtonCallback: function(selfReference, evt){

        // lock the start button and show the animation while we 'do thangs'
        evt.target.disabled = true;
        selfReference.runAnimation = true;
        let abort = false;
        someAsyncProcess().catch(function(error){

            // show the error
            abort = true;
            selfReference.welcomeTitle = 'error';
            selfReference.welcomeMessage = error;
            selfReference.runAnimation = false;
            evt.target.disabled = false;

        }).then(function(){
            if (! abort){

                // it's all good close the dialog and keep on truckin
                selfReference.remove();
            }
        })
    }
}).append(document.body)



// make a login screen
var dlg = new splashDialog({
	showReloadButton: false,
	display: 'auth',
	startButtonCallback: function(s, e){
		e.target.disabled = true;
        console.log(`user: ${s.userInput.value} password: ${s.userPass.value}`)
	},
	reloadButtonCallback: function(s, e){
		e.target.disabled = true;
		console.log("clicked reload")
	}
}).append(document.body);
```




## Attributes

* **title** `string | Element` - provide a string value to set the textContent of `<title>` in the above diagram or an Element to drop-in replace it

* **display** `enum(welcomeMessage, auth), default: welcomeMessage` - this attribute controls which message UI is visible. By default the 'welcomeMessage' UI is shown. If you need a custom UI you can add it to `msgScreenHolder` then call `switchUI` externally

* **showPieChart** `bool, default: false` - when set true, this will hide the `welcomeImage` and show the `pieChart`, if set false, will hide the pieChart and show the welcomeImage

* **pieChart** `noicePieChart` - this is a reference to the pieChart object (visible with `showPieChart = true`) -- see docs for noicePieChart for options avaiable, in particular `updatePieChart`

* **pieCharts** `Array` - noicePieChart objects can have multiple pie charts embedded and visible concurrently (see noicePieChart docs). This is an array defining the pie charts you wish to display and update. The default value of this parameter defines two ('network' and 'db'). This array is passed to the `pieCharts` attribute of the noicePieChart object at instantiation (updates to this attribute have no effect).

* **runAnimation** `bool, default: false` - if you need to show indeterminate progress (for instance an async process is running but you cannot know the progress status), you can set this value `true`. This will set `showPieChart` true, and will overlay an animation. Setting it false stops the animation and removes the overlay. If you don't want the pieChart afterward, you'll need to set `showPieChart` false externally.

* **welcomeTitle** `string | Element` - provide a string value or Element replacement for the 'welcomeTitle' (visible when `display = 'welcomeMessage'`)

* **welcomeMessage** `string | Element` - provide a string value or Element replacement for the 'welcomeMessage' (visible when `display = 'welcomeMessage'`)

* **userInput** `noiceCoreUIFormElementInput` - when `display = 'auth'`, this is a reference to the formElement for the 'Login ID'. (`this.userInput.value` has the value)

* **userPass** `noiceCoreUIFormElementPassword` - when `display = 'auth'`, this is a reference to the formElement for the 'Password'. (`this.userPass.value` has the value)

* **errorMessage** `string` - provide a string on this attribute to display an error message. If set to a `null` value, the error message element is hidden, when a non-null value is given it is shown.

* **gfxScreenHolder** `noiceCoreUIScreenHolder` - this is the screenholder for the `<gfx>` section in the above diagram. You can add additional graphics to this screenholder to show graphics other than the 'pieChart' and 'welcomeImage'

* **msgScreenHolder** `noiceCoreUIScreenHolder` - this is the screenholder for the `<screenHolder>` section in the above diagram. You can add additional screens to this screenholder to display UIs other than 'auth' and 'welcomeMessage'

* **showStartButton** `bool, default: true` - if true, display the start button on the 'auth' and 'welcomeMessage' UIs

* **startButtonText** `string, default: 'start'` - use this attribute to control the text displayed in the start button

* **startButtonCallback** `function(selfReference, event)` - if given, execute this callback with a self reference and the click event as arguments when the user clicks or touches the start button

* **showReloadButton** `bool, default: false` - if true, display the reload button on the 'auth' and 'welcomeMessage' UIs

* **reloadButtonText** `string, default: 'reload'` - set the text displayed in the reload button

* **reloadButtonCallback** `function(selfReference, event)` - if given, execute this callback with a self reference and the click event as arguments when the user clicks or touches the reload button (for instance, signal the serviceWorker to dump the cache then reload the app)

* **welcomeImage** `string (SVG source)` - by default, this attribute getter points to the `hicox_flower` attribute, which renders the pretty flowerish logo I've been using since the 90's. Set this value at instantiation to alternate SVG source if you want to change it.

* **hicox_flower** `string (SVG source)` - just included so the lib doesn't need img files. The default welcomeImage

* **btnStart** `Element` - a reference to the start button element on the currently focussed message UI

* **btnReload** 'Element' - a reference to the reload button element on the currently focussed message UI

## external CSS
by default, this library only hard codes CSS directly necessary to implement layout. This is an example of external CSS to dress it up in an acceptable fashion. NOTE that this CSS includes rules to style most other noice dialogs as well as this one, so much of this can be reused:

```css
/*
    splashDialog (keeps same class names as startupDialog, so these rules style both)
*/
.startupDialogUI {
	background: radial-gradient(#F2B134, #AD7B1D);
    width: max-content;
    border-radius: .45em;
    border: 3px solid rgba(17, 47, 65, .8);
    color: rgba(17, 47, 65, .8);
    overflow: hidden;
	user-select: none;
    -webkit-user-select: none;
    font-size: .66em;
}
.startupDialogUI li .statusDetail {
	margin-bottom: .5em;
}
.startupDialogUI .statusDetail {
	font-style: italic;
	font-size: .75em;
	margin-bottom: 1.5em;
	display: inline-block;
}
.startupDialogUI .msg {
	margin: .25em 0 .25em 0;
}
.startupDialogUI . .welcomeTitle {
	margin: .25em 0 .25em 0;
}
.startupDialogUI .startupWelcome {
	border-left: .25em solid rgba(17, 47, 65, .15);
	padding: 1em;
}
.startupDialogUI .startupWelcome .welcomeMessage {
	margin: 0;
	max-width: 20em;
}
.startupDialogUI .btnContainer {
	margin: 2em 0 0 0;
}

/*
	authStartupDialog - styling for the auth UI
*/
.authStartupDialog .loginUI {
	font-size: 1.25em;
	margin-top: 1.5em;
	padding: .5em;
	display: grid;
}
.authStartupDialog .loginUI .ncuFormElement {
	margin: .25em 0 .25em 0;
}
.authStartupDialog .loginUI .ncufeLabel {
  margin: .25em .25em .25em 0;
}
.authStartupDialog .loginUI .ncuFormElementField:focus {
	background: none;
}
.authStartupDialog .loginUI .ncuFormElementField {
	font-size: 1em;
	border-top-color: transparent;
	border-left-color: transparent;
	border-radius: .66em;
	border-bottom: 1px solid rgba(240,240,240, .33);
	border-right: 1px solid rgba(240,240,240, .33);
	box-shadow: 2px 2px 2px rgba(20, 22, 23, .3) inset;
	background: radial-gradient(ellipse at top left, rgba(150, 167, 173, .1), rgba(150, 167, 173, .2));
}
.authStartupDialog button.btnUpdate {
	background: url('./gfx/checkUpdates_icon_dark.svg');
	background-repeat: no-repeat;
	background-size: contain;
	background-position: right;
	padding-right: 2em;
	border-color: transparent;
	margin-right: 1.5em;
}
.authStartupDialog .btnContainer {
	display: flex;
	flex-direction: row-reverse;
}
.authStartupDialog .authErrorMsg {
	width: max-content;
	justify-self: end;
	background: url('./gfx/fuscia_warning.svg');
	background-repeat: no-repeat;
	background-size:contain;
	background-position:  left;
	padding: .25em 0 .25em 2em;
	margin: .5em;
	font-style: italic;
}

/*
  dialogs in general
*/
@media screen and (orientation:portrait) {
	.dialogContentClass:not(.startupDialogUI .dialogContentClass) {
		width: 66vw;
	}
}
@media screen and (orientation:landscape) {
	.dialogContentClass:not(.startupDialogUI .dialogContentClass) {
		width: 66vh;
	}
}
.dialogHeadingClass {
    text-align: left;
    margin: 0;
    width: 100%;
    padding: .25em 0 .25em .5em;
    border-bottom: 1px solid rgba(17, 47, 65, .8);
    background: linear-gradient(rgba(240, 240, 240, .35), rgba(240, 240, 240, .1), rgba(240, 240, 240, .05));
    box-shadow: 0 .15em .15em rgba(17, 47, 65, .1);
	font-family: 'Comfortaa';
}
.dialogHeadingClass h2 {
	font-size: .8em;
	margin: .5em 0 .5em .5em;
}

.dialogMessageClass {
    font-size: .5em;
    text-align: left;
    padding: .25em 0 .25em .5em;
}

.dialogContentClass button:active {
	color: rgba(240, 240, 240, .6);
	background-color: rgba(17, 47, 65, 1);
}
.dialogContentClass button:disabled {
	font-weight: normal;
	background-color: rgba(17, 47, 65, .05);
	border: 2px solid rgba(17, 47, 65, .2);
	color: rgba(17, 47, 65, .5);
}

.dialogContentClass button {
	margin: .25em;
	font-size: 1.25em;
	font-weight: bold;
	background-color: rgba(17, 47, 65, .2);
	border: 2px solid rgba(17, 47, 65, .6);
	color: rgba(17, 47, 65, 1);
	padding: .25em .5em .25em .5em;
	border-radius: .5em;
}

/*
	pieChart background
*/
.chartBknd {
	fill: rgba(17, 47, 65, .2);
	stroke: rgba(17, 47, 65, .6);
	stroke-width: 1px;
}

/* document-global rules */
html, body {
  position: fixed;
  overflow: hidden;
  height: 100%;
  width: 100%;
}
body {
	font-size: 2.5em;
	font-family: -apple-system, Helvetica, Arial, sans-serif;
	margin: 0;
	padding: 0;
	text-align: center;
    background-color: rgb(0, 0, 0);
}
button, input {
	font-family: Comfortaa;
}
input, textarea, select {
	border-radius: 	.35em;
	padding: .25em .5em .25em .5em;
	width: 100%;
}
button {
	border-radius: .35em;
}
@font-face {
    font-family: 'Comfortaa';
    src: url('./gfx/fonts/Comfortaa.woff2') format("woff2");
}

```
