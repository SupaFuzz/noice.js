# noiceRadialPolygonPath.js

this is a class for constructing SVG `path` objects where the vertices are defined in radial coordinates. Extremely handy for creating pie charts, spaceships, asteroids and such.

## Requires

* **noiceCore** (`noiceCoreChildClass`)

## Attributes

* **edges** `integer, default: 3` - specify the number of edges to be placed at `radius` from the origin at equal intervals of radians. (For instance: 3 = triangle, 4 = square, 5 = pentagon)

* **phase** `float[0 - (2*Pi)], default: 0` - specify a value for the phase (this allows you to rotate the polygon around the origin). A value of Pi rotates 180 degrees, 2*Pi rotates 360 degrees

* **phaseReverse** `bool, default: false` - if set to a value of `true`, invert the `phase` value (that is rotate counter clockwise)

* **radius** `integer, default: 0` - the number of "pixels" (which is a fuzzy concept in SVG to start with) but basically, how big you want the polygon to by by speficfying the size of the radius

* **vertices** `Array` - this is an array of arrays with the form `[ [x,y], ... ]`. This array is generated automatically by the `generateVertices()` function (see below), but can also be set externally.

* **stroke** `string (css passthrough), default: 'red'` - this is a passthrough to the [`stroke` SVG attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke). This controls the **color** of the stroke

* **strokeWidth** `string (css passthrough), default: '1'` - this is a passthrough to the [`stroke-width` SVG attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-width). This controls the **thickness** of the stroke

* **strokeOpacity** `float[0-1], default: .85` - this is a passthrough to the [`stroke-opacity` SVG attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-width)

* **fill** `string (css passthrough), default: 'red'` - this is a passthrough to the [`fill` SVG attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill). If specified, this controls the **fill color**

* **fillOpacity** `float[0-1], default: .1` - this is a passthrough to the [`fill-opacity` SVG attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-opacity), this controls the **opacity** of the fill color

* **d** `string` - this is the [`d` attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d) of the [SVG `path` object](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path). While you *can* specify this manually, this value is generated for you based on the `edges`, `phase` and `radius` attributes.

* **DOMElement** `Element (SVG Namespace)` - similar to `this.DOMElement` in `noiceCoreUIElement` objects, this is the DOM Element representing the `path` object, which you will `append()` to an SVG Element (or `remove()`)


## Functions

* **`generateVertices()`**

    this function generates vertices based on the `edges`, `phase` and `radius` attributes and sets them as the value of `d` on the SVG Path Element. This function is called internally upon object instantiation (unless a value is given for `vertices` on the constructor), and whenever `edges`, `phase` or `radius` changes value

* **`append(<Element>)`**

    append `this.DOMElement` (an SVG `path` object) to the SVG `<Element>` given (this may be a root level SVG Element or an element within an SVG DOM Tree)

* **`remove()`**

    remove `this.DOMElement` from whatever DOM tree it is currently appended to

## Example
```javascript

// make an SVG object
let chartSize = 200;
  document.body.insertAdjacentHTML('afterbegin', `<svg
      viewBox="${(chartSize/-2)} ${(chartSize/-2)} ${chartSize} ${chartSize}"
      width="${chartSize}"
      height="${chartSize}"
      xmlns="http://www.w3.org/2000/svg"
      id="testSVG"
      >
          <circle class="chartBknd" cx="0" cy="0" r="${(chartSize/2) * (7/8)}" />
  </svg>`);
  let svgObject = document.body.querySelector(`#testSVG`);

  // make a polygon path and add it to the svg
  let daDazzla = new noiceRadialPolygonPath({
      edges:          3,
      radius:         ((chartSize/2) * (6/8)),
      baseFillOpacity:.25
  }).append(svgObject);

  // set up a click handler to toggle an animation  
  daDazzla.DOMElement.dataset.running = 'false';
  daDazzla.DOMElement.addEventListener('click', function(evt){
      evt.target.dataset.running = (evt.target.dataset.running == 'true')?'false':'true';
			if (evt.target.dataset.running == 'true'){ runAnimation(); }
  });

  // run the animation
  let shapes = [3, 4, 5, 6, 7, 8];
  function runAnimation(){

    let o = Math.abs(Math.sin((new Date())/1000));
    daDazzla.fillOpacity = o;

    let w = Math.abs(Math.sin((new Date())/5000));
    daDazzla.strokeWidth = w * 50;

    let x = Math.abs(Math.sin((new Date())/7000));
    daDazzla.strokeOpacity = x;

    let p = Math.sin((new Date())/2000);
    daDazzla.phase = Math.PI * 2 * p;

    daDazzla.stroke = `rgb(${(255*o)}, ${(255*w)}, ${(255*x)})`;
    daDazzla.fill = `rgb(${(255*x)}, ${(255*w)}, ${(255*o)})`;

    let s = Math.sin((new Date())/4000);
    let e = shapes[ Math.abs(Math.floor(s * (shapes.length -1))) ];
    if (daDazzla.edges != e){ daDazzla.edges = e; }

    window.requestAnimationFrame(function(evt){
    	if (daDazzla.DOMElement.dataset.running == 'true'){ runAnimation(); }
    });
  }
```
