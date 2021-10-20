class noiceARClientMainUI extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'noiceARClientMainUI',
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
        <div class="contentHeaderNote">
            select a form:
        </div>
        <div data-templatename="mainContent" data-templateattribute="true">${this.mainContent}</div>
    </div>
    <div class="ftrPanel" style="
        display:grid;
        grid-template-columns:1.5em auto;
    ">
        <div style="align-self:center">
            <img src="./gfx/reset-icon.svg" style="visibility:hidden; "/>
        </div>
        <div style="align-self:center;text-align:right;width:100%">
            <button class="btnCreate" data-templatename="btnCreate" style="display:none;">create</button>
            <button class="btnEdit" data-templatename="btnEdit" style="display:none;">edit</button>
        </div>
    </div>
<div>`
); }




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

    // hook for btnBurger
    that._DOMElements.btnBurger.addEventListener('click', function(evt){

        let tbox = that._DOMElements.btnBurger.getBoundingClientRect();
        that.burgerMenuDialog.append(that.DOMElement);
        let dbox = that.burgerMenuDialog._DOMElements.dialog.getBoundingClientRect();
        that.burgerMenuDialog.y = (tbox.bottom + 5);
        that.burgerMenuDialog.x = ((tbox.x - dbox.width) + (tbox.width/2) + 21 + 10);
    });

    // hook for create button
    that._DOMElements.btnCreate.addEventListener('click', function(){ that._app.screenHolder.switchUI('recordEditor'); });
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
    no particular reason for this redirect except to illustrate
    that you might want to have a local attribute so as to have
    either a completely custom burger menu, or to mutate the system
    global one
*/
get burgerMenu(){
    let that = this;
    if (! (that._burgerMenu instanceof Element)){
        that._burgerMenu = that._app.getBurgerMenu();
    }
    return(that._burgerMenu);
}





} // end noiceARClientMainUI class
