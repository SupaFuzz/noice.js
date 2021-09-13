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


    /* eventually this will be replaced by the .rowHandle getter of the formView */
    if (! (this.hasOwnProperty('handleNumber'))){ this.handleNumber = 1; }
    let handle = document.createElement('div');
    handle.className = 'rowHandle';
    handle.dataset.selected = "false";
    handle.dataset.status = 'unassigned';
    handle.dataset.dirty = 'true';
    handle.dataset.guid = this.getGUID();
    handle.insertAdjacentHTML('afterbegin', `<div class="handle"><h3 style="margin: .5em;">Record #${this.handleNumber}</h3></div>`);
    this._DOMElements.handlelist.appendChild(handle);
    handle.addEventListener('click', function(){ that.handleRowSelect(handle); })

    // add the new formView to the uiHolder
    this.uiHolder.addUI(new formView({
        formMode:           'create',
        config:             that._app.config.Forms.recipe,
        _app:               that._app,
        rowTitle:           `Record #${this.handleNumber}`,
        cancelButtonText:   '',
        debug:              true
        // testing
    }), handle.dataset.guid);

    // then select it
    that.handleRowSelect(handle)


    that.handleNumber++;
}



}
