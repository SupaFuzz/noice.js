# startupDialog.js

this implements a full screen modal dialog that looks something like this:

```     
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

* **netStatus** `string, default: 'network status:'` -

* **dbStatus** `string, default: 'database status:'` -

* **netReadBytes** `string, default: 0 bytes` -

* **dbStatusDetail** `string, default: ''` -

* **showPieChart** `bool, default: false` -

* **showCancelBtn** `bool, default: false` -

* **title** `string, default: 'startup'` -

* **message** `string, default: 'application startup'` -

* **charts** `object, default: {}` -

* **runAnimation** `bool, default: false` -

* **animationFrame** `integer, default: 0` -

* **welcomeMode** `bool, default: false` -

* **welcomeTitle** `string, default: 'Welcome'` -

* **welcomeMessage** `string, default; "To begin, touch 'start'"` -

* **headingClass** `string, default: 'dialogHeadingClass'` -

* **contentClass** `string, default: 'dialogContentClass'` -

* **chartSize** `integer (svg passthrough), default: 200` -

* **chartBackgroundClass** `string, default: 'chartBknd'` -

* **dbStats** `object, default: {}` -

* **messageContainerClass** `string, default: 'dialogMessageClass'` -

* **welcomeImage** `string (image path), default: './gfx/hicox_flower.svg'` -


## Functions
