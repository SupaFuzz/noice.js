/*
    this implements a full screen modal dialog
    more or less laid out like this:

        -----------------------------^------
        | <message>                  |    |
        |---------------------------------|

    the rest is up to you in external CSS
*/
class installHelpDialog extends noiceCoreUIOverlay{

/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'installHelpDialog',
        _title:                 'startup',
        _message:               'install me',
        _runAnimation:          false,
        _animationFrame:        0,
        headingClass:           'ihHeadingClass',
        contentClass:           'ihHeadingContentClass',
        messageContainerClass:  'ihHeadingMessageClass'
    },defaults),callback);

    this.setup();
} // end constructor


/*
    html getter
*/
get html(){

    return(`
        <div class="ihDialog" style="display:grid;grid-template-columns:72px auto;border-color:transparent;">
            <div class="gfx" style="padding:.25em;display:grid;grid-template-columns:1fr;place-items:center;">&nbsp;</div>
            <div class="${this.messageContainerClass}">
                <p class="msg">Install this webapp on your iPad: tap
                <img src="./gfx/iOS_share_system_new.svg" style="vertical-align:middle;margin-bottom:.5em;"/> and then <strong>Add to homescreen</strong> <img src="./gfx/iOS_add_system_new.svg" style="vertical-align:middle;" /><br />
                <a href="./USER_GUIDE_NEW.html" target="new">user guide</a>
            </div>
        </div>
    `);
}

/* getters n setters */
get title(){ return(this._title); }
set title(v){
    this._title = v;
    if (this.titleDOMObject instanceof Element){ this.titleDOMObject.textContent = this._title; }
}
get message(){ return(this._message); }
set message(v){
    this._message = v;
    if (this.messageDOMObject instanceof Element){ this.messageDOMObject.textContent = this._message; }
}




/*
    animation hooks
*/
get runAnimation(){ return(this._runAnimation); }
set runAnimation(v){
    let that = this;
    let tmp = (v===true);
    if ((! this._runAnimation) && tmp){

        /*
            starting from a previously stopped state
        */

        // init
        this._animationFrame = 0;
        if (this.hasOwnProperty('animationStartCallback') && (this.animationStartCallback instanceof Function)){
            try {
                this.animationStartCallback(that);
            }catch(e){
                throw(`runAnimation / animationStartCallback threw unexpected error: ${e}`, e);
            }
        }

        // start the animation if we've got an animationCallback
        if ((this.hasOwnProperty('animationCallback')) && (this.animationCallback instanceof Function)){
            this.startAnimation();
        }

    }else if (this._runAnimation && (! tmp)){
        /*
            stopping from a previously stopped state
        */
        if (this.hasOwnProperty('animationExitCallback') && (this.animationExitCallback instanceof Function)){
            try {
                that.animationExitCallback(that);
            }catch(e){
                throw(`runAnimation / animationExitCallback threw unexpected error: ${e}`, e);
            }
        }

    }
    that._runAnimation = tmp;
}
async startAnimation(){
    let that = this;
    await new Promise(function(toot, boot){
        window.requestAnimationFrame(function(){
            try {
                that._animationFrame ++;
                that.animationCallback(that);
                toot(true);
            }catch(e){
                boot(`animationCallback threw unexpectedly: ${e}`, e);
            }
        });
    }).catch(function(error){
        that.runAnimation = false;
        throw(`startAnimation / animationCallback threw unexpectedly ${error}`, error);
    });
    if (that.runAnimation){
        that.startAnimation();
    }else{
        return(true);
    }
}




/*
    setup()
*/
setup(){

    // snag needed DOM Elements
    //this.messageDOMObject        = this.DOMElement.querySelector(`.${this.messageContainerClass} .msg`);

    // "it's like this and like that and like this, and uh" -- Snoop
    let that = this;

    /* setup callbacks for the buttons -- well I mean, there aren't any but for completeness ...
    this.DOMElement.querySelector('#btnInventoryStart').addEventListener('click', function(e){
        if (that.startButtonCallback instanceof Function){ that.startButtonCallback(that, e); }
    });
    */

    // init DOM values that have getter/drsetters
    ['title', 'message'].forEach(function(at){ this[at] = this[at]; }, this);


}


} // end ihDialog class
