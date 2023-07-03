/*
    this is the 'graphics' UI from index.html
    this extends noiceCoreUIScreen
*/
class formElemenFileUIScreen extends noiceCoreUIScreen {

/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'formElementNumberUIScreen',
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
        </div>
        <div class="test">
            <div class="tgt"></div>
            <pre class="log"></pre>
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
    let tgt = this.DOMElement.querySelector('div.tgt');
    let log = this.DOMElement.querySelector('pre.log');
    function logIt(str){
        log.insertAdjacentHTML('beforeend', str + '\n');
    }
    let testMenu = new noiceCoreUIFormElementFile({
        label:              'file',
        labelLocation:      'top',
        valueChangeCallback: function(newValue, oldValue){

            /*
                for the file input we get fileList objects:
                https://developer.mozilla.org/en-US/docs/Web/API/FileList

                you may be interested in this as well:
                https://developer.mozilla.org/en-US/docs/Web/API/File

                oldValue is just a second copy of newValue as the FileList
                returned by the change event is a pointer to whatever is currently
                selected in the file widget. If that's a problem, you could
                override the setter and actually grab the file contents, but this
                seems like overkill and I'm not actually sure I'd want it to work that way.

                here's a quickie demo. if you give it a CSV file, we'll try to read it
                and report some stats, otherwise just file properties. not testing
                multiple files with this one though that might be a good next step
            */

            // report new file if we've got one
            let that = this;
            if ((this.isNotNull(newValue)) && (newValue.length > 0)){
                logIt('new file:');
                // spit some stats
                ['name', 'lastModified', 'size', 'type'].forEach(function(a){
                    if (a == 'lastModified'){
                        logIt(`      [${a}]: ${that.fromEpoch(newValue[0][a], 'dateTime')}`);
                    }else{
                        logIt(`      [${a}]: ${newValue[0][a]}`);
                    }
                });

                // is it a csv?
                if (newValue[0].type == 'text/csv'){
                    // do csv thangs ...
                    let reader = new FileReader();
                    reader.onload = function(evt){
                        // evt.target.result has the entire csv file as a strang
                        let rows = 0;
                        evt.target.result.split(/\n/).forEach(function(row,rowNum){
                            // dumb test
                            rows++;
                        });
                        logIt(`     [CSV Row Count]: ${rows}`)
                    }
                    reader.readAsText(newValue[0]);
                }
            }

        }
    }).append(tgt);

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
