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
    -Amy 5/6/2020 @ 1655
*/
static getFormElement(fieldType, fieldConfig){
    try {
        switch(fieldType){
            case   'char':
                // noiceCoreUIFormElementInput
                return(new noiceCoreUIFormElement(fieldConfig));
                break;
            case   'diary':
                // to-do
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'dateTime':
                // to-do: (oh shit! I forgot this one!)
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'date':
                // noiceCoreUIFormElementDate
                return(new noiceCoreUIFormElementDate(fieldConfig));
                break;
            case   'time':
                // to-do: (oh shit! I forgot this one! - required for dateTime composite element)
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'currency':
                // to-do: (oh shit! I forgot this is needed day one!)
                throw(`${fieldType} is not yet implemented`);
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
            case   'radio':
                // to-do
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'checkbox':
                // noiceCoreUIFormElementCheckbox
                return(new noiceCoreUIFormElementCheckbox(fieldConfig));
                break;
            case   'button':
                // to-do: (sigh ... yeah it's probably better modeled as a formElement)
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'table':
                // noiceCoreUIFormElementTable
                return(new noiceCoreUIFormElementTable(fieldConfig));
                break;
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

    LOH 5/5/2020 @ 2320
    sketched out all of the function headers and coded
    some smakker ones for clarity of intent.

    tomorrow we start fillin' in the blanks

        * local vars
          _config       = {}
          _formElements = {}
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'noiceCoreUIFormView',
        _config:                {},
        _formElements:          {},

    },defaults),callback);




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

    /* if we ever do form properties, handle that here */

    // bounce if we don't have fields ...
    if (! (cfg.hasOwnProperty('fields') && (cfg.fields instanceof Object))){
        throw(new noiceException({
            message:        `${this._className}/config setter: specified config does not contain fields`,
            messageNumber:   421,
            thrownBy:       `${this._className}/config setter`
        }));
    }

    // get formElements for everything so we can bind up with this.html in setup()
    Object.keys(cfg.fields).forEach(function(fieldName){
        if (! this.formElements.hasOwnProperty(fieldName)){
            this.formElements[fieldName] = noiceCoreUIFormView.getFormElement(cfg.fields[fieldName].type, cfg.fields[fieldName]);
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
    get html()
    this one is a bit more elaborate. This is where you
    "design your form" so to speak. You can build any crazy
    html you want here. To insert a formElement field in your
    design, substitute ${this.fieldReference('<fieldName>')}

    special references
        * this.fieldReference('saveButton') is a reference to the save button

            LOH 5/6/2020 @ 1738
            break for diner. noted above, we dont' yet have a formElementButton class
            we probably ought to, and we might want to take a pointer from ARS here and
            just have some sort of special hook like a special field id for the save button.
            yeah I dunno that's all so hacky. fuck dat.

            yeah we'll use the special saveButton field reference, though at the end of
            the day it'll be a formElementButton object that isn't in the config data ...

            time to do some cookin'
            and unfortunately move the office indoors.
            it's cold AF out here! 
*/



/*
    async setFocus(<bool>)
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
                thrownBy:       `${that._className}/setFocus/firstFocus setup()`,
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
    but only once. We call pareseConfig here to make sure all the formElements
    are rendered into the template in this.html, etc.
*/



/*
    gainFocus()
    is run each time the UI enters the focussed state
*/



/*
    leaveFocus()
    is fun each time the UI leaves the focussed state
*/



/*
    loadRecord(data)
    discard any data currently in the UI and load the given
    data into the UI as a newly loaded record. This resets the
    change flag and invokes recordLoadedCallback().
    if the changeFlag is set, invokes dirtyRecordAreYouSure()
*/



/*
    resetUI(mode)
    resets the UI to a default state for the specified mode with no record
    loaded into the form mode is 'create' or 'modify'.
    if the changeFlag is set, invokes dirtyRecordAreYouSure()
*/


/*
    dirtyRecordAreYouSure()
    if the changeFlag is set on an operation that may discard data such as
    loading a new record or changing modes, this function will be invoked,
    opening a modal dialog of the form: "Are You Sure?"
*/


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
    changeFlag
*/
get changeFlag(){ return((this.changedFields.length > 0)); }


/*
    changedFields
*/
get changedFields(){
    /*
        build an array of objects of the form: {
            fieldName:*,
            oldValue:*,
            newValue:*,
            modified: <dateTimeHiRes>
        }
        and return it
    */
}


} // end noiceCoreUIFormView
