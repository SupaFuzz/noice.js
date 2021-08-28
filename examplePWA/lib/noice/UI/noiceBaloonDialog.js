/*
    noiceBalloonDialog.js

    this implements a full screen modal dialog
    that looks something like this:

        _____/\________________________
        |  <title>  | <arbitrary>       |
        --------------------------------
        |                               |
        |      <arbitrary content>      |
        |      <a menu, perhaps?>       |
        |                               |
        ---------------------------------

    I'll write the docs as I go.
    hold my white claw ...
*/
class noiceBalloonDialog extends noiceCoreUITemplate {


/*
    constructor
*/
constructor(args, defaults, callback){

    // instantiate
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:                   1,
        _className:                 'noiceBalloonDialog',
        _x:                         null,
        _y:                         null,
        _right:                     null,
        _bottom:                    null,
        _width:                     'auto',
        _allowExit:                 true,
        templateElements: {
            title:          null,
            hdrContent:     null,
            dialogContent:  null
        },
        selectCallback:        null,
        rowData:               null,
    },defaults),callback);

    // setup a guid
    this.guid = this.getGUID();
    this.DOMElement.dataset.guid = this.guid;

    this.setup();

} // end constructor


/*
    setup()
*/
setup(){

    // make the DOMElement container a modal full-screen overlay
    let myNecessaryStyle = {
        position:       'absolute',
        overflow:       'hidden',
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'center',
        width:          '100%',
        height:         '100%',
        left:           '0',
        top:            '0',
        zIndex:         '8'
    };
    Object.keys(myNecessaryStyle).forEach(function(k){ this.DOMElement.style[k] = myNecessaryStyle[k]; }, this);

    // initialize all of the templateElements now that we know we're rendered, etc
    Object.keys(this.templateElements).forEach(function(templateElementName){
        this[templateElementName] = this[templateElementName];
    }, this);

    // snag important stuff
    this.dialogDOMElement = this.DOMElement.querySelector('div.dialog');

    // init coordinates if we have 'em'
    ['x', 'y', 'right', 'bottom', 'width'].forEach(function(attr){ this[attr] = this[attr]; }, this);

    // setup exit listener & override
    let that = this;
    that.bodyClickListener = this.getEventListenerWrapper(function(evt){ that.bodyClickHandler(evt); });
    this.dialogDOMElement.addEventListener('click', that.bodyClickListener);

    that.exitClickListener = this.getEventListenerWrapper(function(evt){ that.exitClickHandler(evt); });
    that.DOMElement.addEventListener('click', that.exitClickListener);

}







/*
    html getter
*/
get html(){return(
    `<div class="dialog" style="display: grid; grid-template-columns: 1fr; place-items:center;">
        <div class="body">
            <div class="dialogHeader" style="display: grid; grid-template-columns: auto 5em; width:100%; border-color:transparent; border-width:0;">
                <span class='dialogHeaderTitle ${this.templateElementClassName}' data-fieldname="title" style="align-self: center;">${this.title}</span>
                <div class='dialogHeaderBtnFrame ${this.templateElementClassName}' data-fieldname="hdrContent">${this.hdrContent}</div>
            </div>
            <div class='dialogContent ${this.templateElementClassName}' data-fieldname="dialogContent" style="width:100%;height:100%;">${this.dialogContent}</div>
        </div>
    </div>`
)};




/*
    positioning
*/
get x(){ return( this._x); }
set x(v){
    if ((this.dialogDOMElement instanceof Element) && (! (isNaN(parseInt(v))))){
        if (this.dialogDOMElement.style.position != 'absolute'){ this.dialogDOMElement.style.position = 'absolute'; }
        this.dialogDOMElement.style.left = `${v}px`;
    }
    this._x = v;
}
get y(){ return( this._y); }
set y(v){
    if ((this.dialogDOMElement instanceof Element) && (! (isNaN(parseInt(v))))){
        if (this.dialogDOMElement.style.position != 'absolute'){ this.dialogDOMElement.style.position = 'absolute'; }
        this.dialogDOMElement.style.top = `${v}px`;
    }
    this._y = v;
}
get right(){ return( this._right); }
set right(v){
    if ((this.dialogDOMElement instanceof Element) && (! (isNaN(parseInt(v))))){
        if (this.dialogDOMElement.style.position != 'absolute'){ this.dialogDOMElement.style.position = 'absolute'; }
        this.dialogDOMElement.style.right = `${v}px`;
    }
    this._right = v;
}
get bottom(){ return( this._bottom); }
set bottom(v){
    if ((this.dialogDOMElement instanceof Element) && (! (isNaN(parseInt(v))))){
        if (this.dialogDOMElement.style.position != 'absolute'){ this.dialogDOMElement.style.position = 'absolute'; }
        this.dialogDOMElement.style.bottom = `${v}px`;
    }
    this._bottom = v;
}
get width(){ return(this._width); }
set width(v){
    if (this.dialogDOMElement instanceof Element){
        if (this.dialogDOMElement.style.position != 'absolute'){ this.dialogDOMElement.style.position = 'absolute'; }
        this.dialogDOMElement.style.width = `${v}`;
    }
    this._width = v;
}



/*
    allowExit
*/
get allowExit(){ return(this._allowExit); }
set allowExit(v){ this._allowExit = (v === true); }


/*
    bodyClickHandler()
    primarily this is here to preventDefault() when allowExit is on'
    NOTE: are you troubleshooting something? --> setDOMAttribute CLONES yo :-)
*/
bodyClickHandler(evt){
    if (this.allowExit){
        evt.stopPropagation();
    }
}

/*
    exitClickHandler()
    closes the dialog when it loses focus if allowExit is on
*/
exitClickHandler(evt){
    let that = this;
    if (this.allowExit){
        if (this.exitCallback instanceof Function){
            this.exitCallback().then(function(){ that.remove(); });
        }else{
            this.remove();
        }
    }
}



} // end noiceBalloonDialog
