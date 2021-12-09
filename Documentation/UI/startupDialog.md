# startupDialog.js

this implements a full screen modal dialog that looks something like this:

```text.plain
         ---------------------------------
        | <title>                         |
        |---------------------------------|
        | pie      |                      |
        | chart    |  <arbitrary content> |
        | svg      |                      |
         ---------------------------------
```

The intended use is as a splash screen dialog for starting a PWA app, though I suppose it could be used for many things.

## Requires

* **noiceCore.js** (`noiceCoreUtility`)
* **noiceCoreUI.js** (`noiceCoreUIElement`, `noiceCoreUIOverlay`)


## Attributes

* **netStatus** `string, default: 'network status:'` - when `this.welcomeMode` is set to `false`, this is a text element on screen that you can set the value of (see example)

* **dbStatus** `string, default: 'database status:'` -  when `this.welcomeMode` is set to `false`, this is a text element on screen that you can set the value of (see example)

* **netReadBytes** `string, default: 0 bytes` - when `this.welcomeMode` is set to `false`, this is a text element on screen that you can set the value of (see example)

* **dbStatusDetail** `string, default: ''` - when `this.welcomeMode` is set to `false`, this is a text element on screen that you can set the value of (see example)

* **showPieChart** `bool, default: false` - when `this.welcomeMode` is set to `false`, you can set this value to `true` to display the built in pie chart (see diagram and example)

* **showCancelBtn** `bool, default: false` - if set to a value of `true`, show the cancel button, otherwise don't

* **title** `string, default: 'startup'` - text for the `<title>` element in the diagram above

* **message** `string, default: 'application startup'` -  when `this.welcomeMode` is set to `false`, you can set this value to `true` to display the built in pie chart (see diagram and example)

* **runAnimation** `bool, default: false` - if set to a value of `true`, will execute the `animationCallback` (if specified) in an infinite `requestAnimationFrame()` loop until the value is changed to `false`

* **welcomeMode** `bool, default: false` - if a value of `true`, show the `welcomeImage`, `welcomeTitle` & `welcomeMessage` attributes. If a value of `false`, remove those elements and display `netStatus`, `netReadBytes`, `dbStatus`, `dbStatusDetail` and `message` elements, and allow the `showPieChart` (if set `true`) to toggle the SVG pie chart visibility (see example)

* **welcomeTitle** `string, default: 'Welcome'` - when `welcomeMode` is set to a `true` value, this is a text element on screen that you can set the value of (see example)

* **welcomeMessage** `string, default; "To begin, touch 'start'"` - when `welcomeMode` is set to a `true` value, this is a text element on screen that you can set the value of (see example)

* **chartSize** `integer (svg passthrough), default: 200` - this value determines the radius of the pie chart. The value is given in [SVG units](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions)


* **welcomeImage** `string (image path), default: './gfx/hicox_flower.svg'` - display this image in the `pie chart svg` area in the diagram above, when `welcomeMode` is set to a value of `true`

* **startBtnText** `string, default: 'start'` - textContent of the start button

* **cancelBtnText** `string, default: 'reload'` - textContent of the cancel button


## Functions

* **`addPieChart({args})`** - each object can contain an arbitrary number of pie charts overlaid atop one another. This function allows you to add a pie chart and takes the following args:

    * **name** `string` - this should be a distinct name (you will use this name to update the chart)

    * **fill** `string (svg passthrough)` - this sets the color of the fill (hint: use CSS `rgba(...)` to set opacity when multiple charts are in play at once) [see documentation](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill)

    * **stroke** `string (svg passthrough)` - this sets the color of the stroke [see documentation](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke)

    * **strokeWidth** `integer (svg passthrough)` - this sets the width of the stroke (default: 1) [see documentation](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-width)

* **`updatePieChart(name, percent)`** - set the `percent` value of the pie chart identified by `name` (NOTE, this is the `name` given via `addPieChart()` or the `pieCharts` attribute at instantiation);


## Example
```javascript
let sd = new startupDialog({
    title:          'Shabidoo v 4.20',
    welcomeTitle:   'Welcome to Shabidoo',
    showPieChart:   false,
    welcomeMode:    true,
    showCancelBtn:  true,
    cancelBtnText:  'cancel',
    pieCharts:      [
        { name:'db',      fill:'rgba(6, 133, 135, .5)' },
        { name:'network', fill:'rgba(17, 47, 65, .2)' }
    ],
    cancelButtonCallback:   function(self, evt){
        // just close it, this is a demo after all
        self.remove();
    },
    startButtonCallback:    function(self, evt){
        // do jazzhands here
        self.welcomeMode = false;
        self.showPieChart = true;
        self.runAnimation = true;
        evt.target.disabled = true;
        self.netStatus = 'demo status:';
        self.netReadBytes = `running animation`;
        self.dbStatus = 'dummy text!';

    },
    animationCallback:      function(self){
        if (self.hasOwnProperty('_animatePolygon')){
            self._animatePolygon.phase = -(((self._animationFrame%2000)/2000) * Math.PI * 2);
            self._animatePolygon.fillOpacity = (self._animatePolygon.baseFillOpacity + (.15 * ((Math.cos(2*Math.PI * (self._animationFrame%250)/250)) + .5)));
            if (((self._animationFrame%100)/100) == 0){
                self._animatePolygon.edges = 3 + Math.floor(Math.random() * 5);
            }
        }
    },
    animationStartCallback: function(self){
        if (! self.hasOwnProperty('_animatePolygon')){
            self._animatePolygon = new noiceRadialPolygonPath({
                edges:          3,
                radius:         ((self.chartSize/2) * (6/8)),
                baseFillOpacity:.25
            }).append(self.svgDOMObject);
        }
    },
    animationExitCallback:  function(self){
        if (self.hasOwnProperty('_animatePolygon')){
            self._animatePolygon.remove();
            delete self._animatePolygon
        }
    }
}).append(document.body);
```
