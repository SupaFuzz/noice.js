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
        9   filter threw errror preventing save
        10  filter exited preventing save (soft error)
        11  saveCallback cancelled save

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
            _handles:               [],
            _handle:                null,
            __rowStatus:            'new',
            _cloneable:             false,
            _cloneableOnSave:       true,
            _cloneView:             null,
            _formValues:            {},
            debug:                  false,
            deferRender:            true,
            rowTitle:               '',
            saveButtonText:         'save',
            cancelButtonText:       'close',
            disableValueChange:     false,
            classList:              ['formView']
        }, defaults),
        callback
    );

    // we need to defer the render until after the config is set, that's why ;-)
    super.render();

} // end constructor




/*
    html
    basic, works in modify and create mode
    this class dfault, is a super-dumb renderer by displaySection (alpha) / displayOrder
    with a save button and a close button
    you may wish to override in you subclasses. such jazzhands
*/
get html(){
    let that = this;
    if (that.getHTMLCallback instanceof Function){
        return(that.getHTMLCallback());
    }else{
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
        });

        // insert shenanigans here
        return(`
            <div class="formHeader" data-templatename="formHeader">
                <h1 class="rowTitle" data-templatename="rowTitle" data-templateattribute="true">${this.rowTitle}</h1>
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
}




/*
    cloneViewHTML getter
    a basic clone view. override for jazzhands
*/
get cloneViewHTML(){
    let that = this;

    /*
        LOH 9/17/21 @ 1849
        ok everything up to here works.
        So next step is to render a default clone view with a
        field menu, remove callbacks, yadda yadda
    */

    // get back to this
    return('<h3>cloneView goes here</h3>');
}




/*
    setupCallback()
    if you want to override this, it's highly recommended to call super.setupCallback()
    at the top, as we're handling lots of infrastructure in here actually, you're really
    better off to override firstFocusCallback instead

    NOTE: this fires BEFORE render but AFTER instantiation attribute sets
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
    renderCallback
    this gets called after the html template acessors have been setup etc
    hangeth thine hooks here
    and call super.renderCallback() at the top if you wanna override it
*/
renderCallback(){
    let that = this;

    // if we've got a save button, hook it to the save() function
    if (that._DOMElements.hasOwnProperty('btnSave')){
        that._DOMElements.btnSave.addEventListener('click', function(evt){
            that._DOMElements.btnSave.disabled = true;
            let saveAbort = false;
            that.save().catch(function(error){
                saveAbort = true;
                if (that.debug){ that._app.log(`save aborted: ${error}`); }
            }).then(function(){
                that._DOMElements.btnSave.disabled = false;
            })
        });
    }

    // if we've got the cancel button, hook it up to the close() function
    if (that._DOMElements.hasOwnProperty('btnCancel')){
        that._DOMElements.btnCancel.addEventListener('click', function(evt){
            that._DOMElements.btnCancel.disabled = true;
            that._pendingExit = true;
            let closeAbort = false;
            that.close().catch(function(error){
                closeAbort = true;
                if (that.debug){ that._app.log(`close aborted: ${error}`); }
            }).then(function(){
                that._DOMElements.btnCancel.disabled = false;
            })
        });
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
        if (that.debug){ that._app.log(`${that._className} | formModeChangeCallback(${formMode}) | called`); }
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
    saveCallback(formViewReference)
    override this, and do asynchronous things like talkin' to a server
    or writing the indexedDB and whatnot. If you boot, it won't reset
    the changeFlag. If you toot, it will
*/
saveCallback(formViewReference){
    let that = this;
    return(new Promise(function(toot, boot){

        that._app.log(`${that._className} | saveCallback() | stub (override me sucka!) | here's my fields: `);
        console.log(that.changedFields);

        toot(true);
    }));
}




/*
    cloneCallback(formViewReference)
    this.cloneView is going to see this as it's save callback
    you're getting passed a the cloneView instance on formViewReference
    override as usual, etc.

    note: you'll end up copying this.data into yet another clone view
    with the parent's saveCallback etc and pushing it to a new rowHandle, etc
*/
cloneCallback(formViewReference){
    let that = this;
    return(new Promise(function(toot, boot){

        that._app.log(`${that._className} | cloneCallback() | stub (override me sucka!) | here's fields for the new one!: `);
        console.log(formViewReference.data);

        toot(true);
    }));
}




/*
    loseFocusCallback(formViewReference, focusArgs)
    see notes on loseFocus() below
*/
loseFocusCallback(formViewReference, focusArgs){
    let that = this;
    return(new Promise(function(toot, boot){

        // placeholder, override this if you wanna do thangs in here-uh
        if (that.debug){ that._app.log(`${that._className} | loseFocusCallback()`); }
        toot(true);

    }));
}




/*
    closeCallback(formViewReference)
    this fires when close() is called, before the
    changeFlag check, uiHolder removal and handle removal
    toot() if you wanna let it happen
    boot() if you don't
*/
closeCallback(formViewReference){
    let that = this;
    return(new Promise(function(toot, boot){

        // placeholder, override this if you wanna do thangs in here-uh
        if (that.debug){ that._app.log(`${that._className} | closeCallback()`); }
        toot(true);

    }));
}




/*
    cloneableCallback(formViewReference, newBoolValue)
    this fires when the value of the .cloneable attribute is changed
    this mechanism exists primarily as a means to manage the state of
    btnClone in recordEditorUILayout. It doesn't *need* to be async
    but it is for consistency. Like all the other callbacks:
    toot() if you wanna let it happen
    boot() if you don't
*/
cloneableCallback(formViewReference, newBoolValue){
    let that = this;
    return(new Promise(function(toot, boot){

        // placeholder, override this if you wanna do thangs in here-uh
        if (that.debug){ that._app.log(`${that._className} | cloneableCallback()`); }
        toot(true);

    }));
}




/*
    removeFieldCallback(fieldName, formElement)
    this fires whenever the user clicks btnRemove on a formElement
    this is primarily useful in formMode: 'clone'

    in fact as I flesh out the clone mode stuff, I fully 'spect
    that there will be a removeField() function in the guts
    that will call this rather than the formElement's own
    removeCallback, so we can keep a field menu accurate etc.

    as ever: toot it if you're ok with it, boot it to prevent
*/
removeFieldCallback(fieldName, formElement){
    let that = this;
    return(new Promise(function(toot, boot){

        // placeholder, override this if you wanna do thangs in here-uh
        if (that.debug){ that._app.log(`${that._className} | removeFieldCallback(${fieldName})`); }
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
    handleTemplate
    this is like get html for a handle
    data-templatename ... set it to match the fieldName
    you want it to get values from
    definitely override this
*/
get handleTemplate(){
    return(`
        <div class="rowHandle" data-templatename="_handleMain" data-guid="${this.getGUID()}" data-status="unidentified">
            <div class="handle">
                <h3 style="margin: .5em;">${this._className}</h3>
            </div>
        </div>
    `);
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

            // attach valueChangeCallback
            that._formElements[fieldName].valueChangeCallback = function(newVal, oldVal, formElement){
                return(that.fieldValueChange(fieldName, newVal, oldVal, formElement));
            }

            // attach removeFieldCallback
            that._formElements[fieldName].removeCallback = function(newVal, oldVal, formElement){
                return(that.removeFieldCallback(fieldName, formElement));
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
                that.updateHandles();
            }else if (that.disableValueChange == true){
                toot(value);
                that.updateHandles();
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
    this.updateHandles();
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
    clearValidationErrors()
    clear validation status and remove any on-screen exception markers
    probably-definitely called at the top of validate()
*/
clearValidationErrors(){
    Object.keys(this._formElements).forEach(function(fieldName){
        this._formElements[fieldName].clearValidationErrors();
    }, this);
}




/*
    validate()
    execute all of the validation filters in order.
    toot if we're all good, boot if we ain't
*/
validate(){
    this.clearValidationErrors();
    return(this.executeFilters('validate'));
}




/*
    save(filterInputData)
        * execute filters if we have them
        * execute validate(), if that passes
        * call the saveCallback() if we have one
        * if all of that resolves without errors, reset the changeFlag false
    {filterInputData} is an object reference to pass into the first filter in the chain
*/
save(filterInputData){
    let that = this;
    return(new Promise(function(toot, boot){

        // execute filters if we got um
        let filterAbort = false;
        that.executeFilters('save', filterInputData).catch(function(error){
            filterAbort = true;
            boot(error);
        }).then(function(filterOutputData){
            if (! filterAbort){

                let validateAbort = false;
                that.validate().catch(function(error){
                    validateAbort = true;
                    boot(error);
                }).then(function(){
                    if (! validateAbort){
                        if (that.saveCallback instanceof Function){
                            let saveAbort = false;
                            that.saveCallback(that).catch(function(error){
                                saveAbort = true;
                                boot(new noiceException({
                                    message:        `saveCallback cancelled save operation: ${error}`,
                                    thrownBy:       `${that._className} | save() -> saveCallback()`,
                                    messageNumber:   11,
                                }));
                            }).then(function(){
                                if (! saveAbort){
                                    that.changeFlag = false;
                                    if (that._cloneableOnSave){ that.cloneable = true; }
                                    if (that.formMode = 'create'){ that.formMode = 'modify'; }
                                }
                            })
                        }
                    }
                });
            }
        })
    }));
}




/*
    executeFilters(executeOn, inputData)
    execute filters for the specified executeOn in order passing the input data
*/
executeFilters(executeOn, inputData){
    let that = this;
    let pipeData = (inputData instanceof Object)?inputData:{};
    let filters = (that.config.filters instanceof Object)?that.config.filters:{};
    return(new Promise(function(toot, boot){

        // batch up and sort what we have in the filters for the executeOn
        let filterChain = [];
        Object.keys(filters).forEach(function(filterId){
            if (filters[filterId].hasOwnProperty('executeOn') && (filters[filterId].executeOn == executeOn)){
                filterChain.push(filters[filterId]);
            }
        })
        filterChain = filterChain.sort(function(a,b){ return(a.order - b.order)} );
        if (filterChain.length == 0){
            if (that.debug){ that._app.log(`${that._className} | executeFilters(${executeOn}) | no filters to execute!`); }
            toot({});
        }else{

            // this itterative function executes the filter code
            function executeFilter(idx, pipe){
                let pd = (pipe instanceof Object)?pipe:{};
                if (idx > (filterChain.length -1)){
                    toot(pd);
                }else{
                    if (that.debug){ that._app.log(`${that._className} | executeFilters(${executeOn}) | ${idx} | ${filterChain[idx].name}`); }

                    let filterThrow = false;
                    filterChain[idx].executor(that, pd).catch(function(error){
                        filterThrow = true;
                        boot(new noiceException({
                            message:        `${filterChain[idx].name} | ${executeOn} filter at position ${idx} threw: ${error}`,
                            thrownBy:       `${that._className} | executeFilters(${executeOn}) | [${idx}] ${filterChain[idx].name}`,
                            error:           error,
                            messageNumber:   9,
                        }));

                    }).then(function(filterOut){
                        if (! filterThrow){
                            if (filterOut.abort == true){
                                boot(new noiceException({
                                    message:        `${filterChain[idx].name} | ${executeOn} filter at position ${idx} exited`,
                                    thrownBy:       `${that._className} | executeFilters(${executeOn}) | [${idx}] ${filterChain[idx].name}`,
                                    messageNumber:   10,
                                }));
                            }else{
                                executeFilter((idx + 1), filterOut.pipeData);
                            }
                        }
                    })
                }
            } // end executeFilter helper function

            // are you ready for some football?
            executeFilter(0, pipeData);
        }
    }));
}




/*
    handles stuff
*/
set handleTemplate(v){ this._handleTemplate = v; }
get handles(){ return(this._handles); }
set handles(v){ this._handles = v; }                // maybe do more with this later
get handle(){
    if (this.handles.length < 1){
        let handle = this.getHandle();
    }
    return(this.handles[0]);
}

/*
    return a formViewHandle object
    which is just a coreUIElement of
    this.handleTemplate

    we keep a pointer to all of the handles returned by this function
    in ._handles. updateHandles() will update them all
*/
getHandle(){
    let that = this;
    let handle = new noiceCoreUIElement({
        className:         "formViewHandle",
        getHTMLCallback:    function(selfRef){ return(that.handleTemplate); },
        renderCallback:     function(selfRef){
            selfRef.DOMElement.addEventListener('click', function(evt){
                if (selfRef.selectCallback instanceof Function){
                    selfRef.selectCallback(selfRef).catch(function(error){
                        // so that the console won't seem them as unhandled ...
                        if (that.debug){ that._app.log(`${that._className} | handle -> selectCallback() | rejected: ${error}`); }
                    });
                }
            });
        }
    })
    that.handles.push(handle);
    that.updateHandles();
    return(handle);
}
updateHandles(){
    let that = this;
    that.handles.forEach(function(handle){

        // cloneable, dirty, rowStatus & rowTitle are special attributes
        handle._DOMElements._handleMain.dataset.cloneable = that.cloneable?'true':'false';
        handle._DOMElements._handleMain.dataset.dirty = that.changeFlag?'true':'false';
        handle._DOMElements._handleMain.dataset.status = that.rowStatus;
        ['rowStatus', 'rowTitle'].forEach(function(attributeName){
            if (handle._DOMElements.hasOwnProperty(attributeName)){ handle[attributeName] = that[attributeName]; }
        });

        // everything else, just match up formElement names to ._DOMElements names in the handle
        Object.keys(that._formElements).forEach(function(fieldName){
            if (handle._DOMElements.hasOwnProperty(fieldName)){

                if (that.isNotNull(that._formElements[fieldName].value)){
                    // date, dateTime, time types need decode from epoch
                    if (['date', 'dateTime', 'time'].indexOf(that._formElements[fieldName].type) >= 0){
                        handle[fieldName] = that.fromEpoch(that._formElements[fieldName].value, 'dateTimeLocale');
                    }else{
                        handle[fieldName] = that._formElements[fieldName].value;
                    }
                }else{
                    handle[fieldName] = `[${that._formElements[fieldName].label}]`;
                }

            }
        });

    });




}




/*
    rowStatus
    this indicates the processing status of the row within the indexedDB/syncWorker
    system. Values of this attribute are arbitrary. You can setup whatever you
    need. For demo and default purposes in the formView parent class we have this:

        * new           - the record does not exist in indexedDB (default for create viewMode)
        * inventory     - the record exists in the indexedDB (default for modify viewMode)
        * queued        - the record has been saved to indexedDB and is awaiting syncWorker to sync to server
        * error         - the record has been saved in indexedDB but syncWorker threw an error syncing to server
        * transmitted   - the record exists in indexedDB and has recently synced successfuly to the sever

    the value of rowStatus is present as 'status' in the dataset of this.DOMElement, as well
    as in the handle._DOMElements._handleMain (for each handle)
*/
get rowStatus(){ return(this.__rowStatus); }
set rowStatus(v){
    this.__rowStatus = v;
    if (this.DOMElement instanceof Element){ this.DOMElement.dataset.status = v; }
    this.updateHandles();
}




/*
    loseFocus(focusArgs)
    we have two optional async callbacks
    1. loseFocusCallback(formViewReference, focusArgs)
       rejecting the promise aborts the focus change

    2. areYouSureCallback(formViewReference, focusArgs)
       only fires if changeFlag is set, rejecting aborts focus change
       this will fire AFTER loseFocusCallback if specified AND that
       promise resolves. If loseFocusCallback isn't specified we skip
       right to this one (again if the changeFlag is set)
*/
loseFocus(focusArgs){
    let that = this;

    return(new Promise(function(toot, boot){
        let cbAbort = false;
        new Promise(function(cbToot, cbBoot){
            let loseFocusCallbackAbort = false;
            if (that.loseFocusCallback instanceof Function){
                that.loseFocusCallback(that, focusArgs).catch(function(error){
                    loseFocusCallbackAbort = true;
                    cbBoot(error);
                }).then(function(){
                    if (! loseFocusCallbackAbort){ cbToot(true); }
                })
            }else{
                cbToot(true);
            }
        }).catch(function(error){
            cbAbort = true;
            if (that.debug){ that._app.log(`${that._className} | loseFocus -> loseFocusCallback | cancelled focus change: ${error}`); }
            boot(error);
        }).then(function(){
            if (! cbAbort){
                let aysAbort = false;
                if ((that.areYouSureCallback instanceof Function) && (that.changeFlag)){
                    that.areYouSureCallback(that, focusArgs).catch(function(error){
                        aysAbort = true;
                        if (that.debug){ that._app.log(`${that._className} | loseFocus -> areYouSureCallback | cancelled focus change: ${error}`); }
                        boot(error);
                    }).then(function(){
                        if (! aysAbort){ toot(true); }
                    });
                }else{
                    toot(true);
                }
            }
        });
    }));
}




/*
    close()

    invoke the closeCallback() if we have one.
    if that passes,

    close the form view, removing it from it's parent uiHolder should it have one
    and remove all rowHandles
*/
close(){
    let that = this;
    return(new Promise(function(toot, boot){
        let mAbort = false;
        new Promise(function(t,b){
            if (that.closeCallback instanceof Function){
                let cbAbort = false;
                that.closeCallback(that).catch(function(error){
                    cbAbort = true;
                    b(error);
                }).then(function(){
                    if (! cbAbort){ t(true); }
                })
            }else{
                t(true);
            }
        }).catch(function(error){
            mAbort = true;
            if (that.deug){ that._app.log(`${that._className} | close() -> removeCallback() | prevented close: ${error}`); }
        }).then(function(){
            if (! mAbort){

                // un-select all selected rowHandles, which should trigger the areYouSureCallback if the changeFlag is set
                let pk = [];
                that.handles.forEach(function(handle){
                    if (
                        (handle.selectCallback instanceof Function) &&
                        (handle._DOMElements instanceof Object) &&
                        (handle._DOMElements._handleMain instanceof Element) &&
                        (handle._DOMElements._handleMain.dataset) &&
                        (handle._DOMElements._handleMain.dataset.selected) &&
                        (handle._DOMElements._handleMain.dataset.selected == 'true')
                    ){
                        pk.push(handle.selectCallback(handle));
                    }
                });
                let pkAbort = false;
                Promise.all(pk).catch(function(error){
                    pkAbort = true;
                    boot(error);
                }).then(function(){
                    if (! pkAbort){
                        // remove thyself from the uiHolder if ye have one maytee ...
                        if (
                            (that.UIHolder instanceof noiceCoreUIScreenHolder) &&
                            (that.hasOwnProperty('UIHolderName')) &&
                            (that.isNotNull(that.UIHolderName))
                        ){
                            that.UIHolder.removeUI(that.UIHolderName);
                        }

                        // time t'walk the plank ... YARRR! remove all ye handles from the DOM.
                        that.handles.forEach(function(handle){ handle.remove(); });
                        toot(true);
                    }
                });
            }
        });
    }))
}




/*
    clone stuff
    the default behavior is that *.cloneable is false until the first successful save
    you can disable that behavior by setting *._cloneableOnSave = false;
*/
get cloneable(){ return(this._cloneable); }
set cloneable(v){
    let that = this;
    let bigAbort = false;
    new Promise(function(toot, boot){
        if (that.hasOwnProperty('cloneableCallback')){
            let cbAbort = false;
            that.cloneableCallback(that, v).catch(function(error){
                cbAbort = true;
                boot(error);
            }).then(function(){
                if (! cbAbort){ toot(true); }
            })
        }else{
            toot(true);
        }

    }).catch(function(error){
        bigAbort = true;
        if (that.debug){ that._app.log(`${this._className} | cloneable setter(${v}) | cloneableCallback prevented toggle: ${error}`); }
    }).then(function(){
        if (! bigAbort){
            that._cloneable = (v == true);
            that.updateHandles();
        }
    })
}
set cloneView(v){ this._cloneView = v; }
get cloneView(){
    let that = this;
    if (that._cloneView instanceof formView){
        that._cloneView.disableValueChange = true;
        that._cloneView.data = that.data;
        that._cloneView.disableValueChange = false;
        return(that._cloneView);
    }else{
        that.cloneView = new formView({
            formMode:           'clone',
            config:             that.config,
            _app:               that._app,
            disableValueChange: true,
            data:               that.data,
            saveCallback:       function(formViewReference){ return(that.cloneCallback(formViewReference)); },
            getHTMLCallback:    function(formViewReference){ return(that.cloneViewHTML); }
        });
        that._cloneView.disableValueChange = false;
        return(that._cloneView);
    }
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

    LOH 9/17/21 @ 1036 -- return here later
    ok so ... the clone view truly needs it own html template, not to apply
    changes to the one programattically via set formMode() ...

    this is kind of a mess. Because I could put a switch in get html(), however
    that would effectively mean you cannot use the formMode() setter to get a clone
    mode view, it'd have to be born that way.

    now ... technically noiceCoreUIElement has an html *setter*, and we could go back
    in and clean that up, make sure it re-renders, etc. There may be an issue though
    in terms of removing accessors to ._DOMElements that do not exist in the selected
    viewMode. So much logic depends on that.

    Well ... maybe not that much, since all the field access is through *._formElements
    but still. that could be tricky.

    the other option is that we're just all like "yeah ok, you can't toggle into or
    out of the clone mode, and it only exists as a copy-of-self accesssor"

    another option is to go back to the mutate-a-single-template thing and set up
    a sort of switch-via-div-container, and some things are just removed from the DOM
    by the mode setter, then added back, depending. That could be messy too.

    another option might be to set up a cloneHtml() getter. When we spawn the clone view
    we do it as a copy of self overriding the getHTMLCallback and pointing it to our own
    cloneHTML() getter.

    three options:

        1) set html(), swap out attribute accessors,
           and set new html template from the formMode setter

        2) mutate existing html template with toggleable sections
           formMode setter removes and inserts things from the DOM

        3) clone mode isn't toggleable, we just make the one clone view from
           *.getCloneView or whatever, and we override the html getter at
           object instantiation

        4) ok one more ... execute filters on formMode change, and have a seriously
           severe set of filters mutating the html (this isn't a horrible idea,
           in and of itself, but not for the purposes of wholesale changing an html
           template)

   anyhow I've not have a shower in 2 days, and I've got a lunch date with Jeny
   so gots to think on this in the shower.


   RESUME 9/17/21 @ 1501
   ok ... here's what imma try

   let's move ahead with a getCloneView as a duplicate of self with the getHTMLCallback()
   overridden to point at this.cloneViewTemplate, so an easy override in the descendant class
   and with saveCallback mapped to this.cloneCallback, so again easy override.

   at first, maybe we can't toggle into clone mode. When we've got all this working, come back
   and either lock off formMode('clone') or actually dig into noiceCoreUIElement html setter
   and make sure we do it right.

   offhand, I think it might not be too bad.
   basically something like:

    foreach this._formElements -> remove();
    this.html = this.cloneTemplate
        -> make sure render knows to remove existing attributes that are aliases
           to this._formElements, then re-create them

    and set up a switch in get html() based on initial formMode.
    perhas a switch statement with a default that returns something.

    that woud necessitate moving some stuff around. for instance you might not want to
    override html but pont the html getter at something like a getViewModeHTML(viewMode)
    then have getters to override for each mode. But you know ... that can be for later

    fpor the moment let's get the first part working, then we can worry about the mode
    changeability later.


    LOH 9/16/21 @ 2253

    next:

        * manage a removedfields menu or some such
        * formMode: clone
        * (nitpick) we don't need seconds or the full year on the modified date in the handle

    THOUGHTS AT 2208
        the existing cloneView class concept is a mess.

        it's tempting to re-factor this as the cloneView being a complete duplicate of self with
        formMode = 'clone', then let the config do the heavy lifting. in terms of rendering the
        remove button, showing default fields and rendering a field selector that we can include
        in the html template with a special dataset attibute.

        in formMode: 'clone', the saveCallback toggles to the cloneCallback
        cloneCallback can get passed a COPY of the cloneView with formMode: 'modify', which one
        can get a handle for, add to the handleList, insert into the viewHolder etc. We can add
        a clean hook for auto-save the new record too.

        this gets us true inputValidation identical to the create mode (and we can add filters to
        fire on just 'clone' as well). We may need some logic to auto-add fields with validation
        errors in the view.

        and we can append cloneView right into a balloonDialog

        and we can have a *cloneable <bool> attribute and we can check that on handleRowSelect
        in recordEditorUI, and this is how we togggle the clone button. It's enabled any time
        a handle with a cloneable view is selected and toggled off a the top of the function
        so it's always disabled otherwise.

        I think maybe we just add a data- hook in the html template to dissapear them when
        they're in the wrong mode, and put that hook in setFormMode()

        k, yeah I really am done for the day.

*/

} // end formView class
