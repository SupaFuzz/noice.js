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
addRow(){
    let that = this;
    this._app.log(`${this._className} | addRow()`);

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

    // setup the rowHandle and add it to the handleList
    let viewHandle = view.handle.append(that._DOMElements.handlelist);
    viewHandle.selectCallback = function(selfRef){ return(that.handleRowSelect(viewHandle._DOMElements._handleMain)); }

    // add the formView to our uiHolder with the view's rowID
    this.uiHolder.addUI(view, view.rowID);

    // then select the new rowHandle
    that.handleRowSelect(viewHandle);

    // increment our untitled document count
    that.handleNumber++;

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
        that._app.log(`${this._className} | handleFormViewClone | called`);

        /*
            LOH 9/24/21 @ 1016
            after get-ready and face lasers ...
        */

        toot(true);
    }));
}




} // end class
