/*
    recordEditorUI.js
    this is a UI screen for creating and editing records.
    the layout is something like this

    ----------------------------------------------------------------------
    | < back (+) (c) (=) |                                               |
    |                    |                                               |
    | [title]            |                                               |
    |--------------------|                                               |
    |                    |                                               |
    |  [handle list]     |              [selected record]                |
    |                    |                                               |
    |                    |                                               |
    |                    |                                               |


    * < back is a button returning the user to the main (or other) UI
    * (+) is a button to create a new record
    * (c) is the clone button
    * (=) is a burger menu
    * [title] is a templateElement, arbitrary string
    * [handle list] is a div into which we insert rowHandles for rows the UI is managing
    * [selected record] is the formView for the rowHandle selected in the [handle list]

    basically subclass this and override addRow() & cloneRow(), and send in content
    for burgerMenu and you're good to go

*/
class recordEditorUI extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:           1,
            _className:         'recordEditorUI',
            _burgerMenu:        null,
            _showBurgerButton:  true,
            _showAddButton:     true,
            _showCloneButton:   true,
            _leftColWidth:      '38.195302843vw',
            debug:              false
        }, defaults),
        callback
    );

} // end constructor




/*
    html getter
*/
get html(){ return(`
    <div
        class="recordEditorUILayout"
        data-templatename="layoutdiv"
        style="
            display:     grid;
            margin:      0;
            width:       100vw;
            height:      100vh;
            place-items: center stretch;
            grid-template-columns: ${this.leftColWidth} auto;
        "
    >

        <!-- left column -->
        <div
            class="leftCol"
            data-templatename="leftcol"
            style="
                height: 100%;
                overflow-y: auto;
            "
        >

            <!-- menu -->
            <div class="header" style="
                position: sticky;
        	    top: 0px;
            ">
                <div
                    class="navigationMenu"
                    data-templatename="navigationMenu"
                    style="
                        display: grid;
                        grid-template-columns: 1fr 3fr;
                    "
                >
                    <button data-templatename="btnBack" class="btnBack textButton">back</button>
                    <div
                        class="buttonMenu"
                        style="
                            text-align:            right;
                        "
                    >
                        <button data-templatename="btnAdd" class="btnAdd" alt="create new record">&nbsp;</button>
                        <button data-templatename="btnClone" class="btnClone" alt="clone existing record" disabled="true">&nbsp;</button>
                        <button data-templatename="btnBurger" class="btnBurger">&nbsp;</button>
                    </div>
                </div>

                <!-- title -->
                <h2 data-templatename="title" data-templateattribute="true" class="title">${this.title}</h2>
            </div>

            <!-- handle list -->
            <div
                data-templatename="handlelist"
                class="handleList"

            ></div>
        </div>


        <!-- right column -->
        <div class="rightCol" data-templatename="rightcol" style="height:100%;overflow-y:auto;"></div>

    </div>
`)}




/*
    setup
*/
setupCallback(){
    let that = this;

    // make a UI switcher for the right column
    that.uiHolder = new noiceCoreUIScreenHolder({
        UIList:     [],
        fullscreen: false,
        id: 'blah'
    }).append(that._DOMElements.rightcol);

    // make a burger menu
    that.burgerMenuDialog = new noiceBalloonDialog({
        title:         '',
        hdrContent:    '',
        dialogContent: (this.burgerMenu instanceof Element)?this.burgerMenu:null,
        arrow:         'topRight'
    });

    // hook for burgerMenu button
    that._DOMElements.btnBurger.addEventListener('click', function(evt){
        let tbox = that._DOMElements.btnBurger.getBoundingClientRect();
        that.burgerMenuDialog.append(that.DOMElement);
        let dbox = that.burgerMenuDialog._DOMElements.dialog.getBoundingClientRect();
        that.burgerMenuDialog.y = (tbox.bottom + 5);
        that.burgerMenuDialog.x = ((tbox.x - dbox.width) + (tbox.width/2) + 21 + 10);
    });

    // hook for back button
    that._DOMElements.btnBack.addEventListener('click', function(){ that._app.screenHolder.switchUI('main'); });

    // hook for add button
    that._DOMElements.btnAdd.addEventListener('click', function(){ that.addRow(); })

    // hook for clone button
    that._DOMElements.btnClone.addEventListener('click', function(){ that.cloneRow(); })

}




/*
    attributes
*/
get leftColWidth(){ return(this._leftColWidth); }
set leftColWidth(v){
    this._leftColWidth = v;
    if (this._DOMElements.layoutdiv instanceof Element){
        this._DOMElements.layoutdiv.style.gridTemplateColumns = `${this.leftColWidth} auto`;
    }
}
get showBurgerButton(){ return(this._showBurgerButton); }
set showBurgerButton(b){
    this._showBurgerButton = (b == true);
    if (this._DOMElements.btnBurger instanceof Element){
        this._DOMElements.btnBurger.style.display = (this._showBurgerButton)?'block':'none';
    }
}
get showAddButton(){ return(this._showAddButton); }
set showAddButton(b){
    this._showAddButton = (b == true);
    if (this._DOMElements.btnAdd instanceof Element){
        this._DOMElements.btnAdd.style.display = (this._showAddButton)?'block':'none';
    }
}
get showCloneButton(){ return(this._showCloneButton); }
set showCloneButton(b){
    this._showCloneButton = (b == true);
    if (this._DOMElements.btnClone instanceof Element){
        this._DOMElements.btnClone.style.display = (this._showCloneButton)?'block':'none';
    }
}
get burgerMenu(){ return(this._burgerMenu); }
set burgerMenu(v){
    this._burgerMenu = v;
    if (this.burgerMenuDialog instanceof noiceBalloonDialog){
        this.burgerMenuDialog.dialogContent = this._burgerMenu;
    }
}




/*
    addRow()
    this adds a bogus demo rowHandle
    override this in your descendant class
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

    this.uiHolder.addUI(new noiceCoreUIScreen({
        name: handle.dataset.guid,
        getHTMLCallback: function(){return(`
            <div style="color: rgb(240, 240, 240);">
                <h3>Record #${that.handleNumber}</h3>
                <span>GUID: ${handle.dataset.guid}
            </div>
        `)}
    }), handle.dataset.guid);

    that.handleNumber++;

}




/*
    cloneRow()
    override this in your descendant class
*/
cloneRow(){
    this._app.log(`${this._className} | cloneRow()`)
}




/*
    handleRowSelect(rowHandleDOMElement)
    this is your standard "one selection at a time" focus switch.

    in a situation where you are changing focus, the loseFocus()
    function of the child noiceCoreUIScreen has an opportunity
    to cancel by throwing, which is why all the asychronous
    promises down there ... for instance the loseFocus()
    function might be popping the "are you sure you want to
    discard changes?" dialog and waiting for the user to click
    a button, or for the indexedDB to commit or what have you.
*/
handleRowSelect(rowHandle){
    let that = this;
    return (new Promise(function(toot, boot){
        let pk = [];
        that._DOMElements.handlelist.querySelectorAll(`.rowHandle[data-selected='true']:not(.rowHandle[data-guid='${rowHandle.dataset.guid}'])`).forEach(function(handle){
            pk.push(that.handleRowSelect(handle));
        });
        let focusCancel = false;
        Promise.all(pk).catch(function(error){
            focusCancel = true;
            that._app.log(`${this._className} | handleRowSelect | focus change canceled: ${error}`);
            boot(error);
        }).then(function(){
            if (! focusCancel){
                let myFocusCancel = false;
                that.uiHolder.switchUI((rowHandle.dataset.selected == 'true')?null:rowHandle.dataset.guid).catch(function(error){
                    myFocusCancel = true;
                    that._app.log(`${this._className} | handleRowSelect | focus change canceled: ${error}`);
                    boot(error);
                }).then(function(){
                    if (! myFocusCancel){
                        rowHandle.dataset.selected = (rowHandle.dataset.selected == 'true')?'false':'true';
                        toot();
                    }
                })
            }
        });
    }));
}




}