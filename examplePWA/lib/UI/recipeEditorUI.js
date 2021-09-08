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

    /* we need to make formView objects instead
    this.uiHolder.addUI(new noiceCoreUIScreen({
        name: handle.dataset.guid,
        getHTMLCallback: function(){return(`
            <div style="color: rgb(240, 240, 240);">
                <h3>Record #${that.handleNumber}</h3>
                <span>GUID: ${handle.dataset.guid}
            </div>
        `)}
    }), handle.dataset.guid);
    */


    that.handleNumber++;
}



}
