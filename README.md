# noice.js

This is an object oriented library for building Progressive Web Apps. This isn't a framework, but an object hierarchy that one can either use directly or extend, to get all sorts of handy functionality, causing onlookers to exclaim "[`noice!`](https://youtu.be/SAfq55aiqPc)".

No external dependencies, 100% bespoke vanilla javascript.


## What's Here?
The [`./Documentation`](Documentation) directory contains markdown-formatted documentation

The [`./examplePWA`](examplePWA) directory contains a complete example of a PWA

The [`./noiceARClient`](noiceARClient) directory contains an example of a BMC Remedy ARS Client written as a PWA (note: this example app is only *mostly complete* -- work in progress)

The [`./example`](example) directory contains an example express-based server and some demos for UI components (this is an early test harness -- ymmv, but included for completeness)

The [`./lib`](lib) directory contains the library files:

* [`noiceCore.js`](Documentation/noiceCore.md)

    core object model, everything extends a class from this file


* [`noiceIndexedDB.js`](Documentation/noiceIndexedDB.md)

    provides object oriented interface to indexedDB using promises to handle the many asynchronous operations involved, a standard error object model, and a lightweight data definition language for defining indexedDB instances from configuration data.


* [`noiceRemedyAPI.js`](Documentation/noiceRemedyAPI.md)

    provides a simple, object oriented interface to the BMC Remedy Action Request System (ARS) [REST interface](https://docs.bmc.com/docs/ars2008/overview-of-the-rest-api-929631053.html)


* [`noiceWorkerThread.js`](Documentation/noiceWorkerThread.md)

    provides functionality useful within [Worker Threads](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). This includes hooks for a messaging framework implemented in `noiceApplicationCore.js`, so while this can be used separately, it is particularly well suited for child worker threads of a PWA built from a `noiceApplicationCore` subclass


* [`noiceApplicationCore.js`](Documentation/noiceApplicationCore.md)

    provides an object model for creating complete Progressive Web Apps (PWAs), with worker threads, a serviceWorker for offline capability, hooks for handling install-from-browser, and much more.


* [`noiceCoreUI.js`](Documentation/noiceCoreUI.md)

    provides a root-level object model for creating objects to be shown to the user on the screen (placed into the DOM tree), as well as several extension classes implementing frequently-needed UI object primitives (dialogs, ui switchers, menus, etc)


* [`noiceCoreUIFormElement.js`](Documentation/noiceCoreUIFormElement.md)

    This file contains `noiceCoreUIElement` (noiceCoreUI.js, above) extension classes modeling [Form Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form). That is to say, more or less all of the browser-native Elements that can take user input (fields, menus, textareas etc). These can be used standalone, or within the context of a `formView`.


* noiceCoreUIFormElementTable.js *(work in progress)*

    this file contains a `noiceCoreUIFormElement` (noiceCoreUIFormElement.js, above) subclass implementing a table with sortable/draggable columns and rows. This is currently `functional but incomplete`. Documentation has not yet been written, and while basic functionallity is present, it is somewhat unreliable on mobile devices other than Apple iOS.


* [`formView.js`](Documentation/formView.md) *(documentation in progress)*

    this contains the `formView` class which provides a *large* amount of functionality for defining a `form` (as a collection of related `formElements`), with change flag hooks, asynchronous callbacks for saving, cloning, and much more. *Implementation is fully functional, writing documentation is daunting due to the scale of this class, however, it all works.*



The `./lib/UI` directory contains classes for implementation of common UI widgets as extensions of the `noiceCoreUI` class:


* coreUIScannerInput.js *(work in progress)*

    this file contains a `noiceCoreUIFormElement` (noiceCoreUIFormElement.js, above) subclass implementing a character input with hooks for integration with [TSL-1128 RFID Scanners](https://www.tsl.com/products/1128-bluetooth-handheld-uhf-rfid-reader/). The implementation is mature and stable, the 'work in progress' status is for writing documentation.


* [`iFrameWidget.js`](Documentation/UI/iFrameWidget.md) *(work in progress)*

    this is a `noiceCoreUIScreen` extension class for loading external content in an embedded iFrame. This class is `functional but incomplete` (see documentation)


* [`installHelpDialog.js`](Documentation/UI/installHelpDialog.md)

    this implements a modal banner for prompting the user to install a PWA (with a "cheat code" implementation allowing a secret install bypass to run the app in browser context)


* [`noiceBalloonDialog.js`](Documentation/UI/noiceBalloonDialog.md)

    a floating modal dialog, with hooks for pinning location relative to other DOM Elements, especially well suited for implementing menus.


* [`noicePieChart.js`](Documentation/UI/noicePieChart.md)

    create SVG pie chart objects which can contain multiple concurrent overlaid pie charts, with animation and update hooks as well.


* [`noiceRadialPolygonPath.js`](Documentation/UI/noiceRadialPolygonPath.md)

    create and animate SVG path objects, defined as closed polygons in radial coordinates with sprite(ish) controls like rotation, location, z-index, etc.


* [`recordEditorUI.js`](Documentation/UI/recordEditorUI.md)

    a `noiceCoreUIScreen` extension class for creating, updating, querying, etc a typical "records on a form" interface.


* [`startupDialog.js`](Documentation/UI/startupDialog.js)

    a splash screen with buttons for user interaction and many hooks for showing status (for instance spinning up indexedDB instances, fetching data from network, etc)


## Who made this?

Amy Hicox <amy@hicox.com> aka "SupaFuzz" on github. I sketched out basic ideas back in 2018, but mostly this was written over the past two years of COVID lockdown. No joke I restarted work on the project like 3/2020, and well ... here we are. Who would have ever thought it'd go on long enough to write this much code?

I hope you find it useful. If you've got contributions get in touch

-Amy :smiley: :heart:
