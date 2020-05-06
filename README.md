# noice.js
Handy Javascript Object Hierarchy

Javascript Object Hierarchy that is handy

This is a javascript object hierarchy that one can either use directly or extend, to get all kinda handy functionality, causing one to exclaim "noice!".

This is a work in progress. Documentation is largely a to-do item at this point. The best way to get an idea of how all this works and what it can do is to have a look
in ./example (you'll need express to run the http server).

As of today (5/4/2020), the following are implemented and tested:

    * noiceCore.js
      this file implements classes that are extended by all other noice descendant
      classes. These are the classes implemented in this file:

        * noiceObjectCore
        * noiceCoreChildClass
        * noiceException
        * noiceCoreUtility
        * noiceCoreNetworkUtility
        * noiceLogMessage
        * noiceLog
        * noiceApplicationCore


    * noiceCoreUI.js
      this file implements classes for interacting with the DOM

        * noiceCoreUIElement
        * noiceCoreUIOverlay
        * noiceCoreUIDialog
        * noiceCoreUIYNDialog
        * noiceCoreUIHeaderMenu
        * noiceCoreUIScreen
        * noiceCoreUIScreenHolder
        * noiceCoreUIFloatingDialog

    * noiceCoreUIFormElement.js
      this file has classes for modeling user input widgets for forms

        * noiceCoreUIFormElement
        * noiceCoreUIFormElementInput
        * noiceCoreUIFormElementSelect
        * noiceCoreUIFormElementText
        * noiceCoreUIFormElementNumber
        * noiceCoreUIFormElementDate
        * noiceCoreUIFormElementCheckbox
        * noiceCoreUIFormElementFile

    * noiceCoreUIFormElementTable.js
      this implements fancy-ass tables and has one class

        * noiceCoreUIFormElementTables

    * noiceRemedyAPI.js
      this implements a noice promise-wrapped interface to the BMC Remedy REST API

    * noiceIndexedDB.js
      this implements a noice promise-wrapped interface to the indexedDB

TO-DO list:

    * noiceCoreUIForm
      this is a descendant of noiceCoreUIScreen ... this is a kind of UI screen
      that contains a set of data attributes, some or all of which may be represented
      in the UI by a noiceCoreUIFormElement object.

      A set of values can be loaded into the UI, and modified on screen. A change
      flag is managed by the object. Forms have create and modify modes.

      this object does not deal with data management, only with the UI. CRUD stuff
      is handled via external callbacks. This is just the faceplate.

    * noiceARSCacheManager
      sits between noiceRemedyAPI and noiceIndexedDB, and accepts CRUD transactions
      more than likely from noiceCoreUIForm. This should run in the service-worker
      context and this should manage all the data stuff in the background. The model
      is that the local indexedDB is write first with network retries until success.
