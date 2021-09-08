/*
    coreUIForm
    this models a "form", meaning a collection of noiceCoreUIFormElement objects

    objects of this class are primariy defined by a configuration input

    notable attributes:

        * view
          a noiceCoreUIScreen decendant class displaying the fields for the specified
          viewMode

        * viewMode
          could be anything, but create, or modify are the usuals.

        * viewModeChangeCallback
          is invoked when viewMode changes value. can cancel the mode change by throwing
          and also is a hook for custom screen setup logic

        * saveCallback
          invoked when the user clicks the saveButton, dependong on th viewMode this
          could do different things

        * cloneView
          a clone view

        * cloneCallback
          like the saveCallback but for the clone view

        * handleView
          read only small view. this is a list entry for the form record instance and
          clicking on it tyically gives focus to the view object

        * handleSelectCallback
          is fired when handleView.selected is set true. can cancel select event

        * config
          defines the field set, filters, validatio0n rules, etc for the form
          can only be set on instantiation


          -- 9/7/21 @ 1009
             YEAH OK .... eventually.
             for now we need working demo of what *already* has been written
             minor fixes only. we will return to this, because it makes a heluva
             lot of sense for the presentation layer to be a property of the
             logical record layer.

             but seriously ... later

*/
