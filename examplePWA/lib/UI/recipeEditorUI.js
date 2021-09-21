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
        debug:              true,
        handleNumber:       that.handleNumber
    });

    // wire the formView's areYouSureCallback() to the recordEditorUI's saveChangesDialog()
    view.areYouSureCallback = function(formViewReference, focusArgs){ return(that.saveChangesDialog(formViewReference, focusArgs)); }

    // wire the formView's cloneableCallback to toggle btnClone
    view.cloneableCallback = async function(formViewReference, flag){
        if (formViewReference.onScreen){ that._DOMElements.btnClone.disabled = (flag == false); }
        return(true);
    }

    // setup the rowHandle and add it to the handleList
    let viewHandle = view.handle.append(that._DOMElements.handlelist);
    viewHandle.selectCallback = function(selfRef){ return(that.handleRowSelect(viewHandle._DOMElements._handleMain)); }

    // add the formView to our uiHolder with the rowHandle's GUID
    this.uiHolder.addUI(view, viewHandle._DOMElements._handleMain.dataset.guid);

    // then select the new rowHandle
    that.handleRowSelect(viewHandle._DOMElements._handleMain)

    // increment our untitled document count
    that.handleNumber++;

    /*
        LOH 9/20/21 @ 2305
        ok ... formView / cloneView / handle seem to be nailed down!
        hook some stuff onto saveCallback & cloneCallback
        then its searching!
    */

}




}
