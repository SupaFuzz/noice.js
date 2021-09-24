/*
    recipeEditor.js
    this is a recordEditorUI subclass for creating / editing
    recipeFormView objects
*/
class recipeEditorUI extends recordEditorUI {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:           1,
            _className:         'recipeEditor',
            handleNumber:       1
        }, defaults),
        callback
    );

} // end constructor




/*
    addRow() override
*/
async addRow(otherView){
    let that = this;
    this._app.log(`${this._className} | addRow()`);

    /*
    let view = new recipeFormView({
        formMode:           'create',
        config:             that._app.config.Forms.recipe,
        _app:               that._app,
        rowTitle:           `Untitled #${this.handleNumber}`,
        cancelButtonText:   '',

        // custom stuff
        handleNumber:       that.handleNumber,

        // callbacks
        saveCallback:       function(formViewReference){ return(that.handleFormViewSave(formViewReference)); },
        cloneCallback:      function(cloneViewReference){ return(that.handleFormViewClone(cloneViewReference)); },
        cloneableCallback:  function(formViewReference, flag){ return(that.toggleCloneIcon(formViewReference, flag)); },
        areYouSureCallback: function(formViewReference, focusArgs){ return(that.saveChangesDialog(formViewReference, focusArgs)); },

        // debug stuff
        cloneable:          true,
        _cloneableOnSave:   false,
        debug:              true,
    });
    */
    let view;
    if (that.isNotNull(otherView) && (otherView instanceof formView)){
        view = otherView;
    }else{
        view = await that.makeNewFormView();
    }

    // setup the rowHandle and add it to the handleList
    let viewHandle = view.handle.append(that._DOMElements.handlelist);
    viewHandle.selectCallback = function(selfRef){ return(that.handleRowSelect(viewHandle._DOMElements._handleMain)); }

    // add the formView to our uiHolder with the view's rowID
    this.uiHolder.addUI(view, view.rowID);

    // then select the new rowHandle
    that.handleRowSelect(viewHandle);

    // increment our untitled document count
    that.handleNumber++;

    return(true);
}




/*
    makeNewFormView(formView)
    this makes a new reecipeFormView in create mode either with default field values
    if (formView is null), or if formView is presnet, we'll copy in formView.data
    (allowing changeField callbacks etc)
*/
makeNewFormView(externalFormView){
    let that = this;
    return(new Promise(function(toot, boot){
        let newView = new recipeFormView({
            formMode:           'create',
            config:             that._app.config.Forms.recipe,
            _app:               that._app,
            rowTitle:           `Untitled #${that.handleNumber}`,
            cancelButtonText:   '',

            // custom stuff
            handleNumber:       that.handleNumber,

            // callbacks
            saveCallback:       function(formViewReference){ return(that.handleFormViewSave(formViewReference)); },
            cloneCallback:      function(cloneViewReference){ return(that.handleFormViewClone(cloneViewReference)); },
            cloneableCallback:  function(formViewReference, flag){ return(that.toggleCloneIcon(formViewReference, flag)); },
            areYouSureCallback: function(formViewReference, focusArgs){ return(that.saveChangesDialog(formViewReference, focusArgs)); },

            debug:              true,
        });
        if (that.isNotNull(externalFormView) && (externalFormView instanceof formView)){
            newView.rowTitle = externalFormView.rowTitle;
            newView.setData(externalFormView.data).then(function(){
                newView.data = externalFormView.data;
                toot(newView);
            });
        }else{
            toot(newView)
        }
    }));

}




/*
    toggleCloneIcon(formViewReference, flag)
    this is the cloneableCallback for our formViews
*/
async toggleCloneIcon(formViewReference, flag){
    if (formViewReference.onScreen){ this._DOMElements.btnClone.disabled = (flag == false); }
    return(true);
}



/*
    handleFormViewSave(formViewReference)
    this is the formView's saveCallback, and we pipe it to the app's writeRecipe() function
*/
handleFormViewSave(formViewReference){
    let that = this;

    return(new Promise(function(toot, boot){
        let writeFields = {};
        formViewReference.changedFields.forEach(function(field){
            writeFields[field.fieldName] = field.newValue;
        });
        let writeAbort = false;
        that._app.writeRecipe(formViewReference.rowID, writeFields).catch(function(error){
            writeAbort = true;
            boot(error);
        }).then(function(dbRow){
            if (! writeAbort){
                formViewReference.rowStatus = dbRow._rowMeta.rowStatus;
                toot(dbRow);
            }
        });
    }));
}




/*
    handleFormViewClone(cloneViewReference)
    this is the formView's cloneCallback, the cloneFormViewReference is a
    reference to the selected formView's cloneView.

    We'll need to make a new formView from cloneFormViewReference's .data,
    get the handle, and add it to the uiHolder etc.
    so really what we need is a function for adding a formView to the UI, etc.
    which is technically what addRow() should be except that it should take
    a formView as an argument and if there isn't one already, *then* spawn one
*/
handleFormViewClone(cloneViewReference){
    let that = this;
    return(new Promise(function(toot, boot){
        if (that.debug){ that._app.log(`${that._className} | handleFormViewClone | called`); }
        let abrt = false;
        that.makeNewFormView(cloneViewReference).catch(function(error){
            abrt = true;
            that._app.log(`${that._className} | handleFormViewClone | failed to instantiate new formView from cloneView: ${error}`);
            boot(error);
        }).then(function(newView){
            if (! abrt){
                that.addRow(newView);
                let saveAbrt = false
                newView.save().catch(function(error){
                    saveAbrt = true;
                    that._app.log(`${that._className} | handleFormViewClone | clone created but save() failed: ${error}`);
                    boot(error);
                }).then(function(){
                    if (! saveAbrt){ toot(true); }
                })
            }
        });
    }));
}




} // end class
