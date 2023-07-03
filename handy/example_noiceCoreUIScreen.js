/*
    an example subclass of nocieCoreUIScreen

    attributes:
        * title
        * body

    you can set these attributes to a string value
    or you can send an Element to insert more elaborate
    content.

    elements in the html getter defining a value for data-templatename
    have element references inserted to this._DOMElements so it
    is important to give these distinct names

    elements in the html getter that define data-templateattribute="true"
    in addition to a unique name on data-templatename get automatically
    generated object attribute accessors.

    firstFocusCallback(), if defined, will fire the first time the UI
    is given focus

    gainFocus() fires before the UI gains focus.

    loseFocus() fires before the UI loses focus.

    all three of these can cancel the focus change by resolving the
    returned promise to a fault.

    onScreenCallback is called whenever the UI is shown on-screen
    this can be handy for manhandling UI layouts when necessary

*/
class noiceExampleUI extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'noiceExampleUI',
            title:          'default title',
            body:           'default body'
        }, defaults),
        callback
    );


} // end constructor




/*
    html
*/
get html(){ return(
`<div class="exampleUI" style="
    display:grid;
    grid-template-columns: 1fr;
    place-items: center;
    width:100%;
    height:100%;
">
    <h1 data-templatename="title" data-templateattribute="true">${this.title}</h1>
    <p data-templatename="body" data-templateattribute="true">${this.body}</p>
    <button data-templatename="btnExample">example button</button>
<div>`
); }




/*
    setupCallback()
    this gets called from the constructor, and throwing here will
    abort object construction. This is called after render, however
    so automatic object accessors from the html template are available
    hangeth thine hooks here, yo
*/
setupCallback(){
    let that = this;
    that._app.log(`${that._className} | setupCallback`);

    // hook for the example button
    that._DOMElements.btnExample.addEventListener('click', function(evt){
        console.log("clicked the button!");
    });
}




/*
    onScreenCallback()
    is called each time the UI is shown on-screen
    throwing here has no effect.
*/
onScreenCallback(){
    let that = this;
    that._app.log(`${that._className} | onScreenCallback`);
}



/*
    firstFocusCallback(focusArgs)
    is called before the first time the UI is given focus, this is
    called first, THEN the gainFocus function is called.
    if you throw or boot the promise, this will abort the
    focus change
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
    is called before each time the UI is given focus.
    boot it to abort the focus change
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
    is called before each time the UI loses focus.
    boot it to abort the focus change
*/
loseFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){
        that._app.log(`${that._className} | loseFocus`);
        toot(true);
    }));
}




} // end noiceExampleUI class
