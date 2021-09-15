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
addRowOld(){
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

    console.log(view.getHandle());

    let viewHandle = view.handle.append(that._DOMElements.handlelist);
    viewHandle.selectCallback = function(selfRef){ that.handleRowSelect(viewHandle._DOMElements._handleMain); }

    console.log(viewHandle.DOMElement.dataset.guid);


    this.uiHolder.addUI(view, viewHandle._DOMElements._handleMain.dataset.guid);

    // then select it
    that.handleRowSelect(viewHandle._DOMElements._handleMain)

    that.handleNumber++;

    /*
        LOH 9/13/21 @ 2302
        can't go anymore today
        there's a problem. recipeFormView get handleTemplate() won't override
        no idea.

        also _DOMElements._handleMain is a bit of a stretch.

        otherwise makin' progress

    */
}


}
