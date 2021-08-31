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
    grid-template-rows:2em minmax(1em, 100%) minmax(2em, 3em);
    width:100%;
    height:100%;
    color: rgba(240, 240, 240, .6);
">
    <div class="hdrPanel">
        <div class="left">
            <div class="hdrTitle" data-templatename="hdrTitle" data-templateattribute="true">${this.hdrTitle}</div>
            &nbsp;
            <div class="hdrMsg" data-templatename="hdrMsg" data-templateattribute="true">${this.hdrMsg}</div>
        </div>
        <div class="right">
        <button class="btnBurger" data-templatename="btnBurger" style="margin:.25em;">burger</button>
        </div>
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
*/


/*
    setupCallback()
*/
setupCallback(){
    let that = this;
    that._app.log(`${that._className} | setupCallback`);

    // hook for btnBurger
    that._DOMElements.btnBurger.addEventListener('click', function(evt){
        console.log("clicked the buger button!");
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




} // end noiceExamplePWAMainUI class
