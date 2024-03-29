/*
    recordEditorUI.js
    this is a UI screen for creating and editing records.
    the layout is something like this

    --------------------------------------------------------------------------
    | < back (s) (+) (c) (=) |                                               |
    |                        |                                               |
    | [title]                |                                               |
    |------------------------|                                               |
    |                        |                                               |
    |  [handle list]         |              [selected record]                |
    |                        |                                               |
    |                        |                                               |
    |                        |                                               |


    * < back is a button returning the user to the main (or other) UI
    * (s) is the search button
    * (+) is a button to create a new record
    * (c) is the clone button
    * (=) is a burger menu
    * [title] is a templateElement, arbitrary string
    * [handle list] is a div into which we insert rowHandles for rows the UI is managing
    * [selected record] is the formView for the rowHandle selected in the [handle list]

    basically subclass this and override addRow() & cloneRow(), and send in content
    for burgerMenu and you're good to go

    * openSearchMenuCallback(selfReference)
      async callback can cancel menu by throwing. for setting up stuff like datalists, etc

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
                        grid-template-columns: 1.5em 8fr;
                    "
                >
                    <button data-templatename="btnBack" class="btnBack textButton">back</button>
                    <div
                        class="buttonMenu"
                        style="
                            text-align:            right;
                        "
                    >
                        <button data-templatename="btnSearch" class="btnSearch" alt="search records">&nbsp;</button>
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
        id: 'recordEditorUI'
    }).append(that._DOMElements.rightcol);

    // make a burger menu
    that.burgerMenuDialog = new noiceBalloonDialog({
        title:         '',
        hdrContent:    '',
        dialogContent: (this.burgerMenu instanceof Element)?this.burgerMenu:null,
        arrow:         'topMid',
        setPosition:    function(selfReference){
            let tbox = that._DOMElements.btnBurger.getBoundingClientRect();
            let dbox = selfReference._DOMElements.dialog.getBoundingClientRect();
            selfReference.y = (tbox.bottom + 5);
            selfReference.x = (tbox.x - (dbox.width/2));
        }
    });

    // hook for burgerMenu button
    that._DOMElements.btnBurger.addEventListener('click', function(evt){
        that.burgerMenuDialog.append(that.DOMElement);
    });

    // make the cloneDialog
    that.cloneDialog = new noiceBalloonDialog({
        title:         'duplicate record',
        classList:     ['cloneDialog'],
        hdrContent:    '',
        dialogContent: '',
        arrow:         'topLeft',
        myFormView:     null,
        setPosition:    function(selfReference){
            let tbox = that._DOMElements.btnClone.getBoundingClientRect();
            let dbox = selfReference._DOMElements.dialog.getBoundingClientRect();
            selfReference.y = (tbox.bottom + 12);
            selfReference.x = (tbox.x - 11);
        }
    });

    // hook for clone button
    that._DOMElements.btnClone.addEventListener('click', function(evt){

        // set dialogContent to select formView cloneView
        if (
            that.isNotNull(that.uiHolder.currentUI) &&
            that.isNotNull(that.uiHolder.getUI(that.uiHolder.currentUI)) &&
            (that.uiHolder.getUI(that.uiHolder.currentUI).cloneable == true)
        ){
            if (that.cloneDialog.myFormView instanceof formView){
                that.cloneDialog.myFormView.cloneView.remove();
            }
            that.cloneDialog.myFormView = that.uiHolder.getUI(that.uiHolder.currentUI);
            that.cloneDialog.dialogContent = that.cloneDialog.myFormView.cloneView;

            // position and show the dialog
            that.cloneDialog.append(that.DOMElement);
        }

    });


    // hook for back button
    that._DOMElements.btnBack.addEventListener('click', function(){ that._app.screenHolder.switchUI('main'); });

    // hook for add button
    that._DOMElements.btnAdd.addEventListener('click', function(){ that.addRow(); });

    // the search dialog
    that.searchMenuDialog = new noiceBalloonDialog({
        title:         'search records',
        classList:     ['searchDialog'],
        hdrContent:    '',
        dialogContent: (this.searchMenu instanceof Element)?this.searchMenu:null,
        arrow:         'topLeft',
        setPosition:    function(selfReference){
            let tbox = that._DOMElements.btnSearch.getBoundingClientRect();
            let dbox = selfReference._DOMElements.dialog.getBoundingClientRect();
            selfReference.y = (tbox.bottom + 12);
            selfReference.x = (tbox.x - 11);
        }
    });

    // hook for btnSearch
    that._DOMElements.btnSearch.addEventListener('click', function(evt){
        if (that.openSearchMenuCallback instanceof Function){
            let abrt = false;
            that.openSearchMenuCallback(that).catch(function(error){
                abrt = true;
                that._app.log(`${that._className} | openSearchMenuCallback() prevented menu open: ${error}`);
            }).then(function(){
                if (! abrt){ that.searchMenuDialog.append(that.DOMElement); }
            });
        }else{
            that.searchMenuDialog.append(that.DOMElement);
        }
    });
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
get searchMenu(){ return(this._searchMenu); }
set searchMenu(v){
    this._searchMenu = v;
    if (this.searchMenuDialog instanceof noiceBalloonDialog){
        this.searchMenuDialog.dialogContent = this._searchMenu;
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
    handle.dataset.rowid = this.rowID;
    handle.insertAdjacentHTML('afterbegin', `<div class="handle"><h3 style="margin: .5em;">Record #${this.handleNumber}</h3></div>`);
    this._DOMElements.handlelist.appendChild(handle);
    handle.addEventListener('click', function(){ that.handleRowSelect(handle); })

    this.uiHolder.addUI(new noiceCoreUIScreen({
        name: handle.dataset.rowid,
        getHTMLCallback: function(){return(`
            <div style="color: rgb(240, 240, 240);">
                <h3>Record #${that.handleNumber}</h3>
                <span>rowID: ${handle.dataset.rowid}
            </div>
        `)}
    }), handle.dataset.rowid);

    that.handleNumber++;

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

        // make sure we can use the rowHandle we got (this could be cleaner, I'll admit)
        let useRowHandle = rowHandle;
        if (rowHandle instanceof noiceCoreUIElement){
            if (rowHandle._DOMElements._handleMain instanceof Element){
                useRowHandle = rowHandle._DOMElements._handleMain;
            }
        }

        let pk = [];
        if (that._DOMElements.btnClone instanceof Element){ that._DOMElements.btnClone.disabled = true; }
        that._DOMElements.handlelist.querySelectorAll(`.rowHandle[data-selected='true']:not(.rowHandle[data-rowid='${useRowHandle.dataset.rowid}'])`).forEach(function(handle){
            pk.push(that.handleRowSelect(handle));
        });
        let focusCancel = false;
        Promise.all(pk).catch(function(error){
            focusCancel = true;
            that._app.log(`${that._className} | handleRowSelect | focus change canceled: ${error}`);
            boot(error);
        }).then(function(){
            if (! focusCancel){
                let myFocusCancel = false;
                that.uiHolder.switchUI((useRowHandle.dataset.selected == 'true')?null:useRowHandle.dataset.rowid).catch(function(error){
                    myFocusCancel = true;
                    that._app.log(`${that._className} | handleRowSelect | focus change canceled: ${error}`);
                    boot(error);
                }).then(function(){
                    if (! myFocusCancel){
                        useRowHandle.dataset.selected = (useRowHandle.dataset.selected == 'true')?'false':'true';
                        if (that._DOMElements.btnClone instanceof Element){ that._DOMElements.btnClone.disabled = (! ((useRowHandle.dataset.selected == 'true') && (useRowHandle.dataset.cloneable == 'true'))); }
                        toot();
                    }
                })
            }
        });
    }));
}




/*
    saveChangesDialog(formViewReference, focusArgs)
    wire this to the areYouSureCallback of formViews you add via addRow(), etc
    this will pop the 'are you sure' dialog if the change flag is set
    when we attempt to loseFocus on the formView

    note: in your formView, set formViewReference._pendingExit = true to get the
    "you're discarding these changes" version rather than the
    "you will need return to save this" version.

    toot(...) to allow the loseFocus operation to continue
    boot(...) to disallow the loseFocus operation
*/
saveChangesDialog(formViewReference, focusArgs){
    let that = this;
    return(new Promise(function(toot, boot){
        let dialogArgs = {
            heading:        'Unsaved Changes',
            hideCallback:   function(myself){
                if (myself.zTmpDialogResult == true){
                    if (formViewReference.hasOwnProperty('_pendingExit') && (formViewReference._pendingExit == true)){
                        formViewReference._pendingExit = false;
                    }
                    boot(false);
                }else{
                    toot(true);
                }
            }
        }
        if (formViewReference.hasOwnProperty('_pendingExit') && (formViewReference._pendingExit == true)){
            dialogArgs.message          = `This will discard unsaved changes. Touch 'discard' to continue or 'cancel' to return`;
            dialogArgs.yesButtonTxt     = 'cancel';
            dialogArgs.noButtonTxt      = 'discard';
        }else{
            dialogArgs.message          = `There are unsaved changes. Touch 'cancel' to return to the record and save your changes, or 'continue' to exit`;
            dialogArgs.yesButtonTxt     = 'cancel';
            dialogArgs.noButtonTxt      = 'continue';
        }
        new noiceCoreUIYNDialog(dialogArgs).show(that.DOMElement);
    }));
}




} // end recordEditorUI class
