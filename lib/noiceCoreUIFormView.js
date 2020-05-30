/*
    noiceCoreUIFormView
    this is an extension of noiceCoreUIScreen
    its expected that you will subclass this for each unique
    form you want to work with.

    once you instantiate an object and place it in a UIHolder,
    you can place it in one of the following modes:

        * create
          displays the "create" set of fields with default or empty
          values. the 'Save' button invokes createRecordCallback()
          and what you do from there is up to your app, but probably
          tha'll mean writing to indexedDB and queueing a transmit
          to a server with the cacheManager

        * modify
          the update mode requires that you send a dataset to the
          object to render the pre-modification state of the record
          in the UI. Changes made by the user automatically toggle
          the changeFlag. The 'Save' button invokes modifyRecordCallback()

        * readonly
          this is the 'update' mode except all user interaction to the fields
          is blocked.

    Callbacks:

        * validateRecordCallback()
          this is called when the save() method is invoked before
          createRecordCallback() or modifyRecordCallback(). This callback
          must return a very specific data structure so that errors can be
          rendered appropriately in the UI. This can cancel the save process

        * createRecordCallback
          is called when the save() method is invoked. this is for flushing data
          to localStorage or indexedDB (or possibly directly to server).

        * modifyRecordCallback
          same thing as createRecordCallback, except that we have the intent of
          modifying an existing record rather than creating a new one

        * recordLoadedCallback
          this callback is invoked when the loadRecord() function is called,
          after any previous data has been removed and before new data is inserted.
          this allows logic for field value mapping, setting up the UI, etc.

    Functions:

        * loadRecord(data)
          load the given data into the UI & invoke recordLoadedCallback()

        * unloadRecord()
          if a record is currently loaded in the UI, remove it.

        * save()
          whatever is on the screen try to save it. if we're in create mode,
          try to create it, if we're in modify mode, try to modify it and
          invoke the appropriate callbacks

        * validate()
          check validtion rules from the initial config loaded when the
          object was instantiated, and invoke validateRecordCallback() if
          we have one.

    Attributes:

        * (array) changedFields
          array of objects of the form: { fieldName:*, oldValue:*, newValue:*, modified: <dateTimeHiRes> }

        * (bool) changeFlag
          true if changedFields.length > 0  :-)

    Configuration:
        the configuration details the fields that the form has, their types etc
        That data structure is:

            {
                form: {
                    // meta for the form level goes here
                    // I have lots of ideas, but let's not
                    // start making shit up yet. we'll get there.
                },
                fields: {
                    <fieldName>: {
                        id:             [int||guid],
                        type:           [enum: <any noiceCoreUIFormElement subclass>],
                        defaultValue:   [str],
                        label:          [str],
                        labelLocation:  [enum: top|left|embed],
                        help:           [str],
                        modes: {
                            create: {
                                visible:          [bool],
                                locked:           [bool],
                                lockedIfNotNull:  [bool]
                                nullable:         [bool],
                                displayOrder:     [int]
                            },
                            modify: { ... same options ... },
                            display: { ... same options (except everything is always locked true) }
                        }
                    }
                }
            }

*/
class noiceCoreUIFormView extends noiceCoreUIScreen {

/*
    noiceCoreUIFormView.getFormElement(type, fieldConfig)
    this is a static function that routes config 'type'
    values to noiceCoreUIFormElement subclasses.

    there are probably lots better ways to do this, but I
    don't know them. Yes, I could assign my class definitions
    to constants. I am aware of this. While I'm at it, converting
    all of this to a legit ES6 modules would be ideal.

    https://github.com/mdn/js-examples/tree/master/modules

    however, I'm not gonna go down that rabit hole today.

    LOOSE END: 5/6/2020 @ 1939
    ok, so there's a fair bit of work to do still in noiceCoreUIFormElement.
    This is a to-do list where that's concerned. For the moment, I need to
    focus on getting noiceCoreUIFormView working. Then we can come back and
    examine the field list support

        1) implement noiceCoreUIFormElementButton

        2) implement noiceCoreUIFormElementTime

        3) implement noiceCoreUIFormElementDateTime
           as a union of noiceCoreUIFormElementDate & noiceCoreUIFormElementTime
           offhand, I'm sayin' extend noiceCoreUIFormElementDate to have a child time

        4) implement noiceCoreUIFormElementCurrency
           as an extension of noiceCoreUIFormElementNumber with hard-coded
           precision 2, and an optional currency signifier char or something.
           nothing fancy. a damn dollar sign.

        5) hack validations onto noiceCoreUIFormElementNumber to enforce:
            * int
            * decimal
            * real

        6) implement noiceCoreUIFormElementRadio
*/
static getFormElement(fieldType, fieldConfig){


    try {
        switch(fieldType){

            /*
                aliases for implemented noiceCoreUIFormElement subclasses
            */
            case   'char':
                // noiceCoreUIFormElementInput
                return(new noiceCoreUIFormElementInput(fieldConfig));
                break;
            case   'date':
                // noiceCoreUIFormElementDate
                return(new noiceCoreUIFormElementDate(fieldConfig));
                break;
            case   'int':
                // noiceCoreUIFormElementNumber
                // to-do: hack input validations onto noiceCoreUIFormElementNumber for each mode
                return(new noiceCoreUIFormElementNumber(fieldConfig));
                break;
            case   'real':
                // noiceCoreUIFormElementNumber (see above)
                return(new noiceCoreUIFormElementNumber(fieldConfig));
                break;
            case   'decimal':
                // noiceCoreUIFormElementNumber (see above)
                return(new noiceCoreUIFormElementNumber(fieldConfig));
                break;
            case   'dropdown':
                // noiceCoreUIFormElementSelect
                // to-do: hack on a 'dynamic' mode (like char menus in ars)
                return(new noiceCoreUIFormElementSelect(fieldConfig));
                break;
            case   'checkbox':
                // noiceCoreUIFormElementCheckbox
                return(new noiceCoreUIFormElementCheckbox(fieldConfig));
                break;
            case   'table':
                // noiceCoreUIFormElementTable
                return(new noiceCoreUIFormElementTable(fieldConfig));
                break;

            /*
                aliases for not-yet-implemented noiceCoreUIFormElement subclasses
            */
            case   'diary':
                // to-do
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'dateTime':
                // to-do: (oh shit! I forgot this one!)
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'time':
                // to-do: (oh shit! I forgot this one! - required for dateTime composite element)
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'currency':
                // to-do: (oh shit! I forgot this is needed day one!)
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'radio':
                // to-do
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'button':
                // to-do: (sigh ... yeah it's probably better modeled as a formElement)
                throw(`${fieldType} is not yet implemented`);
                break;

            /*
                throw an error if we don't know fieldType at all
            */
            default:
                throw(new noiceException({
                    message:        `[static] noiceCoreUIFormView.getFormElement() - invalid fieldType`,
                    messageNumber:   420,
                    thrownBy:       `[static] noiceCoreUIFormView.getFormElement()`
                }));
        }
    }catch(e){
        throw(new noiceException({
            message:        `[static] noiceCoreUIFormView.getFormElement() - failed to instantiate ${fieldType}/${fieldConfig.name}: ${e.toString()}`,
            messageNumber:   420,
            thrownBy:       `[static] noiceCoreUIFormView.getFormElement()`
        }));
    }
}




/*
    constructor({

    })
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'noiceCoreUIFormView',
        _config:                {},
        _formElements:          {},
        _fieldReferences:       {},
        _saveButtonText:        'save',
        _saveButton:            undefined,
        _formMode:              'locked',
        _changeFlag:            false,
        _snapshot:              {},
        saveButtonClass:        'ncfuFormViewSaveButton',
        fieldReferenceClass:    'ncfuFormFieldReference',
        firstFocus:             true,
        deferRender:            true,
    },defaults),callback);

    this.render();
    this._antiscedantStyle();

} // end constructor




/*
    getter and setter for config
*/
get config(){ return(this._config); }
set config(cfg){

    // bounce if the given config ain't an object at least
    if (! (cfg instanceof Object)){
        throw(new noiceException({
            message:        `${this._className}/config setter: specified config is not an Object`,
            messageNumber:   420,
            thrownBy:       `${this._className}/config setter`
        }));
    }

    /*
        LOOSE END:
        if we ever do form properties, handle that here
    */

    // bounce if we don't have fields ...
    if (! (cfg.hasOwnProperty('fields') && (cfg.fields instanceof Object))){
        throw(new noiceException({
            message:        `${this._className}/config setter: specified config does not contain fields`,
            messageNumber:   421,
            thrownBy:       `${this._className}/config setter`
        }));
    }

    // get formElements for everything so we can bind up with this.html in setup()
    let that = this;
    Object.keys(cfg.fields).forEach(function(fieldName){
        if (! this.formElements.hasOwnProperty(fieldName)){
            this.formElements[fieldName] = noiceCoreUIFormView.getFormElement(cfg.fields[fieldName].type, cfg.fields[fieldName]);
            this.formElements[fieldName].valueChangeCallback = function(valNew, valOld){
                that.fieldValueChange(fieldName, valNew, valOld);
            };
        }
    }, this);

    // swap out the config
    this._config = cfg;
}



/*
    getter for formElements
*/
get formElements(){ return(this._formElements); }






/*
    fieldReference(fieldName)
    register a placeholder div in this.html which will contain the specified field
*/
fieldReference(fieldName){

    /* we can't do this error check here because the parent class calls render() for us
    if (! (this.formElements.hasOwnProperty(fieldName) || fieldName == 'saveButton')){
        throw(new noiceException({
            message:        `${this._className}/fieldReference: invalid fieldName`,
            messageNumber:   421,
            thrownBy:       `${this._className}/fieldReference`
        }));
    }
    */
    let guid = this.getGUID();
    this._fieldReferences[guid] = fieldName;
    return(`<div class="${this.fieldReferenceClass}" id="${guid}"></div>`);
}



/*
    get html()
    this one is a bit more elaborate. This is where you
    "design your form" so to speak. You can build any crazy
    html you want here. To insert a formElement field in your
    design, substitute ${this.fieldReference('<fieldName>')}

    special references
        * this.fieldReference('saveButton') is a reference to the save button

    it's highly expected that you'll override this, but here's a generic one :-)
*/
get html(){

    /* insert shenannigans here */

    // cram all the fieldReferences in either displayOrder or alphabetic by name into an array
    let tmpFieldReferences = [];
    let fieldList = Object.keys(this.formElements);
    let that = this;
    fieldList.sort(function(a,b){
        if (that.formElements[a].hasOwnProperty('displayOrder') && that.formElements[b].hasOwnProperty('displayOrder')){
            return(that.formElements[a].displayOrder - that.formElements[b].displayOrder);
        }else{
            return(that.formElements[a].name.localeCompare(that.formElements[b].name));
        }
    }).forEach(function(fieldName){
        if (fieldName != 'recipe'){
            tmpFieldReferences.push(this.fieldReference(fieldName));
        }
    }, this);

    // render them all inside a 1 column grid layout with the save button on top
    // easy peasey corporate sleazy
    return(`

        <div class="${this._className}Fields" style="display:grid;grid:1fr;text-align:center;">
            <div class="fvCtrlPnlTop">
                ${this.fieldReference('recipe')} ${this.fieldReference('saveButton')}
            </div>
            ${tmpFieldReferences.join('')}
            <!-- remove before flight -->
            <div class="fvCtrlPnl">
                <button id="btnLocked">Locked</button>
                <button id="btnModify">Modify</button>
                <button id="btnCreate">Create</button>
            </div>
        </div>


    `);
}




/*
    async setFocus(<bool>)1
*/
async setFocus(bool){
    focus = (bool === true);


    /*
        firstFocus / setup
        the first time the UI is focused, we run this.setup()
        but ONLY the first time :-)
    */
    if (this.firstFocus){
        try {
            this.setup();
        }catch(e){
            throw(new noiceException({
                message:        `first focus setup() failed: ${e.toString()}`,
                messageNumber:    420,
                thrownBy:       `${this._className}/setFocus/firstFocus setup()`,
                detail:         e
            }));
        }
        this.firstFocus = false;
    }

    /*
        this.gainFocus()    is called before the UI gains focus (ui init hooks go here)
        this.leaveFocus()   is called before the UI loses focus (save hooks go here)
    */
    if (focus && (! this.focus)){
        this.gainFocus();
    }else if ((! focus) && this.focus){
        this.leaveFocus();
    }

    // set this._focus and invoke the callback
    super.setFocus(focus);
}



/*
    setup()
    this is run on the first focus (so the real first time it gets drawn)
    but only once.
*/
setup(){
    /*
        insert all the formElement references
    */
    this.DOMElement.querySelectorAll(`.${this.fieldReferenceClass}`).forEach(function(el){
        if (this._fieldReferences[el.id] == 'saveButton'){
            // setup the save button
            try {
                this.saveButton = document.createElement('button');
                this.saveButton.textContent = this.saveButtonText;
                this.saveButton.disabled = (! this.changeFlag);


                // insert callbacks here
                let that = this;
                this.saveButton.addEventListener('click', function(e){ that.clickSaveButton(e); });

                // insert the save button
                el.append(this.saveButton);
            }catch(e){ console.log(e) }
        }else{
            // append everything else
            this.formElements[this._fieldReferences[el.id]].append(el);
        }
    }, this);

    // hang hooks on the form mode buttons
    let that = this;
    this.DOMElement.querySelector('#btnLocked').addEventListener('click', function(){
        // set locked mode
        that.formMode = 'locked';
    });
    this.DOMElement.querySelector('#btnModify').addEventListener('click', function(){
        // set modify mode
        that.formMode = 'modify';
    });
    this.DOMElement.querySelector('#btnCreate').addEventListener('click', function(){
        // set create mode
        that.formMode = 'create';
    });

    /*

        LOOSE END: 5/28/2020 @ 1857
        initialize the change flag
        this should really be inside the formMode setter and
        we should be setting a form mode here inside setup()
        but we testin' here ...
    */
    this.changeFlag = false;

    /* test dirtyRecordAreYouSure()
    this.dirtyRecordAreYouSure().then(function(bool){
        console.log(`user clicked: ${bool}`)
    }).catch(function(e){
        console.log(`bad shit! ${e}`);
    })
    */



}




/*
    formMode stuff
*/
get formMode(){ return(this._formMode); }
set formMode(m){
    switch(m){
        case 'locked':

            /*
                locked -- just lock all the fields otherwise leave 'em as -is
            */
            Object.keys(this.formElements).forEach(function(fieldName){
                this.formElements[fieldName].enable = false;
            }, this);

            break;
        case 'create':
            /*
                - if changeFlag is set, pop up the are you sure/save dialog

                - reset all fields to default values (or null)

                - iterate formElements and set state attributes tagged for 'create'
                  this may involve hiding fields, which we will accomplish via
                  css visibility='hidden'
            */

            if (this.changeFlag){
                let that = this;
                this.dirtyRecordAreYouSure().then(function(zTmpDialogResult){
                    if (zTmpDialogResult){
                        that.setFormModeProperties(m);
                        that._formMode = m;
                    }else{
                        // user clicked no -- so -- don't do anything
                    }
                });
            }

            break;
        case 'modify':
            /*
                - if changeFlag is set, pop up the are you sure/save dialog

                - reset all fields to default values (or null)

                - iterate formElements and set state attributes tagged for 'create'
                  this may involve hiding fields, which we will accomplish via
                  css visibility='hidden'
            */

            if (this.changeFlag){
                let that = this;
                this.dirtyRecordAreYouSure().then(function(zTmpDialogResult){
                    if (zTmpDialogResult){
                        that.setFormModeProperties(m);
                        that._formMode = m;
                    }else{
                        // user clicked no -- so -- don't do anything
                    }
                });
            }

            break;
    }
}


/*
    setFormModeProperties(mode)

    NOTE: if you set a 'value' attribute in the config mode-tree for a field
          this will be applied as a default value for the specified mode
*/
setFormModeProperties(mode){
    Object.keys(this.formElements).forEach(function(fieldName){
        if (this.config.fields[fieldName].modes.hasOwnProperty(mode)){
            Object.keys(this.config.fields[fieldName].modes[mode]).forEach(function(property){
                this.formElements[fieldName][property] = this.config.fields[fieldName].modes[mode][property];
            }, this);
        }
    }, this);
}





/*
    saveButton stuff
*/
get saveButtonText(){ return(this._saveButtonText); }
set saveButtonText(v){
    this._saveButtonText = v;
    if (this.saveButton instanceof Element){ this.saveButton.textContent = this.saveButtonText; }
}
get saveButton(){ return(this._saveButton); }
set saveButton(v){ this._saveButton = v; }

/*
    clickSaveButton(evt)
*/
clickSaveButton(evt){

    /*
        we don't do any saving here, just piping data to an aync callback
        so if you don't got one you betta axe somebody henny.

        LOH 5/28/2020 @ 1857
        we need to send the form mode and field values to the callback
        this means next steps:

            1) [done] set up a test harness to set the different form modes
               make sure that shit works

            2) go back into setup() and set the default form mode, etc
                -> value capture on embed labels tricks change flag detector
                -> setting default values on date fields like what?

            3) [done] test triggering the dirtyRecordAreYouSure() with a form mode change

            4) test loading record data

    */
    if ((this.hasAttribute('saveCallback') && this.saveCallback instanceof Function)){
        this.saveCallback({
            // data to send to callback
        }).then(function(v){
            // reset change flag
            // update UI post-save
        }).catch(function(e){
            // hannle yo bidness ...
        });
    }


    /*
        set the current state as the initial state and reset the change flag
        therefore turning off the save button.
    */

}




/*
    gainFocus()
    is run each time the UI enters the focussed state
*/
gainFocus(){
    // we ought to invoke loading a specified record etc here
}



/*
    leaveFocus()
    is fun each time the UI leaves the focussed state
*/
leaveFocus(){
    // we ought to check the change flag and prompt user, etc here
}


/*
    loadRecord(data)
    discard any data currently in the UI and load the given
    data into the UI as a newly loaded record. This resets the
    change flag and invokes recordLoadedCallback().
    if the changeFlag is set, invokes dirtyRecordAreYouSure()
*/
loadRecord(data){
    // insert code here
}



/*
    resetUI(mode)
    resets the UI to a default state for the specified mode with no record
    loaded into the form mode is 'create' or 'modify'.
    if the changeFlag is set, invokes dirtyRecordAreYouSure()
*/
resetUI(mode){
    // insert code here
}


/*
    dirtyRecordAreYouSure()
    if the changeFlag is set on an operation that may discard data such as
    loading a new record or changing modes, this function will be invoked,
    opening a modal dialog of the form: "Are You Sure?"

    this returns a promise that resolves to a boolean (true = save it, false: discard)
*/
dirtyRecordAreYouSure(){
    let that = this;
    return(new Promise(function(toot,boot){
        try {
            let prompt = new noiceCoreUIYNDialog({
                heading:        'Are You Sure?',
                message:        'This will discard unsaved changes. Do you wish to save them first?',
                yesButtonTxt:   'save',
                noButtonTxt:    'discard',
                hideCallback:   function(self){
                    toot(self.zTmpDialogResult);
                }
            }).show(that.DOMElement);
        }catch(e){
            boot(e);
        }
    }));
}


/*
    validate()
    execute validations for field limits defined in the config
    and invoke validateRecordCallback(). if one wishes to
    illustrate validation exceptions on-screen, this'd be the
    place to do that
*/



/*
    clearValidationErrors()
    clear validation status and remove any on-screen exception markers
    probably-definitely called at the top of validate()
*/



/*
    save()
    invoke validate()
    depending on mode:

        * create
          invoke createRecordCallback()

        * modify
          invoke modifyRecordCallback()
*/





/*
    Change Flag Stuff

        * setting changeFlag = false resets the change flag
          but also takes a snapshot of current field values and
          calls this the baseline. Therefore subsequent calls
          to the changeFlag getter will return false if the current
          set of field values are identical to the snapshot and true
          if there are differences.

        * changedFields --- yeah ... do we really need this? I dunno
          but the above should be suffucient to get the changeFlag
          working enough to drive the save button

        * changeFlagCallback is there so one could hook into that
          externally (for instance flipping button states and such)
*/
set changeFlag(b){

    // handle the changeFlagCallback should we have one
    if ((this.hasAttribute('changeFlagCallback')) && (this.changeFlagCallback instanceof Function)){
        this.changeFlagCallback((b === true), this._changeFlag);
    }

    // get down to bidness
    this._changeFlag = (b === true);
    if (! this._changeFlag){
        // setting change flag false, take snapshot
        this._snapshot = {};
        Object.keys(this.formElements).forEach(function(fieldName){
            this._snapshot[fieldName] = this.formElements[fieldName].value;
        }, this);
    }

    // toggle the save button if we've got one
    if (this.saveButton instanceof Element){ this.saveButton.disabled = (! this.changeFlag); }
}
get changeFlag(){ return(this._changeFlag); }

/*
    fieldValueChange(fieldName, valNew, valOld)

    each time a formElement changes value, this function is
    called with the above arguments.
*/
fieldValueChange(fieldName, valNew, valOld){

    // remove before flight
    console.log(`[fieldValueChange (${fieldName})] [snap]: ${this._snapshot[fieldName]} [new]: ${valNew} [old] ${valOld}`);

    /*
        changeFlag logic is as follows

        if the thing you're setting is different than the thing in the snapshot
        we are obviously going to set the changeFlag

        if the change flag is currently set and the thing you are setting is the
        same as the thing in the snapshot, we're going to check all the other fields
        against the snapshot -- if no differences are found, we'll reset the changeFlag

        this is the price of using the setter to get the snapshot, really ... worth it I think.
    */
    if (! (valNew == this._snapshot[fieldName])){
        this.changeFlag = true;
    }else{
        if (this.changeFlag){
            // check all the other fields for changes and reset changeFlag if needed
            if (this.changedFields.length == 0){ this.changeFlag = false; }
        }
    }
}



/*
    changedFields
*/
get changedFields(){
    /*
        build an array of objects of the form: {
            fieldName:*,
            oldValue:*,
            newValue:*,
        }
        and return it for all fields different than the snapshot
    */

    let tmp = [];
    Object.keys(this.formElements).forEach(function(fieldName){
        if (this._snapshot[fieldName] !== this.formElements[fieldName].value){
            tmp.push({
                fieldName:  fieldName,
                oldValue:   this._snapshot[fieldName],
                newValue:   this.formElements[fieldName].value
            });
        }
    }, this);
    return(tmp);
}




} // end noiceCoreUIFormView
