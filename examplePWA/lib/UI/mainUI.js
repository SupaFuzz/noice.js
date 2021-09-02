class noiceExamplePWAMainUI extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'noiceExamplePWAMainUI',
            _burgerMenu:    null,
            debug:          false,
        }, defaults),
        callback
    );

} // end constructor




/*
    html
*/
get html(){ return(
`<div class="uiContainer" style="
    display:grid;
    grid-template-columns: 1fr;
    grid-template-rows: 2em minmax(1em, 100%) minmax(2em, 3em);
    width:100%;
    height:100%;
    color: rgba(240, 240, 240, .6);
">
    <div class="hdrPanel">
        <span class="hdrTitle" data-templatename="hdrTitle" data-templateattribute="true">${this.hdrTitle}</span>
        <span class="hdrMsg" data-templatename="hdrMsg" data-templateattribute="true">${this.hdrMsg}</span>
        <button class="btnBurger" data-templatename="btnBurger" style="margin:.25em;">&nbsp;</button>
    </div>
    <div class="content">
        <div class="searchInputContainer" data-templatename="searchInputContainer" ></div>
        <div class="searchResultContainer" data-templatename="searchResultContainer"></div>
    </div>
    <div class="ftrPanel" style="
        display:grid;
        grid-template-columns:1.5em auto;
    ">
        <div style="align-self:center">
            <img src="./gfx/reset-icon.svg" style="visibility:hidden; "/>
        </div>
        <div style="align-self:center;text-align:right;width:100%">
            <button class="btnCreate" data-templatename="btnCreate">create</button>
            <button class="btnEdit" data-templatename="btnEdit">edit</button>
        </div>
    </div>
<div>`
); }

/*
    LOH 8/31/21 @ 1644
    return to noiceExamplePWA.js LOH # 223 when done here

    next step: fix up the layout stuff. There's better ways to do the header / burger menu thing
    as it is, btnBurger cannot be clicked. I don't even know. I'm thinking hdrPanel already got
    used in the existing CSS or something anyhow, move it out of that block and its clickable
    so we need to fix that up. Then I guess, really ... lets head straight for the form view and
    the add UI.

    update 8/31/21 @ 2314
    couldn't resist fixing up the CSS issue outlined above. it's good now.

    next up is the burger menu and it probably means cleaning up the noiceBaloonDialog class
    significantly. After that, add the search field, but it'll be a placeholder, because
    we haven't got anything to search yet. But for aestetics, let's put it in.

    after cleaning up noiceBaloonDialog the next step is clearning up noiceCoreUIFormElement
    we've gotta nail down the setValue listeners to use proper function wrappers that can
    be actually discarded.

    then building a formView
    then building a submit UI
    then a file export
    then we can have something to fetch from syncWorker, though a stroke of possible
    genius came over me and that's to leave syncworker completely out of this demo

    this demo should be simply data entry, search of what you already entered, and a file
    export + import.

    the NEXT demo would include a serviceWorker pointing to ARS
    and the one after that pointing at the custom backend.
*/


/*
    setupCallback()
*/
setupCallback(){
    let that = this;
    that._app.log(`${that._className} | setupCallback`);

    // make the burger menu dialog
    that.burgerMenuDialog = new noiceBalloonDialog({
        title:         '',
        hdrContent:    '',
        dialogContent: that.burgerMenu,
        arrow:         'topRight'
    });
    //that.burgerMenuDialog.dialogContent = that.burgerMenu;

    /*
        LOH 9/1/21 @ 1608
        there's a bug in noiceCoreUIElement that's not letting me set DOMElements
        on instantiation for the auto-generated getter/setters

        really it boils down to that the getters and setters appear to
        get setup *after* the html content is rendered?

        I dunno. gotta go pay rent at the storage unit. BRB
    */

    // hook for btnBurger
    that._DOMElements.btnBurger.addEventListener('click', function(evt){

        let tbox = that._DOMElements.btnBurger.getBoundingClientRect();
        that.burgerMenuDialog.append(that.DOMElement);
        let dbox = that.burgerMenuDialog._DOMElements.dialog.getBoundingClientRect();
        that.burgerMenuDialog.y = (tbox.bottom + 5);
        that.burgerMenuDialog.x = ((tbox.x - dbox.width) + (tbox.width/2) + 21 + 10);
    });
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
*/
loseFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){
        that._app.log(`${that._className} | loseFocus`);
        toot(true);
    }));
}




/*
    get the burgerMenu contents
*/
get burgerMenu(){
    let that = this;
    if (that._burgerMenu instanceof Element){
        return(that._burgerMenu);
    }else{
        that._burgerMenu = document.createElement('div');
        that._burgerMenu.className = 'burgerMenu';

        let burgerStyle = {
            display: 'grid',
            gridTemplateColumns: '1fr',
            placeItems: 'center'
        }
        Object.keys(burgerStyle).forEach( function(c){ that._burgerMenu.style[c] = burgerStyle[c]; } );

        // check for updates button
        let btnUpdate = document.createElement('button');
        btnUpdate.className = "btnUpdate";
        btnUpdate.textContent = 'check for updates';
        btnUpdate.addEventListener('click', function(evt){ that._app.checkForUpdates(evt); });
        that._burgerMenu.appendChild(btnUpdate);

        // reset button
        let btnReset = document.createElement('button');
        btnReset.className = "btnReset";
        btnReset.textContent = 'reset';
        btnReset.addEventListener('click', function(evt){ that._app.resetApp(evt); });
        that._burgerMenu.appendChild(btnReset);

        // export button
        let btnExport = document.createElement('button');
        btnExport.className = "btnExport";
        btnExport.textContent = 'export to file';
        btnExport.addEventListener('click', function(evt){ that._app.exportFile(evt); });
        that._burgerMenu.appendChild(btnExport);

        // import button
        let btnImport = document.createElement('button');
        btnImport.className = "btnImport";
        btnImport.textContent = 'import from file';
        btnImport.addEventListener('click', function(evt){ that._app.importFile(evt); });
        that._burgerMenu.appendChild(btnImport);

        return(that._burgerMenu);
    }
}




} // end noiceExamplePWAMainUI class
