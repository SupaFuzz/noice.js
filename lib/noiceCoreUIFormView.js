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
static getFormElement(fieldType, fieldConfig, mergeConfig){

    let tmpConfig = JSON.parse(JSON.stringify(fieldConfig));
    if (mergeConfig instanceof Object){ Object.keys(mergeConfig).forEach(function(a){ tmpConfig[a] = mergeConfig[a]; }); }

    try {
        switch(fieldType){

            /*
                aliases for implemented noiceCoreUIFormElement subclasses
            */
            case   'char':
                // noiceCoreUIFormElementInput
                return(new noiceCoreUIFormElementInput(tmpConfig));
                break;
            case   'date':
                // noiceCoreUIFormElementDate
                return(new noiceCoreUIFormElementDate(tmpConfig));
                break;
            case   'int':
                // noiceCoreUIFormElementNumber
                // to-do: hack input validations onto noiceCoreUIFormElementNumber for each mode
                return(new noiceCoreUIFormElementNumber(tmpConfig));
                break;
            case   'real':
                // noiceCoreUIFormElementNumber (see above)
                return(new noiceCoreUIFormElementNumber(tmpConfig));
                break;
            case   'decimal':
                // noiceCoreUIFormElementNumber (see above)
                return(new noiceCoreUIFormElementNumber(tmpConfig));
                break;
            case   'dropdown':
                // noiceCoreUIFormElementSelect
                // to-do: hack on a 'dynamic' mode (like char menus in ars)
                return(new noiceCoreUIFormElementSelect(tmpConfig));
                break;
            case   'checkbox':
                // noiceCoreUIFormElementCheckbox
                return(new noiceCoreUIFormElementCheckbox(tmpConfig));
                break;
            case   'table':
                // noiceCoreUIFormElementTable
                return(new noiceCoreUIFormElementTable(tmpConfig));
                break;
            case    'text':
                // noiceCoreUIFormElementText
                return(new noiceCoreUIFormElementText(tmpConfig));
                break;
            case   'dateTime':
                // noiceCoreUIFormElementDateTime
                return(new noiceCoreUIFormElementDateTime(tmpConfig));
            break;
            case   'currency':
                // note this is a workaround
                // I should build a proper currency class. someday.
                // but not today
                return(new noiceCoreUIFormElementNumber(tmpConfig));
                break;
            case    'scannerInput':

                let t;
                t = new coreUIScannerInput(tmpConfig);
                return(t);

                //return(new coreUIScannerInput(tmpConfig));
                break;

            /*
                aliases for not-yet-implemented noiceCoreUIFormElement subclasses
            */


            case   'diary':
                // to-do
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'time':
                // to-do: (oh shit! I forgot this one! - required for dateTime composite element)
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
        _saveFilters:           [],
        _cancelButtonText:      'cancel',
        _cancelButton:          undefined,
        _formMode:              'locked',
        _changeFlag:            false,
        _snapshot:              {},
        _tempName:              'new record',
        saveButtonClass:        'ncfuFormViewSaveButton',
        cancelButtonClass:      'ncfuFormViewCancelButton',
        fieldReferenceClass:    'ncfuFormFieldReference',
        firstFocus:             true,
        deferRender:            true,
        validationErrors:       [],
        setValuesOnModeChange:  false,
        valuesSet:              false,
        extraFieldConfig:       {},
        debug:                  false
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

    // it's just a lot easier this way ...
    let that = this;
    that.fieldConfigByID = {};
    Object.keys(cfg.fields).forEach(function(fieldName){
        that.fieldConfigByID[cfg.fields[fieldName].id] = cfg.fields[fieldName];
    });

    // get formElements for everything so we can bind up with this.html in setup()
    Object.keys(that.fieldConfigByID).forEach(function(fieldID){
        if (! this.formElements.hasOwnProperty(fieldID)){

            // lesson learned. Object.assign preserves pointers. Ya rly. Juheeezuz, javascript. :-p
            //let tmp = Object.assign(that.fieldConfigByID[fieldID]);
            let tmp = JSON.parse(JSON.stringify(that.fieldConfigByID[fieldID]));

            // insert values from that.data if we have them
            if ((that.data instanceof Object) && that.data.hasOwnProperty(fieldID) && (that.setValuesOnModeChange !== true)){

                /*
                    12/2/20 @ 1574 -- the sneak is the problem
                    ok this is cool for sneaking a default value through
                    without triggering callbacks. that's tight.

                    if you want the callbacks to fire, set this.setValuesOnModeChange = true;
                */
                if (that.formElements[fieldID] instanceof coreUIScannerInput){ that.formElements[fieldID].setFromMenu = true; }
                tmp.value = that.data[fieldID];
                if (that.formElements[fieldID] instanceof coreUIScannerInput){ that.formElements[fieldID].setFromMenu = false; }
            }

            // insert menu values if we've got them too
            if ((that.menus instanceof Object) && (that.menus.hasOwnProperty(fieldID))){
                tmp.values = that.menus[fieldID];
            }

            this.formElements[fieldID] = noiceCoreUIFormView.getFormElement(tmp.type, tmp, that.extraFieldConfig);
            this.formElements[fieldID].valueChangeCallback = function(valNew, valOld){
                that.fieldValueChange(fieldID, valNew, valOld);
            };

            // set up a thing to handle focusin events

            if (that.focusManager instanceof Function){
                that.formElements[fieldID].focusInCallback = function(selfRef, evt){ that.focusManager(fieldID, selfRef, evt); }
            }

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

    fieldName is wrong! It's really fieldID. You might make a handy label -> id lookup
    table externally ...
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

    NOTE: 8/11/20 @ 0929
    this is the issue. the value is being set to the label (or something) rather than fieldId

    */
    let guid = this.getGUID();
    //this._fieldReferences[guid] = fieldName;
    this._fieldReferences[guid] = this.config.fields[fieldName]?this.config.fields[fieldName].id:fieldName;
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
    return(super.setFocus(focus));
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
    let that = this;
    (this.DOMElement.querySelectorAll(`.${this.fieldReferenceClass}`) || []).forEach(function(el){
        switch(this._fieldReferences[el.id]){
            case 'saveButton':
                // setup the save button
                this.saveButton = document.createElement('button');
                this.saveButton.className = this.saveButtonClass;
                this.saveButton.textContent = this.saveButtonText;
                this.saveButton.disabled = (! this.changeFlag);

                // insert callbacks here
                this.saveButton.addEventListener('click', function(e){ that.clickSaveButton(e); });

                // insert the save button
                el.append(this.saveButton);
            break;

            case 'cancelButton':
                // setup the cancel button
                this.cancelButton = document.createElement('button');
                //this.cancelButton.textContent = this.cancelButtonText;
                //this.cancelButton.className = this.cancelButtonClass;
                this.cancelButton.className = 'btnReset';

                // insert callbacks here
                this.cancelButton.addEventListener('click', function(e){ that.clickCancelButton(e); });

                // insert the save button
                el.append(this.cancelButton);
            break;

            case 'recordIdentifier':


                /*
                    this is a special widget that will either contain the value of '1'
                    or the tempName
                */
                this.recordIdentifier = el;
                if ((this.formMode == 'create') || this.isNull(this.formElements['1'].value)){
                    this.tempRecordIdentifier = document.createElement('span');
                    this.tempRecordIdentifier.className = 'newRecordLabel';
                    this.tempRecordIdentifier.textContent = this.tempName;
                    el.append(this.tempRecordIdentifier);
                }else{
                    this.formElements['1'].append(el);
                }
            break;

            default:
                this.formElements[this._fieldReferences[el.id]].append(el);
        }

    }, this);
    this.changeFlag = (this.formMode == 'create');
}



/*
    tempName getter and setter
    in situations where the record does not yet have an entryId (so submit and clone)
    this value will be displayed to the user.
*/
get tempName(){ return(this._tempName); }
set tempName(v){
    this._tempName = v;
    if (this.formMode == 'create'){
        if (this.tempRecordIdentifier instanceof Element){
            this.tempRecordIdentifier.textContent = this._tempName;
        }
    }
}




/*
    formMode stuff
    supported modes:
        * locked
        * create
        * modify
*/
get formMode(){ return(this._formMode); }
set formMode(m){
    let that = this;
    let oldFormMode = this._formMode;

    if (that.debug){ console.log(`set formMode(${m}) (previous: ${oldFormMode})`); }

    // handle the switchin'
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

            if ((this.changeFlag) && (oldFormMode == 'modify')){
                this.dirtyRecordAreYouSure().then(function(zTmpDialogResult){
                    if (zTmpDialogResult){
                        that.setFormModeProperties(m);
                        that._formMode = m;
                    }else{
                        // user clicked no -- so -- don't do anything
                    }
                });
            }else{
                that.setFormModeProperties(m);
                that._formMode = m;
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

            if ((this.changeFlag) && (this.formMode != 'submit')){
                let that = this;
                this.dirtyRecordAreYouSure().then(function(zTmpDialogResult){
                    if (zTmpDialogResult){
                        that.setFormModeProperties(m);
                        that._formMode = m;
                    }else{
                        // user clicked no -- so -- don't do anything
                    }
                });
            }else{
                that.setFormModeProperties(m);
                that._formMode = m;
            }

            break;
    }

    // execute formModeChangeCallback if we have it
    if (that.formModeChangeCallback instanceof Function){ that.formModeChangeCallback(that.formMode, oldFormMode); }

    // set values on modeChange if we've not already
    if ((that.data instanceof Object) && (that.setValuesOnModeChange) && (! that.valuesSet)){
        Object.keys(that.data).forEach(function(fieldID){
            // this should trigger callbacks, no?
            if (that.formElements[fieldID] instanceof noiceCoreUIFormElement){

                // "... in the gheeetooooo" - Elvis Presley
                if (that.formElements[fieldID] instanceof coreUIScannerInput){ that.formElements[fieldID].setFromMenu = true; }

                that.formElements[fieldID].value = that.data[fieldID];

                // "... one thing 'bout the ghetto, you don't have to worry" - Rick James
                if (that.formElements[fieldID] instanceof coreUIScannerInput){ that.formElements[fieldID].setFromMenu = false; }
            }

        });
        that.valuesSet = true;
        that.changeFlag = false;
    }
}


/*
    setFormModeProperties(mode)

    NOTE: if you set a 'value' attribute in the config mode-tree for a field
          this will be applied as a default value for the specified mode
*/
setFormModeProperties(mode){

    if (this.debug){ console.log(`setFormModeProperties(${mode})`); }

    Object.keys(this.fieldConfigByID).forEach(function(fieldID){
        if (this.fieldConfigByID[fieldID].modes.hasOwnProperty(mode)){
            Object.keys(this.fieldConfigByID[fieldID].modes[mode]).forEach(function(property){
                this.formElements[fieldID][property] = this.fieldConfigByID[fieldID].modes[mode][property];
            }, this);
        }
    }, this);

    /*
    Object.keys(this.formElements).forEach(function(fieldName){
        if (this.config.fields[fieldName].modes.hasOwnProperty(mode)){
            Object.keys(this.config.fields[fieldName].modes[mode]).forEach(function(property){
                this.formElements[fieldName][property] = this.config.fields[fieldName].modes[mode][property];
                if (property == 'value'){ console.log(`\t[${fieldName} (${property})]: ${this.config.fields[fieldName].modes[mode][property]}`)}
            }, this);
        }
    }, this);
    */
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
    this exists so that you can override it in your child classes if you want
    it's just a relay from the click event on the saveButton to the save() function

*/
async clickSaveButton(evt){
    let that = this;
    if (evt instanceof Event){ evt.target.disabled = true; }

    // see if it works first, then do it right
    this.setFocus(true);

    let saveOutput = await that.save().catch(function(error){

        throw(new noiceException({
            message:        `save() threw unexpectedly: ${error}`,
            messageNumber:   420,
            errorObject:    error,
            thrownBy:       `${that._className} | clickSaveButton | save()`
        }));
    }).then(function(){

        // may the it god's have mercy ....
        setTimeout(function(){ that.changeFlag = false; }, 1);
    });

    //if (evt instanceof Event){ evt.target.disabled = false; }

}




/*
    exitButton stuff
*/
get cancelButtonText(){ return(this._cancelButtonText); }
set cancelButtonText(v){
    this._cancelButtonText = v;
    if (this.cancelButton instanceof Element){ this.cancelButton.textContent = this.cancelButtonText; }
}
get cancelButton(){ return(this._cancelButton); }
set cancelButton(v){ this._cancelButton = v; }

/*
    clickExitButton(evt)
*/
clickCancelButton(evt){
    if ((this.hasAttribute('cancelCallback') && this.cancelCallback instanceof Function)){
        this.cancelCallback({
            // data to send to callback
        }).then(function(v){
            // reset change flag
            // update UI post-save
        }).catch(function(e){
            // hannle yo bidness ...
        });
    }


    /*
        this is again ... just a placeholder. Something to override
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
    dirtyRecordAreYouSure(<destructive>)
    if the changeFlag is set on an operation that may discard data such as
    loading a new record or changing modes, this function will be invoked,
    opening a modal dialog of the form: "Are You Sure?"

    if the <destructive> boolean is set true (default), these arguments are sent to noiceCoreUIYNDialog:
        message:        'This will discard unsaved changes. Touch 'discard' to continue or 'cancel' to return
        yesBtnText:     'cancel'
        noButtonText:   'discard'
    otherwise these arguments are used:
        message:        'There are unsaved changes. Touch 'cancel' to return to the record and save your changes, or 'continue' to exit',
        yesBtnText:     'cancel',
        noButtonText:   'continue'


    this returns a promise that resolves to a boolean (true = save it, false: discard or continue)
*/
dirtyRecordAreYouSure(boolArg){

    // I know there's gotta be a more clever way to do this ...
    let destructive = true;
    if (boolArg === false){ destructive = false; }

    let that = this;
    return(new Promise(function(toot,boot){

        let dialogArgs = {
            heading:        'Unsaved Changes',
            hideCallback:   function(self){ toot(self.zTmpDialogResult); }
        }

        if (destructive){
            dialogArgs.message          = `This will discard unsaved changes. Touch 'discard' to continue or 'cancel' to return`;
            dialogArgs.yesButtonTxt     = 'cancel';
            dialogArgs.noButtonTxt      = 'discard';
        }else{
            dialogArgs.message          = `There are unsaved changes. Touch 'cancel' to return to the record and save your changes, or 'continue' to exit`;
            dialogArgs.yesButtonTxt     = 'cancel';
            dialogArgs.noButtonTxt      = 'continue';
        }

        try {
            let prompt = new noiceCoreUIYNDialog(dialogArgs).show(that.DOMElement);
        }catch(e){
            boot(e);
        }
    }));
}




/*
    clearValidationErrors()
    clear validation status and remove any on-screen exception markers
    probably-definitely called at the top of validate()
*/
clearValidationErrors(){
    let that = this;
    that.validationErrors = [];
    Object.keys(that.formElements).forEach(function(fieldId){
        that.formElements[fieldId].clearValidationErrors();
    });
}




/*
    validate()
    execute validations and invoke validateRecordCallback().
    returns true if no errors, false it errors
    directly appends validation errors to the individual form Elements

    NOTE this is async now!
*/
validate(){
    let that = this;
    that.clearValidationErrors();

    return(new Promise(function(toot, boot){

        // execute per-field save/modify validations
        Object.keys(that.formElements).forEach(function(fieldId){

            // nullable validation
            if (
                (that.config.fields[fieldId].modes) &&
                (that.config.fields[fieldId].modes[that.formMode]) &&
                (! that.config.fields[fieldId].modes[that.formMode].nullable) &&
                that.isNull(that.formElements[fieldId].value)
            ){
                that.validationErrors.push({
                    type:           'field',
                    fieldLabel:     that.formElements[fieldId].label,
                    fieldID:        fieldId,
                    errorNumber:    2,
                    errorMessage:   'a value is required'
                });
                that.formElements[fieldId].addValidationError(that.validationErrors[(that.validationErrors.length -1)]);
            }
        }); // end looping over formElements

        // put everythiung else in the async validationCallback
        if (that.validationCallback instanceof Function){
            let validationCallbackCrash = false;
            that.validationCallback(that).catch(function(error){
                validationCallbackCrash = true;
                that.validationErrors.push({
                    type:           'system',
                    errorNumber:    420,
                    errorMessage:   `validationCallback threw unexpectedly: ${error}`,
                    errorObject:    error
                });
                boot(that.validationErrors[(that.validationErrors.length - 1)])
            }).then(function(callbackErrors){
                if (! validationCallbackCrash){
                    if ((callbackErrors instanceof Array) && (callbackErrors.length > 0)){
                        callbackErrors.forEach(function(b){ that.validationErrors.push(b); });
                    }
                }

                // back atcha
                if (that._rowHandle instanceof Object){ that._rowHandle.status = 'error'; }
                toot(that.validationErrors.length == 0);
            });
        }
    }));
}







/*
    saveFilters

    all of this happens when you click the save button but BEFORE
    we execute input validations. This is your chance to do logic and
    whatnot on the way to the validator ...

    saveFilters are executed in array order defined in 'saveFilters'
    these execute like filters in the traditional unix sense
    where data is piped to a series of scripts each receiving
    the prior's output.

    this.saveFilters = [
        {
            id:         <filterId>
            executor:   async function(selfReference, <arbitraryData>){
                return({
                    abort:  <bool>
                    pipeData: <arbitraryData>
                })
            }
        }
    ]

*/
get saveFilters(){ return(this._saveFilters); }
set saveFilters(v){
    let that = this;
    let throwMe = false;
    let throwPos = 0;
    if (v instanceof Array){
        v.forEach(function(filter, idx){
            if (! throwMe){
                throwMe = (!(
                    (filter instanceof Object) &&
                    (filter.hasOwnProperty('id') && (that.isNotNull(filter.id))) &&
                    (filter.hasOwnProperty('executor') && (filter.executor instanceof Function))
                ));
                if (throwMe){ throwPos = idx; }
            }
        })
    }else{
        throw(new noiceException({
            message:        `value is not an instance of Array`,
            thrownBy:       `${this._className} | saveFilters (setter)`,
            error:           e,
            messageNumber:   50,
        }));
    }
    if (throwMe){
        throw(new noiceException({
            message:        `invalid filter definition at position ${throwPos}`,
            thrownBy:       `${this._className} | saveFilters (setter)`,
            error:           e,
            messageNumber:   51,
        }));
    }else{
        this._saveFilters = v;
    }
}

executeSaveFilters(inputData){
    let that = this;
    let pipeData = (inputData instanceof Object)?inputData:{};
    return(new Promise(function(toot, boot){

        // this itterative function executes the filter code
        function executeFilter(idx){
            if (idx > (that.saveFilters.length -1)){
                toot();
            }else{
                that.saveFilters[idx].executor(that, pipeData).catch(function(error){
                    boot(new noiceException({
                        message:        `saveFilter at position ${idx} threw: ${error}`,
                        thrownBy:       `${that._className} | executeSaveFilters | [${idx}] ${that.saveFilters[idx].id}`,
                        error:           error,
                        messageNumber:   52,
                    }));
                }).then(function(filterOutput){

                    // abort, succeed, or recurse
                    if ((filterOutput instanceof Object) && (filterOutput.abort === true)){
                        boot(new noiceException({
                            message:        `saveFilter at position ${idx} aborted filter execution`,
                            thrownBy:       `${that._className} | executeSaveFilters | [${idx}] ${that.saveFilters[idx].id}`,
                            //error:           error,
                            messageNumber:   53,
                        }));
                    }else if (idx == (that.saveFilters.length -1)){
                        toot(filterOutput);
                    }else{
                        executeFilter(idx + 1);
                    }
                });
            }
        } // end executeFilter function

        // are you ready for some football?
        executeFilter(0);
    }));
}



/*
    save()

    execute pre-write filters if we've got 'em (auto field sets, like createDate, etc)
    then we invoke the recordSaveCallback() and return what it returns unless you know
    that's an error, then we boot.

    hence async writing to network or db or whatever should happen in the callback
*/
save(filterInputData){
    let that = this;
    let filterPipeData = (filterInputData instanceof Object)?filterInputData:{};
    let filterAbort = false;
    return(new Promise(function(toot, boot){

        // execute save filters
        that.executeSaveFilters(filterPipeData).catch(function(error){

            // abort from saveFilter error
            boot(new noiceException({
                message:        `saveFilter threw error preventing save: ${error.toString()}`,
                thrownBy:       `${that._className} | save`,
                error:           error,
                messageNumber:   54,
            }));
            filterAbort = true;
            alert('errors prevented record save');

        }).then(function(filterOutputData){

            // validate that sucka!
            if (! filterAbort){

                let validationCrash = false;
                that.validate().catch(function(error){
                    validationCrash = true;
                    boot(error);

                }).then(function(formOK){

                    if (formOK && (! validationCrash)){

                        // execute the callback if we've got one, else just toot the filter output
                        if (that.recordSaveCallback instanceof Function){
                            that.recordSaveCallback(that, filterOutputData).catch(function(error){

                                // recordSaveCallback threw
                                boot(new noiceException({
                                    message:        `recordSaveCallback threw error preventing save: ${error.toString()}`,
                                    thrownBy:       `${that._className} | save | recordSaveCallback()`,
                                    error:           error,
                                    messageNumber:   55,
                                }));

                            }).then(function(saveOutput){
                                toot(saveOutput);
                            });
                        }else{
                            toot(filterOutputData);
                        }
                    }else if (! formOK){
                        boot("validation error prevents save")
                    }
                })
            }else{
                // get an error string together
                /*
                that.validationErrors.push({
                    type:           'field',
                    fieldLabel:     that.formElements[fieldId].label,
                    fieldID:        fieldId,
                    errorNumber:    2,
                    errorMessage:   'a value is required'
                });
                that.formElements[fieldId].addValidationError(that.validationErrors[(that.validationErrors.length -1)]);
                */
                let errstrs = [];
                that.validationErrors.forEach(function(errObj){
                    errstrs.push(`${errObj.type} '${errObj.fieldLabel}' [${errObj.fieldId}] | errorNumber: ${errObj.erroNumber}: ${errObj.errorMessage}'`);
                });

                boot(new noiceException({
                    message:        `validation errors prevent save: ${errstrs.join(', ')}`,
                    thrownBy:       `${that._className} | save`,
                    error:           that.validationErrors,
                    messageNumber:   55,
                }));
            }

        });

    }));
}






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
            this.formElements[fieldName].resetOldValue();
        }, this);
    }

    // toggle the save button if we've got one
    if (this.saveButton instanceof Element){
        this.saveButton.disabled = (! this.changeFlag);
    }
}
get changeFlag(){ return(this._changeFlag); }

/*
    fieldValueChange(fieldName, valNew, valOld)

    each time a formElement changes value, this function is
    called with the above arguments.
*/
fieldValueChange(fieldName, valNew, valOld){
    let that = this;

    // remove before flight
    //console.log(`[fieldValueChange (${fieldName})] [snap]: ${this._snapshot[fieldName]} [new]: ${valNew} [old] ${valOld} [bool] ${(this.isNull(valNew) && this.isNull(this._snapshot[fieldName]))}`);

    // if we have a fieldValueChangeCallback call it
    // if it throws, the change is cancelled

    if ((that.hasOwnProperty('fieldValueChangeCallback') && (that.fieldValueChangeCallback instanceof Function))){
        try {
            that.fieldValueChangeCallback({
                fieldID:    that.formElements[fieldName].id,
                newValue:   valNew,
                oldValue:   valOld
            });
        }catch(e){
            throw(new noiceException({
                message:        `fieldValueChange() fieldValueChangeCallback threw, cancelling change${e.toString()}`,
                thrownBy:       `fieldValueChange() fieldValueChangeCallback`,
                error:           e,
                messageNumber:   421,
            }));
        }
    }

    /*
        changeFlag logic is as follows

        if the thing you're setting is different than the thing in the snapshot
        we are obviously going to set the changeFlag

        if the change flag is currently set and the thing you are setting is the
        same as the thing in the snapshot, we're going to check all the other fields
        against the snapshot -- if no differences are found, we'll reset the changeFlag

        this is the price of using the setter to get the snapshot, really ... worth it I think.
    */
    if (! (
        (valNew == this._snapshot[fieldName]) ||
        (this.isNull(valNew) && this.isNull(this._snapshot[fieldName]))
    )){
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

        // I suspect this is not right
        //if ((this._snapshot[fieldName] !== this.formElements[fieldName].value) && this.isNotNull(this._snapshot[fieldName]) && this.isNotNull(this.formElements[fieldName].value)){
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




/*
    getCloneView()
    get a noiceCoreUIFormCloneView (or descendant) object
    representing a (one of possibly many) clone views for this record
    override this to point it at your own custom cloneView in a child class, yo!
*/
getCloneView(){
    let that = this;
    return(new noiceCoreUIFormCloneView({
        cloneMaster:    this,
        debug:          true
    }));
}








} // end noiceCoreUIFormView
