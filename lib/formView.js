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
        7   value on data setter is not object
        8   setting value for field (set data) failed

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
            _viewNeedsDataSync:     false,
            _dataQueue:             {},
            _data:                  {},
            _changeFlag:            false,
            _snapshot:              {},
            debug:                  false,
            deferRender:            true,
            rowTitle:               '',
            saveButtonText:         'save',
            cancelButtonText:       'close',
            disableValueChange:     false
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

    // complications from deferRender ... set the viewMode and data AFTER the config is set (if we have 'em)
    if (that._viewNeedsFormModeSync){
        let formModeAbort = false;
        that.setFormMode(that.formMode).catch(function(error){
            formModeAbort = true;
            that._app.log(`${that._className} | setupCallback | viewNeeedFormModeSync | form mode change failed: ${error}`);
        }).then(function(){
            // handle queued data setiing if we have it
            if (that._viewNeedsDataSync){ that.data = that._dataQueue; }
        });
    }else if (that._viewNeedsDataSync){
        that.data = that._dataQueue;
    }
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
    formModeChangeCallback()
    override this in your subclasses, to do things like checking the change flag,
    or other logic. For here, it's just a passthrough to illustrate that it exists.
    note, if you boot this promise, the form will still display with no mode set.
*/
formModeChangeCallback(formMode){
    let that = this;
    return(new Promise(function(toot, boot){
        if (that.debug){ that._app.log(`formModeChangeCallback(${formMode}) | called`); }
        toot(true);
        //boot(false);
    }));
}




/*
    fieldValueChangeCallback(fieldName, newValue, oldValue, formElement)
    this fires for every value change on every formElement, before changeFlag
    is managed etc. The value you resolve from the promise is what's set on the field
    if your promise rejects, the value is not set

    inserteth thine "active link" type hooks here
*/
fieldValueChangeCallback(fieldName, newValue, oldValue, formElement){
    let that = this;
    return(new Promise(function(toot, boot){
        that._app.log(`${that._className} | fieldValueChangeCallback(${fieldName}, ${newValue}, ${oldValue})`);

        // insert thine shenanigans here

        toot(newValue);
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
    --- commonly overridden functions above, class infrastructure below
*/




/*
    formMode stuff
*/
get formMode(){ return(this._formMode); }
set formMode(v){
    let that = this;
    if (that.hasConfig){
        var modeChangeAbort = false;
        that.setFormMode(v).catch(function(error){
            modeChangeAbort = true;
            throw(new noiceException({
                message:        `${that._className}/formMode setter: form mode change prevented setting ${v} from ${that._formMode} | ${e}`,
                messageNumber:   6,
                thrownBy:       `${that._className}/formMode setter`
            }));
        }).then(function(){
            if(! modeChangeAbort){
                that._formMode = v;
            }
        });
    }else{
        that._viewNeedsFormModeSync = true;
        that._formMode = v;
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
            that.changeFlag = false;
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
            that._formElements[fieldName].valueChangeCallback = function(newVal, oldVal, formElement){
                return(that.fieldValueChange(fieldName, newVal, oldVal, formElement));
            }

            // hackalicious, baybie bay bay
            that[fieldName] = that._formElements[fieldName];
        }
    });

    // swap it out
    this._config = cfg;

}




/*
    change flag stuff
*/




/*
    fieldValueChange(fieldID, newValue, oldValue, formElement)
    this.disableValueChange = true, bypasses fieldValueChangeCallback() and changeFlag
    logic, passing newValue through (see also set data() ... )
*/
fieldValueChange(fieldName, newValue, oldValue, formElement){

    let that = this;
    let metaAbort = false;
    return(new Promise(function(toot, boot){
        new Promise(function(t, b){

            if (that.disableValueChange == true){
                metaAbort = true;
                t(newValue);
            }else{
                // handle fieldValueChangeCallback() should we have one
                if (that.fieldValueChangeCallback instanceof Function){
                    let callbackAbort = false;
                    that.fieldValueChangeCallback(fieldName, newValue, oldValue, formElement).catch(function(error){
                        callbackAbort = true;
                        b(`fieldValueChangeCallback cancelled value change: ${error}`);
                    }).then(function(value){
                        if (! callbackAbort){ t(value); }
                    });
                }else{
                    t(newValue);
                }
            }
        }).catch(function(error){
            metaAbort = true;
            if (that.debug){ that._app.log(`fieldValueChange(${fieldName}, ${newValue}, ${oldValue}, ${formElement}) cancelled value change: ${error}`); }
            boot(error);

        }).then(function(value){
            if (! metaAbort){
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
                    (value == that._snapshot[fieldName]) ||
                    (that.isNull(value) && that.isNull(that._snapshot[fieldName]))
                )){
                    that.changeFlag = true;
                }else{
                    if (that.changeFlag){
                        // check all the other fields for changes and reset changeFlag if needed

                        let cf = that.changedFields;
                        if (value == that._snapshot[fieldName]){ delete(cf[fieldName]); }
                        if (cf.length == 0){ that.changeFlag = false; }
                    }
                }
                toot(value);
            }else if (that.disableValueChange == true){
                toot(value);
            }
        })
    }))
}
get changeFlag(){ return(this._changeFlag); }
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
        Object.keys(this._formElements).forEach(function(fieldName){
            this._snapshot[fieldName] = this._formElements[fieldName].value;
            this._formElements[fieldName].resetOldValue();
        }, this);
    }

    // toggle the save button if we've got one
    if (this._DOMElements.btnSave instanceof Element){
        this._DOMElements.btnSave.disabled = (! this.changeFlag);
    }

    // set dirty flag on DOMElement
    if (this.DOMElement instanceof Element){
        this.DOMElement.dataset.dirty = (this.changeFlag)?'true':'false';
    }else{
        this._viewNeedsFormModeSync = true;
    }
}
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
    Object.keys(this._formElements).forEach(function(fieldName){
        if (
            (this._snapshot[fieldName] !== this._formElements[fieldName].value) && (! (
                this.isNull(this._snapshot[fieldName]) &&
                this.isNull(this._formElements[fieldName].value)
            ))){
            tmp.push({
                fieldName:  fieldName,
                oldValue:   this._snapshot[fieldName],
                newValue:   this._formElements[fieldName].value
            });
        }
    }, this);
    return(tmp);
}




/*
    data setter / getter
    this returns the curent *.value for every formElement
    alternatively, this will set *.value for every formElement
    matching a fieldName in the input object. This will fire the
    fieldValueChange() for each field as it is set UNLESS
    this.disableValueChange is set true
*/
get data(){
    let v = {};
    Object.keys(this._formElements).forEach(function(fieldName){ v[fieldName] = this._formElements[fieldName].value; }, this);
    return(v);
}
set data(v){
    if (this.hasConfig){
        this.setData(v).catch(function(error){
            throw(error);
        });
    }else{
        this._viewNeedsDataSync = true;
        this._dataQueue = v;
    }
}
/*
    setData(dataObject, disableCallbacks)
    this is set data (above), but we return the promise so your
    external logic can catch failures. disableCallbacks is a bool
    if set true, we will set this.disableValueChange before blasting
    values into the fields, then reset it to it's previous value
    before exiting the function
*/
setData(dataObject, disableCallbacks){
    let that = this;
    let disable = (disableCallbacks == true);
    let previousDisableValueChange = that.disableValueChange;

    return(new Promise(function(toot, boot){

        // dataObject must be an object
        if (! (dataObject instanceof Object)){
            boot(new noiceException({
                message:        `${that._className}/setData value is not instance of Object`,
                messageNumber:   7,
                thrownBy:       `${that._className}/setData`
            }));
        }else{

            let pk = [];
            if (disable){ that.disableValueChange = true; }
            let errors = [];
            Object.keys(dataObject).forEach(function(fieldName){
                if (that._formElements.hasOwnProperty(fieldName)){
                    pk.push(new Promise(function(t, b){
                        let fail = false;
                        that._formElements[fieldName].setValue(dataObject[fieldName]).catch(function(error){
                            fail = true;
                            errors.push(`fieldName: ${fieldName}, error: ${error}`);
                            b(false);
                        }).then(function(){
                            if (! fail){ t(true); }
                        })
                    }));
                }
            });
            let bigCatch = false;
            Promise.all(pk).catch(function(error){
                bigCatch = true;
                boot(new noiceException({
                    message:        `${that._className}/setData: set value failed for fields: ${errors.join(" | ")} `,
                    messageNumber:   8,
                    thrownBy:       `${that._className}/setData`
                }));
            }).then(function(){
                if (disable){ that.disableValueChange = previousDisableValueChange; }
                if (that._viewNeedsDataSync){ that._viewNeedsDataSync = false; that._dataQueue = {}; }
                if (! bigCatch){ toot(true); }
            });
        }
    }));
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




/*
    LOH 9/11/21 @ 1325

    next:
        * saveCallback
        * handle getter
        * handle removeCallback
        * close/cancel button
        * cloneView getter
*/


} // end formView class
