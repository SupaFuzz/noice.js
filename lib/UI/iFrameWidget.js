class iFrameWidget extends noiceCoreUIScreen {

/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:               1,
            _className:             'iFrameWidget',
            _myRowHandles:          {},
            firstFocus:             true,
            debug:                  true,
        }, defaults),
        callback
    );

    this.focusCallback = async function(bool, focusArgs){ return(this.mySetFocus(bool, focusArgs)); }
} // end constructor




/*
    html getter
*/
get html(){

    let iFrame =
        `<div style="
            overflow:hidden;
            display: flex;
            flex-direction: column;
        ">
            <iframe src="${this.src}" width="auto" height="auto" style="
                flex-grow: 1;
                border: none;
                margin: 0;
                padding: 0;
            "></iframe>
        </div>`;
    if (this.isNull(this.src)){ iFrame = ''; }


    return(`
        <div class="main" style="
            width:              100%;
            height:             100%;
            display:            grid;
            grid-template-rows: 1em auto;
            margin: 0;
        ">
            <div class="hdr" style="
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                z-index: 999;
            ">
                <button class="_btnReturn" style="
                    background:				url('./gfx/back-arrow.svg');
                    background-repeat:		no-repeat;
                    background-position:	left;
                    background-size: 		contain;
                    opacity: 				.8;
                    padding-left:			1em;
                    font-weight:			normal;
                    color:					rgba(191, 191, 24, .75);
                    text-align: 			left;
                    align-self:             center;
                    border:                 none;
                    font-size:              .5em;
                ">Scan</button>
                &nbsp;
                <button class="_btnBurger" style="
                    background:				url('./gfx/burger.svg');
                    background-repeat:		no-repeat;
                    background-position:	right;
                    background-size: 		contain;
                    opacity: 				.8;
                    padding-left:			1em;
                    font-weight:			normal
                    color:					rgba(191, 191, 24, .75);
                    align-self:            center;
                    border:                none;
                    font-size:             .5em;
                    visibility:            hidden;
                ">&nbsp;</button>
            </div>
            ${iFrame}
        </div>
    `);
}


get src(){ return(this._src); }
set src(v){
    this._src = v;
    if (this.frame instanceof Element){ this.frame.src = this.src; }
}

/*
    setup()
    runs once on first focus
*/
async setup(){

    let that = this;

    this.frame = this.DOMElement.querySelector('iframe');

    this.daMainFrame = this.DOMElement.querySelector('.main');

    // hooke fore ye olde burger menu
    that.DOMElement.querySelectorAll('button._btnBurger').forEach(function(btn){
        btn.addEventListener('click', function(e){
            that.openBurgerUI(e);
        });
    });

    // and for the return button
    that.DOMElement.querySelectorAll('button._btnReturn').forEach(function(btn){
        btn.addEventListener('click', function(e){
            that._app.screenHolder.switchUI('noogle');
        });
    });

    /*
        most of the meaningful stuff happens in gainFocus on this one
        this is one-time setup, of course :-)
    */
    if (that.setupCallback instanceof Function){
        that.setupCallback(that);
    }

} // end setup()




/*
    openBurgerUI()
    this will have one and we will use it
    yeah verily

*/
openBurgerUI(evt){

    let that = this;
    let b = evt.target.getBoundingClientRect();


    // placeholder for now
    let t = document.createElement('div');
    t.className = 'amyWorkInProgress';
    t.style.fontSize = '.5em';
    t.style.paddingLeft = '10em';
    t.insertAdjacentHTML('afterbegin',
        `<span>to do list:</span><ul>
            <li>list goes here</li>
        </ul>`
    );
    //t.textContent = "workin' this too!";

    if (! (that.burgerUI instanceof noiceBalloonDialog)){
        that.burgerUI = new noiceBalloonDialog({
            templateElements: {
                title:          'user guide menu',
                hdrContent:     '',
                dialogContent:  t
            },
            x:     ((b.left - ((b.right - b.left) * (3/8))) + 5),
            y:     (b.bottom + 5)
        });
        that.burgerUI.DOMElement.dataset.arrow='top';

    }

    // open the not done yet dialog
    that.burgerUI.append(this.DOMElement);

}




/*
    handleRowSelect(selectedRowHandle)
*/
handleRowSelect(selectedRowHandle){
    let that = this;

    /*
        interesting idea would be to make
        handles for the differnt setions and
        use old school anchor links like a
        highly stylized faq
    */
}




/*
    leaveFocus()
    the UI is losing focus where it has previously had focus
*/
leaveFocus(){

    // insert shenanigans here
    this._app.headerMenu.visibility = 'visible';
}




/*
    gainFocus(focusArgs)
*/
gainFocus(focusArgs){
    let that = this;
    this._app.headerMenu.visibility = 'hidden';

    // there really shouldn't be much to do here
    if (that.widgetFocusCallback instanceof Function){
        that.widgetFocusCallback(that);
    }
}




/*
    receiveMessage(msg)
*/
async receiveMessage(msg){
    let that = this;

    /*
        OLD AND BUSTED - sorta
        stub for inter-UI messaging
        might still be useful for something
        leaving it in
    */

    return(true);
}




/*
    mySetFocus(self)
    the UI has changed focus, this is a hardcode focusCallback
*/
async mySetFocus(focus, focusArgs){
    let that = this;
    if (focus && (! this.focus)){

        /* gaining focus from a non-focussed state */

        // dispatch setup() on the first focus
        if (this.firstFocus){
            await this.setup().catch(function(e){
                /*
                    TO-TO: crash legit
                */
                that._app.log(`${that._className}/firstFocus setup returned error: ${e}`, true);
            });
            that.firstFocus = false;
        }
        this.gainFocus(focusArgs);
    }else if ((! focus) && this.focus){

        /* losing focus from a focussed state */
        this.leaveFocus(focusArgs);
    }
}






} // end class
