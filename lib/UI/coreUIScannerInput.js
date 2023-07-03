/*
    this implements a noiceCoreUIFormElementInput
    with all the scanner input parsing stuff tacked on
*/
class coreUIScannerInput extends noiceCoreUIFormElementInput {

/*
    LOH 1/24/21 @ 2031
    somehow the isTypingTimeout is failing globally

    the second try the isTypingTimeout fails to catch and hangs infinitely expecting more data from the gun
    this happens if you try twice on the same field
    or if you try a second time on a different field
*/

/*
    constuctor({
        parentUI:               <noiceCoreUIScreen> parent of the formElement (this is for dialog pos)
        isTypingCheckInterval:  <integerMicroSeconds> default: 150 (100 is 10 times a second)
        isTypingTimeout:        <integerMicroSeconds> default: 500 (half a second)
    })
*/
constructor(args, defaults, callback){

    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'coreUIScannerInput',
        debug:                  true,
        parentUI:               null,
        disableTypeahead:       false,
        _disableMenuButton:      false,
        setFromMenu:            false,
        captureValueOn:         'return',
        lastKeyPress:           0,
        isTyping:               false,
        rfidEchoResponses:      [],
        isTypingCheckInterval:  150, // 100 == 10 times a second
        isTypingTimeout:        500, // half a second,
        renderCallback:         function(selfRef){
            selfRef.DOMElement.addEventListener('keydown', function(evt){
                selfRef.lastKeyPress = selfRef.epochTimestamp(true);
            });
        },
    },defaults),callback);

    let that = this;

    //_app is required
    if (! (that._app instanceof noiceApplicationCore)){ throw("_app is a required parameter"); }

    // parentUI is also required
    if (! (that.parentUI instanceof noiceCoreUIScreen)){ throw("parentUI is a required parameter"); }

    //that.valueChangeCallback = function(n, o, s){ that.handleScannerInput(n, o, s); }
    that.dataStreamCallback = function(n, o, s){ that.handleScannerInput(n, o, s); }

}

/*
    override disabled setter because it's always disabled now
    (we only accept input from the menu)
*/
set edit(v){
    super.edit = false;
}
get edit(){ return(this._edit); }




/*
    setup()
*/
setup(){

    // get the parent class stuff
    super.setup();

    // nobody said anything about keepin' it neat LOL ...
    let that = this;
    let rfidField = this;

    // permanently disable that sucka
    let inp = that.DOMElement.querySelector('input')
    inp.disabled = true;

    // mutate the standard CSS layout for the formElement

    rfidField.formElement.classList.add('ncuFormElementField');

    let fieldSection = rfidField.DOMElement.querySelector('div.ncufeFieldSection');
    fieldSection.style.display = "grid";
    fieldSection.style.gridTemplateColumns = 'auto 2em';
    fieldSection.style.alignItems = 'center';

    // setup the button container and button
    let btnContainer = document.createElement('div');
    btnContainer.className = "fieldBtnContainer";
    let btn = document.createElement('button');
    btn.className = 'btnMenu';
    //btn.style.visibility = (that._app.unassignedTags.length > 0)?'visible':'hidden';
    btn.style.visibility = 'hidden';
    rfidField.menuButton = btn;

    // make the unassignedTagMenu
    that.unassignedTagMenu = new unassignedTagMenu({
        _app: that._app,
        dirtyTags: that._app._dirtyTags,
        selectItemCallback: function(tag, el, selfRef){
            return(new Promise(function(t, b){

                //handle unassignedTagMenu item select here
                rfidField.setFromMenu = true;
                rfidField.value = tag;
                rfidField.setFromMenu = false;
                rfidField.unassignedTagMenu.remove();

                t(true);
            }));
        },
        useAnywayCallback: function(selfRef){
            return(new Promise(function(t,b){

                /*
                    useAnywayCallback (value, unassignedTagMenuReference, coreUIScannerInputReference)
                    must return a promise resolving to the value to use (including null if you need that)
                */
                if (that.useAnywayCallback instanceof Function){
                    let callbackError = false;
                    that.useAnywayCallback(selfRef.addRowUISearchField.value, selfRef, that).catch(function(error){
                        callbackError = true;
                        that._app.log(`${that._className} | useAnywayCallback | threw unexpectedly: ${error}`);
                    }).then(function(value){
                        // check callbackError if you need to but either way we're closing the useAnywayU
                        if (! callbackError){
                            rfidField.setFromMenu = true;
                            rfidField.value = value;
                            rfidField.setFromMenu = false;
                        }
                        rfidField.unassignedTagMenu.remove();
                        t(true);
                    });
                }else{
                    rfidField.setFromMenu = true;
                    rfidField.value = selfRef.addRowUISearchField.value;
                    rfidField.setFromMenu = false;
                    rfidField.unassignedTagMenu.remove();
                    t(true);
                }
                //console.log(`${that._className} | unassignedTagMenu | use tag anyway: ${selfRef.addRowUISearchField.value}`)
            }));
        }
    });
    that.unassignedTagMenu.DOMElement.dataset.arrow = 'topRight';

    // open unassignedTagMenu from the new button
    btn.addEventListener('click', function(evt){

        // holy shit this is so damn fussy! but think it's the best I can do for now
        let b = that.DOMElement.getBoundingClientRect();
        that.unassignedTagMenu.y = (b.bottom + 5);
        that.unassignedTagMenu.append(that.parentUI.DOMElement);
        let e = btn.getBoundingClientRect();
        let c = that.unassignedTagMenu.dialogContainer.getBoundingClientRect();
        that.unassignedTagMenu.x = (b.right - (c.width + (e.width/2) ));

    });

    /*OLD AND BUSTED
    // hook for the menu button
    btn.addEventListener('click', function(evt){

        // instantiate the unassignedTagMenu if we don't have one already
        if (! (rfidField.unassignedTagMenu instanceof noiceBalloonDialog)){

            let btnContainer = document.createElement('div');
            btnContainer.className = 'btnContainer';

            rfidField.unassignedTagMenuContent = null;
            rfidField.unassignedTagMenu = new noiceBalloonDialog({
                templateElements: {
                    title:          'select unassigned tag',
                    hdrContent:     btnContainer,
                    dialogContent:  ''
                },
                renderCallback: function(selfRef){

                    // spawn the tagList container
                    rfidField.unassignedTagMenuContent = selfRef.DOMElement.querySelector(`.dialogContent`);
                    rfidField.unassignedTagMenuContent.tagOptions = document.createElement('div')
                    rfidField.unassignedTagMenuContent.className = 'tagList';
                    rfidField.unassignedTagMenuContent.classList.add('dialogContent');
                    rfidField.unassignedTagMenuContent.style.gridTemplateColumns = '1fr';
                    rfidField.unassignedTagMenuContent.style.placeItems = 'start';
                    rfidField.unassignedTagMenuContent.style.maxHeight = '33vh';
                },
                exitCallback: async function(){
                    // if you need to put anything away ... I don't think I do. do I? leaving it here just in case
                }
            });
            rfidField.unassignedTagMenu.DOMElement.classList.add('tagList');
            rfidField.unassignedTagMenu.DOMElement.dataset.arrow ='topRight';
        }

        // set up the new hotness search box
        let t = rfidField.unassignedTagMenu.DOMElement.querySelector(`div.btnContainer`);
        if (!(rfidField.addRowUISearchField instanceof noiceCoreUIFormElementInput)){
            rfidField.addRowUISearchField = new noiceCoreUIFormElementInput({
                id:                 'addRowUISearchField',
                maxLength:          25,
                label:              'search tags',
                labelLocation:      'embed',
                valueLength:        'auto',
                captureValueOn:     'focusoutOrReturn',
                valueChangeCallback: function(newVal, oldVal, selfReference){

                    // hide every miniRowHandle that doesn't match newVal
                    if (that.isNotNull(newVal)){
                        if (that.wtf instanceof Array){
                            that.wtf.forEach(function(el){
                                let str = el.querySelector('span.rfidShortTag').textContent;
                                if (that.isNotNull(str.match(newVal))){
                                    el.style.display = 'block';
                                    el.dataset.removed = 'false';
                                }else{
                                    el.style.display = 'none';
                                    el.dataset.removed = 'true';
                                    //el.style.opacity = 0;
                                }
                            });
                        }

                        // NOTE 4/28/21 @ 1220 -- porting use anyhow button
                        if (rfidField.unassignedTagMenuContent.querySelectorAll(`.miniRowHandle[data-removed='false']`).length == 0){
                            rfidField.unassignedTagMenuContent.appendChild(rfidField.btnUseAnyHow);
                        }else{
                            rfidField.btnUseAnyHow.remove();
                        }



                    }else{

                        if (that.wtf instanceof Array){
                            that.wtf.forEach(function(el){
                                el.style.display = 'block';
                                el.dataset.removed = 'false';
                            });
                        }
                        rfidField.btnUseAnyHow.remove();
                    }

                    return(newVal);
                }
            }).append(t);

            // create the add anyhow button
            rfidField.btnUseAnyHow = document.createElement('button');
            rfidField.btnUseAnyHow.className = "btnUseAnyHow";
            rfidField.btnUseAnyHow.textContent = 'use tag anyway >>';
            that.btnUseAnyHow.addEventListener('click', function(clickEvent){

                //
                //    NEW HOTNESS 6/14/21 @ 1709
                //    async useAnyhowCallback(useAnyhowValue, selfReference)

                //    must return a promise. if the promise throws, we abort the
                //    useAnyhow. Otherwise we will write the value returned by
                //    the resolved promise to the field.

                if (that.useAnyhowCallback instanceof Function){
                    let callbackError = false;
                    that.useAnyhowCallback(rfidField.addRowUISearchField.value, that).catch(function(error){
                        callbackError = true;
                        that._app.log(`${that._className} | use tag anyway (clickhandler) | useAnyhowCallback threw, aborting value set: ${error}`);
                    }).then(function(useAnyhowValue){
                        if (! callbackError){
                            rfidField.formElement.value = useAnyhowValue;
                        }
                        rfidField.unassignedTagMenu.remove();
                        clickEvent.target.parentElement.remove();
                    })

                }else{
                    rfidField.formElement.value = rfidField.addRowUISearchField.value;
                    rfidField.unassignedTagMenu.remove();
                    clickEvent.target.parentElement.remove();
                }



                // busted
                // let guh = {};
                //guh[that._app.config.inventoryColumnIndex['rfid.tagNumber'].id] = that.addRowUISearchField.value;
                //let rowHandleTmp = that.spawnNewRecord(guh);
                //that.addRowUI.remove();
                //that.handleRowSelect(rowHandleTmp).then(function(){
                //    that.addRowUI.remove();
                //});

            });

            // straight gangsta
            rfidField.addRowUISearchField.formElement.addEventListener('focusin', function(evt){
                if (that.isNotNull(evt.target.value)){
                    evt.target.value = '';

                    // NOTE FOR LATER: clear previous filter here
                }
            });
        }
        rfidField.addRowUISearchField.value = null;
        rfidField.addRowUISearchField.captureValue({type: 'focusout'});




        // new asynchronous hotness
        let center;
        try {
            center = that._app.getAppData('registeredUserCenter');
        }catch(e){
            that._app.log(`${this._className} | open tagMenu callback | cannot get registeredUserCenter: ${e}`);
            center = null;
        }
        let tagFetchError = false;
        that._app.getUnassignedTags(center, false).catch(function(error){
            that._app.log(`${this._className} | open tagMenu callback | main thread/getUnassignedTags threw unexpectedly: ${error}`);
            tagFetchError = true;
        }).then(function(tags){

            // render the lil unassigned tag menu
            rfidField.unassignedTagMenuContent.innerHTML = '';


            if ((tagFetchError) || (tags.length == 0)){
                // no tags
                rfidField.menuButton.style.visibility = 'hidden';

            }else{

                rfidField.menuButton.style.visibility = 'visible';

                // some tags
                that.wtf = [];
                tags.forEach(function(tag){
                    // skip the selected one
                    if (that.isNotNull(that.value) && (that.value == tag)){ return(false); }

                    let t = that._app.config.strTypes.rfid.formatter(tag);
                    t.className = 'miniRowHandle';
                    t.classList.add('scannerInput');
                    t.dataset.removed = 'false';

                    t.addEventListener('click', function(evt){
                        rfidField.setFromMenu = true;
                        rfidField.value = evt.target.parentElement.textContent;
                        rfidField.setFromMenu = false;
                        rfidField.unassignedTagMenu.remove();
                        evt.target.parentElement.remove();
                    });
                    that.wtf.push(t);
                    rfidField.unassignedTagMenuContent.appendChild(t);
                });

            }
        });

        // NEW HOTNESS
        let box = rfidField.DOMElement.getBoundingClientRect();
        rfidField.unassignedTagMenu.append(rfidField.parentUI.DOMElement);

        rfidField.unassignedTagMenu.width = `${box.width}px`;
        rfidField.unassignedTagMenu.x     = box.left + 11;
        rfidField.unassignedTagMenu.y     = box.bottom + 11;

    });

    END OLD AND BUSTED */

    // setup the pieChart progress indicator
    let pie = new noicePieChart({
        showPieChart: true,
        pieCharts: [ {name:'searching', fill:'rgba(191, 191, 24, 1)', stroke:'rgba(191, 191, 24, 1)', strokeWidth:'2px'} ],
        flop: false,
        animationCallback:  function(selfRef){
            selfRef.updatePieChart('searching', (((selfRef._animationFrame%200)/200)*100));
        },
        animationStartCallback: function(selfRef){
            selfRef.showPieChart = true;
            selfRef.updatePieChart('searching', 0);
        },
        animationExitCallback: function(selfRef){
            window.requestAnimationFrame(function(){
                selfRef.showPieChart = false;
                selfRef.updatePieChart('searching', 0);
            });
        }
    });
    let necessaryStyle = {
        display:        'none',
        position:       'absolute',
        zIndex:         '10'
    }
    Object.keys(necessaryStyle).forEach(function(a){ pie.DOMElement.style[a] = necessaryStyle[a]; });
    pie.append(btnContainer);
    rfidField.pie = pie;
    rfidField.btnContainer = btnContainer;

    // stick 'em in there
    btnContainer.appendChild(btn);
    fieldSection.appendChild(btnContainer);

    // setup the typeahead menu of unassigned tags
    that.syncTagMenu();

    // toggle the menu button
    that.setupMenuButton();
}




/*
    syncTagMenu()
*/
syncTagMenu(){
    let that = this;
    let values = []

    /* old and busted synchrony
    this._app.unassignedTags.forEach(function(rowHandle){
        values.push(rowHandle.recordIdentifier.textContent);
    });
    /*

    /* new async hotness */
    if (!(that.disableTypeahead === true)){
        let center;
        try {
            center = that._app.getAppData('registeredUserCenter');
        }catch(e){
            that._app.log(`${this._className} | open syncTagMenu callback | cannot get registeredUserCenter: ${e}`);
            center = null;
        }
        let tagFetchError = false;
        that._app.getUnassignedTags(center, false).catch(function(error){
            that._app.log(`${this._className} | open tagMenu callback | main thread/getUnassignedTags threw unexpectedly: ${error}`);
            tagFetchError = true;
        }).then(function(tags){
            if ((! tagFetchError) && (tags instanceof Array)){
                tags.forEach(function(v){ values.push(v); });
                that.values = values;
            }
        });
    }
}




/*
    setupMenuButton()
*/
setupMenuButton(){
    let that = this;
    let tagFetchError = false;
    if (that.disableMenuButton == true){
        that.menuButton.style.visibility = 'hidden';
    }else{

        let center;
        try {
            center = that._app.getAppData('registeredUserCenter');
        }catch(e){
            that._app.log(`${this._className} | open syncTagMenu callback | cannot get registeredUserCenter: ${e}`);
            center = null;
        }

        that._app.getUnassignedTags(center, false).catch(function(error){
            that._app.log(`${this._className} | setupMenuButton | main thread/getUnassignedTags threw unexpectedly: ${error}`);
            tagFetchError = true;
        }).then(function(tags){
            if ((! tagFetchError) && (tags instanceof Array) && (tags.length > 0)){
                that.menuButton.style.visibility = 'visible';
            }else{
                that.menuButton.style.visibility = 'hidden';
            }
        });
    }
}

get disableMenuButton(){ return(this._disableMenuButton); }
set disableMenuButton(v){
    this._disableMenuButton = (v === true);
    if (this.menuButton instanceof Element){
        let wtff = this.menuButton;
        let that = this;

        // holy shit ... yes there is spaghetti out there and we're doin' a flyover
        setTimeout(function(){
            wtff.style.visibility = (that.disableMenuButton)?"hidden":"visible";
        }, 50);
    }
}



/*
    handleScannerInput(newValue, oldValue, selfReference)
*/
handleScannerInput(newValue, oldValue, selfReference){

    let that = this;
    if (that.isNotNull(newValue)){
        if (! selfReference.isTyping){
            selfReference.isTyping = true;

            selfReference.menuButton.style.visibility = 'hidden';
            selfReference.pie.DOMElement.style.display = 'block';
            selfReference.pie.runAnimation = true;
            selfReference.pie.badgeTxt = '0';

            // clearing the table
            selfReference.rfidEchoResponses = [];
            selfReference.timer = null;

            new Promise(function(toot, boot){
                selfReference.timer = setInterval(function(){
                    if ((selfReference.lastKeyPress > 0) && ((that.epochTimestamp(true) - selfReference.lastKeyPress) > selfReference.isTypingTimeout)){ toot(true); }
                }, selfReference.isTypingCheckInterval);
            }).catch(function(error){
                selfReference.menuButton.style.visibility = 'visible';
                selfReference.pie.DOMElement.style.display = 'none';
                selfReference.isTyping = false;
                selfReference.pie.runAnimation = false;
                selfReference.pie.badgeTxt = null;
                that._app.log(`${that._className} | scannerInputCallback |  isTyping timer promise threw unexpectedly? ${error}`, true);
            }).then(function(){

                // NOTE: this is cleanup after the typing timeout has expired :)
                selfReference.isTyping = false;

                // let the main app thread sort 'em out
                that._app.handleScannerInput(selfReference.rfidEchoResponses).then(function(){
                    selfReference.pie.DOMElement.style.display = 'none';
                    selfReference.menuButton.style.visibility = 'visible';
                    selfReference.pie.runAnimation = false;
                    selfReference.pie.badgeTxt = null;

                    // OLD AND BUSTED
                    //selfReference.value = null;

                    // NEW HOTNESS
                    selfReference.setFromMenu = true;
                    selfReference.value = (selfReference.rfidEchoResponses.length == 1)?selfReference.rfidEchoResponses[0]:null;
                    selfReference.setFromMenu = false;

                    selfReference.formElement.blur();
                    selfReference.menuButton.style.visibility = (that._app.unassignedTags.length > 0)?'visible':'hidden';

                    // UPDATE typeahead VALUES
                    let values = [];
                    that._app.unassignedTags.forEach(function(rh){ values.push(rh.recordIdentifier.textContent); });
                    that.values = values;
                }).catch(function(err){
                    that._app.log(`${that._className} | handleScannerInput | app.handleScannerInput threw unexpectedly: ${err}`);
                });
            });
        }
        let len = 0;
        if (that.isNotNull(oldValue)){ len = oldValue.length; }
        if (newValue.length > len){
            selfReference.rfidEchoResponses.push(newValue.substring(oldValue?oldValue.length:0));
        }else{
            selfReference.rfidEchoResponses.push(newValue);
        }
        selfReference.pie.badgeTxt = selfReference.rfidEchoResponses.length;
    }
}




/*
    value setter override
    we've gotta do this so we can abstract valueChangeCallback() so that we can still
    do scanner shenannigans but also hook into for instance an auto-generated formView valueChangeCallback

    OK ... doing this even just piping it through to super.value ... still fucks it up?
    how?

set value(v){
    let vt = v;

    if (! (this.valueChangeCallbackOverride === true)){
        if (this.hasAttribute('valueChangeCallback') && (this.valueChangeCallback instanceof Function)){



            if (!((this.labelLocation == 'embed') && (
                (vt == this.label)
            ))){
                let that = this;
                try {
                    let tmp = this.valueChangeCallback(vt, this._value, that);
                    if (this.isNotNull(tmp)){ vt = tmp; }
                }catch(e){
                    throw(new noiceException({
                        message:        `${this._className}/value setter (callback) threw an error: ${e.toString()}`,
                        messageNumber:   420,
                        thrownBy:       `${this._className}/value setter (callback)`
                    }));
                }
            }
        }
    }
    this._value = vt;

    if ((this.formElement instanceof Element) && (this.formElement.value != v)){
        this.formElement.value = v;
    }
    this.toggleDefaultValueStyle();
}
*/




/*
    LOH 1/23/21 @1759
    copy pasted out of the UI test harness.
    next step is to throw it back in there and see if we can make
    a legit one alongside the prototype

    then to see if we can drop-kick it into everywhere else by setting
    up the formElement alias and the config

    UPDATE 1/24/21 @ 1958
    it passes syntax at least! lesse if we can make one?

    UPDATE 1/24/21 @ 2126
    this works! next up is to figgure out how to drop-kick it into all the instances of rfidTagNumber
    we can map in noiceCoreUIFormView/getFormElement() and change it in the config. The tricky parts
    are that this requires a few things:

        * delete maxLength from the config prior to instantiate
        * _app
        * parentUI

    LOH 1/24/21 @ 2349 -- done for tonight
    setting the fieldType in the config does work, but the formView
    overrides the valueChangeCallback which causes a problem for our handling
    we need to hijack the valueChangeCallback, do our own thing in the subclass
    then call the actual valueChangeCallback

    project for tomorrow.
    also putting it into the clone view, which should be a breeze by comparison




*/


} // end class
