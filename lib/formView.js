/*
    formView.js
    this is a reworking of noiceCoreUIFormView.js and will likely
    replace it when I'm done here

    messageNumbers:
        1   bad config object
        2   unknown field type
        3   failed to instantiate formElement
        4   no fields in config
        5   duplicate fields in config
        6   form mode change prevented

    config = {
        fields:  { <fieldName>: {<fieldConfig>} ...},
        menus:   { <fieldName>: [menuValesObject] }
        filters: []
    }

    html template stuff
    use templatename[str] and templateattribute[bool]
    set templatename = fieldName from the config
    the mode setter should handle the rest
*/
class formView extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:               1,
            _className:             'formView',
            _burgerMenu:            null,
            _formElements:          {},
            _config:                null,
            _formMode:              null,
            _viewNeedsFormModeSync: false,
            debug:                  false,
            deferRender:            true,
            rowTitle:               '',
            saveButtonText:         'save',
            cancelButtonText:       'close'
        }, defaults),
        callback
    );

    // we need to defer the render until after the config is set, that's why ;-)
    super.render();

} // end constructor




/*
    html
    this is a super-dumb renderer by displaySection (alpha) / displayOrder
    with a save button and a close button
*/
get html(){
    let that = this;

    // sort out sections and field order
    let fieldListHTML = [];
    let sections = {};
    Object.keys(that._formElements).forEach(function(fieldName){
        let sectionName = (that._formElements[fieldName].hasOwnProperty('displaySection'))?that._formElements[fieldName].displaySection:'none';
        if (!(sections.hasOwnProperty(sectionName))){ sections[sectionName] = []; }
        that._formElements[fieldName].name = fieldName;
        sections[sectionName].push(that._formElements[fieldName])
    });
    Object.keys(sections).sort().forEach(function(sectionName){
        fieldListHTML.push(`<fieldset><legend>${sectionName}</legend>`);
        sections[sectionName].sort(function(a,b){ return(a.displayOrder - b.displayOrder); }).forEach(function(formElement){
            fieldListHTML.push(`<div class="formField" data-templatename="${formElement.name}" data-templateattribute="true"></div>`);
        });
        fieldListHTML.push(`</fieldset>`);
    })

    // insert shenanigans here
    return(`
        <div class="formHeader" data-templatename="formHeader">
            <h1 class="rowTitle" data-templatename="rowTitle">${this.rowTitle}</h1>
            <div class="btnContainer">
                <button class="btnCancel" data-templatename="btnCancel">${this.cancelButtonText}</button>
                <button class="btnSave" data-templatename="btnSave">${this.saveButtonText}</button>
            </div>
        </div>
        <div class="formFields" data-templatename="formFields">
            ${fieldListHTML.join("\n")}
        </div>
    `);

}




/*
    setupCallback()
*/
setupCallback(){
    let that = this;
    that._app.log(`${that._className} | setupCallback`);

    // init the formView
    if (that._viewNeedsFormModeSync){ that.setFormMode(that.formMode); }
}




/*
    onScreenCallback()
*/
onScreenCallback(){
    let that = this;
    that._app.log(`${that._className} | onScreenCallback`);

}




/*
    firstFocusCallback(focusArgs)
*/
firstFocusCallback(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){
        that._app.log(`${that._className} | firstFocusCallback`);
        toot(true);
    }));
}




/*
    gainFocus(focusArgs)
*/
gainFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){
        that._app.log(`${that._className} | gainFocus`);
        toot(true);
    }));
}




/*
    loseFocus(focusArgs)
    -- this'll be where the are you sure dialog fires
*/
loseFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){
        that._app.log(`${that._className} | loseFocus`);
        toot(true);
    }));
}




/*
    rowHandle getter
*/
get rowHandle(){
    // insert shenanigans here
    return(`<h3>this is my handle!</h3>`);
}




/*
    formMode stuff
*/
get formMode(){ return(this._formMode); }
set formMode(v){
    if (this.hasConfig){
        var modeChangeAbort = false;
        this.setFormMode(v).catch(function(error){
            modeChangeAbort = true;
            throw(new noiceException({
                message:        `${this._className}/formMode setter: form mode change prevented setting ${v} from ${this._formMode} | ${e}`,
                messageNumber:   6,
                thrownBy:       `${this._className}/formMode setter`
            }));
        }).then(function(){
            if(! modeChangeAbort){
                this._formMode = v;
            }
        });
    }else{
        this._viewNeedsFormModeSync = true;
        this._formMode = v;
    }
}
setFormMode(formMode){

    let that = this;
    return(new Promise(function(toot, boot){

        // helper function to set field mode properties
        function setModeFieldProperties(){

            Object.keys(that._formElements).forEach(function(fieldName){
                if (
                    that._formElements[fieldName].hasOwnProperty('modes') &&
                    (that._formElements[fieldName].modes instanceof Object) &&
                    that._formElements[fieldName].modes.hasOwnProperty(formMode)
                ){
                    Object.keys(that._formElements[fieldName].modes[formMode]).forEach(function(modeProperty){
                        that._formElements[fieldName][modeProperty] = that._formElements[fieldName].modes[formMode][modeProperty];
                    });
                }
            });
            that._viewNeedsFormModeSync = false;
        }

        // main logic: set field properties after the callback if we have one
        if (
            (that.isNotNull(formMode)) && (
                (that.formMode != formMode) ||
                (that._viewNeedsFormModeSync == true)
            )
        ){
            // if we've got the formModeChangeCallback do that
            if (that.formModeChangeCallback instanceof Function){
                let modeChangeAbort = false;
                that.formModeChangeCallback(formMode).catch(function(error){
                    modeChangeAbort = true;
                    that._app.log(`${that._className} | setFormMode(${formMode}) | formModeChangeCallback cancelled mode change: ${error}`);
                    boot(error);
                }).then(function(){
                    if (! modeChangeAbort){
                        setModeFieldProperties();
                        toot(true);
                    }
                })
            }else{
                setModeFieldProperties();
                toot(true);
            }
        }else{
            // if we're not changing from the existing mode, bounce
            toot(true);
        }
    }));
}




/*
    config stuff
*/
get hasConfig(){ return(this.isNotNull(this._config)); }
get config(){ return(this._config); }
set config(cfg){

    let that = this;

    // bounce if the given config ain't an object at least
    if (! (cfg instanceof Object)){
        throw(new noiceException({
            message:        `${that._className}/config setter: specified config is not an Object`,
            messageNumber:   1,
            thrownBy:       `${that._className}/config setter`
        }));
    }

    // bounce if we don't have fields ...
    if (! (cfg.hasOwnProperty('fields') && (cfg.fields instanceof Object))){
        throw(new noiceException({
            message:        `${this._className}/config setter: specified config does not contain fields`,
            messageNumber:   4,
            thrownBy:       `${this._className}/config setter`
        }));
    }

    // get formElements for everything in the config
    let parseError = false;
    Object.keys(cfg.fields).forEach(function(fieldName){
        if ((! parseError) && (that._formElements.hasOwnProperty(fieldName))){
            parseError = true;
            throw(new noiceException({
                message:        `${this._className}/config setter: specified config defines fieldName: ${fieldName} more than once`,
                messageNumber:   5,
                thrownBy:       `${this._className}/config setter`
            }));
        }
        if (! parseError){
            let extraConfig = {};

            // inject menu if we have one
            if ((cfg.menus instanceof Object) && (cfg.menus.hasOwnProperty(fieldName))){
                extraConfig.values = cfg.menus[fieldName];
            }

            // make it
            that._formElements[fieldName] = formView.getFormElement(
                cfg.fields[fieldName].type,
                cfg.fields[fieldName],
                extraConfig
            );

            // hackalicious, baybie bay bay
            that[fieldName] = that._formElements[fieldName];
        }
    });

    // swap it out
    this._config = cfg;

}




/*
    getFormElement(fieldType, fieldConfig, mergeConfig)
    static function for getting form elements from config data
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
                    messageNumber:   2,
                    thrownBy:       `[static] noiceCoreUIFormView.getFormElement()`
                }));
        }
    }catch(e){
        throw(new noiceException({
            message:        `[static] noiceCoreUIFormView.getFormElement() - failed to instantiate ${fieldType}/${fieldConfig.name}: ${e.toString()}`,
            messageNumber:   3,
            thrownBy:       `[static] noiceCoreUIFormView.getFormElement()`
        }));
    }
}


// just a test
formModeChangeCallback(formMode){
    let that = this;
    return(new Promise(function(toot, boot){
        that._app.log(`formModeChangeCallback(${formMode}) | called`);
        toot(true);
        //boot(false);
    }));
}

/*
    LOH 9/9/21 @ 2226

    next:
        * valueChangeCallback()
        * changeFlag
        * changedFields
        * set non-default values on instantiate
        * saveCallback
        * handle getter
        * handle removeCallback
        * close/cancel button

*/


} // end formView class
