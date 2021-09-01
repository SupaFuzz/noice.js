/*
    noiceBalloonDialog.js

    this implements a full screen modal dialog
    that looks something like this:

        _____/\________________________
        |  <title>  | <hdrContent>      |
        --------------------------------
        |                               |
        |      <dialogContent>          |
        |                               |
        |                               |
        ---------------------------------

    I'll write the docs as I go.
    hold my white claw ...

    element accessors:
        * title
        * hdrContent
        * dialogContent
    positioning accessors:
        * x
        * y
        * right
        * bottom
        * width
        * arrow
    workflow accessors:
        * allowExit

*/
class noiceBalloonDialog extends noiceCoreUIElement {




/*
    constructor
*/
constructor(args, defaults, callback){

    // instantiate
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:                   2,
        _className:                 'noiceBalloonDialog',
        _x:                         null,
        _y:                         null,
        _right:                     null,
        _bottom:                    null,
        _width:                     'auto',
        _arrow:                     'topRight',
        _allowExit:                 true
    },defaults),callback);

    this.setup();

} // end constructor




/*
    html getter
*/
get html(){return(
    `<div class="dialog" data-templatename="dialog" style="
        display: grid;
        grid-template-columns: 1fr;
        place-items:center;
     ">
        <div class="body">
            <div class="dialogHeader" style="
                display: grid;
                grid-template-columns: auto 5em;
                width:100%;
                border-color:transparent;
                border-width:0;
            ">
                <span class='dialogHeaderTitle' data-templatename="title" data-templateattribute="true" style="align-self: center;">${this.title}</span>
                <div class='dialogHeaderBtnFrame' data-templatename="hdrContent" data-templateattribute="true">${this.hdrContent}</div>
            </div>
            <div class='dialogContent' data-templatename="dialogContent" data-templateattribute="true" style="width:auto;height:auto;">${this.dialogContent}</div>
        </div>
    </div>`
)};




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

    // init positioning props if we have 'em'
    ['x', 'y', 'right', 'bottom', 'width', 'arrow'].forEach(function(attr){ this[attr] = this[attr]; }, this);

    // setup exit listener & override
    let that = this;
    that.bodyClickListener = this.getEventListenerWrapper(function(evt){ that.bodyClickHandler(evt); });
    this._DOMElements.dialog.addEventListener('click', that.bodyClickListener);

    that.exitClickListener = this.getEventListenerWrapper(function(evt){ that.exitClickHandler(evt); });
    that.DOMElement.addEventListener('click', that.exitClickListener);

}




/*
    positioning
*/
get x(){ return( this._x); }
set x(v){
    if ((this._DOMElements.dialog instanceof Element) && (! (isNaN(parseInt(v))))){
        if (this._DOMElements.dialog.style.position != 'absolute'){ this._DOMElements.dialog.style.position = 'absolute'; }
        this._DOMElements.dialog.style.left = `${v}px`;
    }
    this._x = v;
}
get y(){ return( this._y); }
set y(v){
    if ((this._DOMElements.dialog instanceof Element) && (! (isNaN(parseInt(v))))){
        if (this._DOMElements.dialog.style.position != 'absolute'){ this._DOMElements.dialog.style.position = 'absolute'; }
        this._DOMElements.dialog.style.top = `${v}px`;
    }
    this._y = v;
}
get right(){ return( this._right); }
set right(v){
    if ((this._DOMElements.dialog instanceof Element) && (! (isNaN(parseInt(v))))){
        if (this._DOMElements.dialog.style.position != 'absolute'){ this._DOMElements.dialog.style.position = 'absolute'; }
        this._DOMElements.dialog.style.right = `${v}px`;
    }
    this._right = v;
}
get bottom(){ return( this._bottom); }
set bottom(v){
    if ((this._DOMElements.dialog instanceof Element) && (! (isNaN(parseInt(v))))){
        if (this._DOMElements.dialog.style.position != 'absolute'){ this._DOMElements.dialog.style.position = 'absolute'; }
        this._DOMElements.dialog.style.bottom = `${v}px`;
    }
    this._bottom = v;
}
get width(){ return(this._width); }
set width(v){
    if (this._DOMElements.dialog instanceof Element){
        if (this._DOMElements.dialog.style.position != 'absolute'){ this._DOMElements.dialog.style.position = 'absolute'; }
        this._DOMElements.dialog.style.width = `${v}`;
    }
    this._width = v;
}
get arrow(){ return(this._arrow); }
set arrow(v){
    this._arrow = v;
    if (this.DOMElement instanceof Element){ this.DOMElement.dataset.arrow = this.arrow; }
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
