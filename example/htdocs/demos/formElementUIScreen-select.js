/*
    this is the 'graphics' UI from index.html
    this extends noiceCoreUIScreen
*/
class formElementSelectUIScreen extends noiceCoreUIScreen {

/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'formElementSelectUIScreen',
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
            <button id="btnChecDefaultValue">def value</button>
            <button id="btnSetSelection">change selection</button>
            <button id="btnChangeOptions">change options</button>
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

    let testValues = {
        'fruit':    [ 'apples', 'babannas', 'oranges', 'blueberries', 'strawberries', 'kiwi' ],
        'spices':   [
            { 0: 'corriander' },
            { 1: 'mustard powder' },
            { 2: 'cumin' },
            { 3: 'cinnamon' },
            { 4: 'crushed red pepper' },
            { 5: 'minced garlic' },
            { 6: 'white vinegar' }
        ],
        'mics':     [
            { label: 'german', values: [ 'U87', 'e865'] },
            { label: 'british', values: [ 'CM8', 'N354o']},
            { label: 'cheap', values: [ {0: 'MXL'}, {3: 'AudioTechnica'} ]}
        ]
    }


    // make a dropdown
    let testMenu = new noiceCoreUIFormElementSelect({
        label:              'select value',
        values:             testValues.mics,
        valueChangeCallback: function(newValue, oldValue){
            /*
                this is a good demonstration of using key/value pairs
                in the valueChangeCallback, newValue and oldValue are
                KEYS, not the VALUES, you gotta decode on your own.

            let newEnumString = '';
            if (this.isNotNull(newValue)){ newEnumString = this.values[newValue][Object.keys(this.values[newValue])[0]]; }
            let oldEnumString = '';
            if (this.isNotNull(oldValue)){ oldEnumString = this.values[oldValue][Object.keys(this.values[oldValue])[0]]; }
            */
            console.log(`valueChangeCallback with [new]: ${newValue} [old]: ${oldValue}`);
        }
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

    // test default value detection
    this.DOMElement.querySelector('#btnChecDefaultValue').addEventListener('click',function(e){
        testMenu.toggleDefaultValueStyle();
    });

    // test change selection
    this.DOMElement.querySelector('#btnSetSelection').addEventListener('click',function(e){
        let val = testMenu.values[Math.floor(Math.random() * testMenu.values.length)];
        testMenu.value = Object.keys(val)[0];
        /*
            NOTE: this is a good demonstration of using key/value pairs
            for options (for instance most commonly for enums). When setting *.value
            you have to set the KEY (enum), not the VALUE (string, usually)
        */
    });

    // test change options
    this.DOMElement.querySelector('#btnChangeOptions').addEventListener('click',function(e){

        let rndKey = Object.keys(testValues)[Math.floor(Math.random() * Object.keys(testValues).length)];
        testMenu.values = testValues[rndKey];
    });

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
