/*
    trying to make something like a tabset
*/
class formElementMultipleUIScreen extends noiceCoreUIScreen {

/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'formElementMultipleUIScreen',
            firstFocus:     true
        }, defaults),
        callback
    );


    this.focusCallback = async function(self){ return(this.mySetFocus(self)); }
}


/* override html getter */
get html(){

    /*
        ok so this is a playground for sussing out noiceCoreUI subclasses
        for form elements. Such as dropdowns and chars
        so there's gonna be shenannigans in here
    */


    // some HTML content for the code UI screen
    return(`
        <!--
        <div class="btnBar">
            <h2>controls</h2>
        </div>
        -->
        <div class="tabset"></div>
    `);
}



/*
    mySetFocus(self)
    the UI has changed focus, this is a hardcode focusCallback
*/
async mySetFocus(focus){
    // execute setup only once
    if (this.firstFocus){
        try {this.setup(); }catch(e){ console.log(e); }
        this.firstFocus = false;
    }

    if (focus && (! this.focus)){
        /* gaining focus from a non-focussed state */
        this.gainFocus();
    }else if ((! focus) && this.focus){
        /* losing focus from a focussed state */
        this.leaveFocus();
    }
}


/*
    setup()
*/
setup(){
    /*
        hang thine hooks here
    */
    let that = this;
    this.tabsetFrame = this.DOMElement.querySelector('div.tabset');

    this.screenHolder = new noiceCoreUIScreenHolder({
        currentUI: 'feText',
        UIList: {
            feChar:   new formElementUIScreen({ name: 'Char'}),
            feSelect: new formElementSelectUIScreen({ name: 'Select'}),
            feText:   new formElementTextUIScreen({name: 'Text'}),
            feNumber: new formElementNumberUIScreen({name: 'Number'}),
            feDate:   new formElementDateUIScreen({name: 'Date'}),
            feCheck:  new formElementCheckboxUIScreen({name: 'Checkbox'}),
            feFile:   new formElemenFileUIScreen({name: 'FileInput'}),
            feTable:  new formElemenTableUIScreen({name: 'Table'})
        }
    }).append(this.tabsetFrame);
    //this.screenHolder.switchUI('feText')

    this.ctrlDialog = new noiceCoreUIFloatingDialog({
        x:                  (5*window.innerWidth)/8,
        y:                  window.innerHeight/8,
        _bodyHTML:          `<div class="btns"></div>`,
        title:              "formElement Demos",
        classList:          ['ctrlPanel'],
        dialogHandleClass:  'ctrlPanelHandle',
        dialogBodyClass:    'ctrlPanelBody',
        renderCallback:     function(self){
            let ctrl = self.DOMElement;
            let body = self.DOMElement.querySelector('div.btns');

            let mnu = new noiceCoreUIFormElementSelect({
                name:          'uiSelector',
                label:         'Component',
                labelLocation: 'left',
                values:        Object.keys(that.screenHolder.UIList).map(function(uiName){
                    let tmp = {};
                    tmp[uiName] = that.screenHolder.UIList[uiName].name;
                    return(tmp);
                }),
                valueChangeCallback: function(newValue, oldValue){
                    if (that.isNotNull(newValue)){ that.screenHolder.switchUI(newValue); }
                }
            }).append(body);


            /* old and busted

            Object.keys(that.screenHolder.UIList).forEach(function(uiName){
                let b = document.createElement('button');
                b.textContent = uiName;
                b.addEventListener('click', function(){ that.screenHolder.switchUI(uiName); });
                body.appendChild(b);
            });
            */
        }
    }).append(this.DOMElement);
}


/*
    leaveFocus()
*/
leaveFocus(){
    /*
        insert leave focus stuff here
    */
}

/*
    gainFocus()
    reset / spawn animation loop
*/
gainFocus(){
    /*
        you just got the focus, yo!
        do ya thang
    */
}

} // end formElementSelectUIScreen
