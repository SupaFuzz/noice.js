# noicePieChart.js

this implements an SVG pie chart



## Requires

* **noiceCore.js** (`noiceCoreUtility`)
* **noiceCoreUI.js** (`noiceCoreUIElement`)



## Attributes

* **showPieChart** `bool, default: false` - if set to a value of `true`, display the pie chart, else don't

* **pieCharts** `array, default: []` - an array of argument objects to be sent to `addChart()`. A single object can contain an arbitrary number of overlaid pie charts, this allows you to add them all at instantiation

* **runAnimation** `bool, default: false` - when set to a `true` value from a previously `false` value, executes the `animationStartCallback()` (if given), after which a [`requestAnimationFrame()`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) loop is entered repeatedly executing the `animationCallback()` (again if given) for each successive animation frame. When the value is set to `false` from a previously `true` value, the requestAnimationFrame loop is terminated and the `animationExitCallback()` is executed (if given).

* **animationCallback(selfReference)** `function` - this function is executed on each animationFrame when `runAnimation` is set true

* **animationStartCallback(that)** `function` - this function is executed when the `runAnimation` attribute is set to `true` from a previously `false` value

* **animationExitCallback()** `function` - this function is executed when the `runAnimation` attribute is set to `false` from a previously `true` value

* **size** `string (css passthrough), default: '2em'` - this value is passed through to the `this.DOMElement.style.width` and `this.DOMElement.style.height` CSS attributes. Any value accepted under the CSS spec is accepted here. Both dimensions are set to the same value yielding a square within which we render the circular pie chart

* **badgeTxt** `string, default: null` - if a non-null string value is specified, this text is overlaid on the pie chart. This is useful for displaying an exact percentage value to the user (though you'd have to update it yourself manually, also for chart titles, etc)

* **chartsize** `integer (svg passthrough), default: 200` - this value determines the radius of the pie chart. The value is given in [SVG units](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions)

* **chartBackgroundClass** `string, default: 'chartBknd'` - this will apply the specified string to the `classList` of the circle element serving as the pie chart background. Allowing more elaborate external CSS styling as occasionally warranted by jazzhands initiatives

* **zIndex** `integer (css passthrough), defult: 0` - this is a passthrough to `this.DOMElement.style.zIndex`, allowing you to set the z-axis coordinate of the DOMElement.



## Functions

* **`async startAnimation()`** - if `animationCallback()` is specified (see above), this internal function is called when the `runAnimation` attribute is set to a value of `true`. The function will continue self-recursing on each animationFrame until `runAnimation` is set to a value of `false`

* **`addPieChart({args})`** - each object can contain an arbitrary number of pie charts overlaid atop one another. This function allows you to add a pie chart and takes the following args:

    * **name** `string` - this should be a distinct name (you will use this name to update the chart)

    * **fill** `string (svg passthrough)` - this sets the color of the fill (hint: use CSS `rgba(...)` to set opacity when multiple charts are in play at once) [see documentation](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill)

    * **stroke** `string (svg passthrough)` - this sets the color of the stroke [see documentation](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke)

    * **strokeWidth** `integer (svg passthrough)` - this sets the width of the stroke (default: 1) [see documentation](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-width)

* **`updatePieChart(name, percent)`** - set the `percent` value of the pie chart identified by `name` (NOTE, this is the `name` given via `addPieChart()` or the `pieCharts` attribute at instantiation);



## Example
```javascript
var chart = new noicePieChart({
    showPieChart: true,
    size: '3.5em',
    pieCharts: [ { name:'inventory', fill:'rgba(191, 191, 24, 1)', stroke:'rgba(191, 191, 24, 1)', strokeWidth:'2px'} ],
    zIndex: 1,
    animationCallback: function(self){
        let pct = (Math.abs(Math.sin((new Date())/3000)) *100);
        self.updatePieChart(`inventory`, pct);
        self.badgeTxt = `${Math.ceil(pct)}%`;
    },
    runAnimation:true,
}).append(document.body);
```
