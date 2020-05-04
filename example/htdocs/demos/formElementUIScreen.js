/*
    this is the 'graphics' UI from index.html
    this extends noiceCoreUIScreen
*/
class formElementUIScreen extends noiceCoreUIScreen {

/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'formElementUIScreen',
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
        <div class="btnBar">
            <button id="btnToggleEnable">disable</button>
            <button id="btnChangeLabel">change label</button>
            <button id="brnToggleLabel">label location</button>
            <button id="brnToggle">toggle</button>
            <span id="log"></span>
        </div>
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

    // make a dropdown
    let testMenu = new noiceCoreUIFormElementInput({
        label:              'enter value here',
        valueChangeCallback: function(newValue, oldValue){
            console.log(`valueChangeCallback with [new]: ${newValue} [old]: ${oldValue}`);
        },
        values: ['jazzy', 'buckminster purrer', 'mobius', 'punkin']
    }).append(this.DOMElement);

    // test enable disable
    this.DOMElement.querySelector('#btnToggleEnable').addEventListener('click',function(e){
        if (e.target.textContent == 'disable'){
            testMenu.enable = false;
            e.target.textContent = 'enable';
        }else{
            testMenu.enable = true;
            e.target.textContent = 'disable';
        }
    });

    // test change label
    this.DOMElement.querySelector('#btnChangeLabel').addEventListener('click',function(e){
        testMenu.label = "noice!";
    });

    // test hide label
    this.DOMElement.querySelector('#brnToggleLabel').addEventListener('click',function(e){

        if (testMenu.labelLocation == "left"){
            testMenu.labelLocation = "top";
            console.log('labelLocation: top');
        }else if (testMenu.labelLocation == "top"){
            testMenu.labelLocation = "none";
            console.log('labelLocation: none');
        }else if (testMenu.labelLocation == "none"){
            testMenu.labelLocation = "embed";
            console.log('labelLocation: embed');
        }else if (testMenu.labelLocation == "embed"){
            testMenu.labelLocation = "left";
            console.log('labelLocation: left');
        }
    });

    // test toggle DOM state
    let that = this;
    this.DOMElement.querySelector('#brnToggle').addEventListener('click',function(e){
        if (testMenu.onScreen){
            testMenu.remove();
        }else{
            testMenu.append(that.DOMElement);
        }
    });

    /* test default value detection
    this.DOMElement.querySelector('#btnChecDefaultValue').addEventListener('click',function(e){
        testMenu.toggleDefaultValueStyle();
    });
    */


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

} // end amyCodeUIScreen
