/*
    this is the 'graphics' UI from index.html
    this extends noiceCoreUIScreen
*/
class formElemenTableUIScreen extends noiceCoreUIScreen {

/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'formElementTableUIScreen',
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
            <button id="brnToggleLabel">top</button>
            <button id="brnToggle">toggle</button>
            <button id="btnToggleCtrl">hide ctrl</button>
            <button id="btnSticky">Static Header</button>
            <button id="btnClear">clear</button>
        </div>
        <div class="test">
            <div class="tgt"></div>
            <div class="tbl"></div>
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

    // places to put things
    let tgt = this.DOMElement.querySelector('div.tgt');
    let tbl = this.DOMElement.querySelector('div.tbl');
    let log = this.DOMElement.querySelector('pre.log');

    // make some logging
    function logIt(str){
        log.insertAdjacentHTML('beforeend', str + '\n');
        log.scrollTop = log.scrollHeight;
    }
    window.hackLogger = logIt;

    // make some dummy data
    let testCols = ['Apple', 'Grape', 'Pomegranite', 'Kiwi', 'Orange', 'Mango'];
    let colsArg = [];
    testCols.forEach(function(col){ colsArg.push({name:col, sortMode:'numeric'}); });

    // this function returns data for a random row
    let guh = this;
    function getRandomRow(){
        let row = {};
        testCols.forEach(function(col){
            row[col] = Math.floor(Math.random() * 40);
        });

        /* insert rowMeta data here */
        row.guid = guh.getGUID();
        return(row);
    }

    let numRows = 10;
    let rowsArg = [];
    for (let i=0; i<10; i++){ rowsArg.push(getRandomRow()); }

    /* make a table */
    let testTable = new noiceCoreUIFormElementTable({
        label:              'test table',
        labelLocation:      'top',
        selectMode:         5,
        stickyHeader:       true,
        maxHeight:          '15em',
        columns:            colsArg,
        // simulated page fetch on page change
        //rows:               rowsArg,
        maxRows:            18,
        numRows:            100,
        rowSelectCallback:  function(row, self){
            let meta = JSON.parse(row.dataset.meta);

            logIt(`rowSelectCallback ${meta.guid}`);

            let cols = row.querySelectorAll('td');
            cols.forEach(function(col, idx){
                logIt(`\t[${self.columns[idx].name}]: ${col.textContent}`);
            });
        },
        pageChangeCallback: async function(self, requestedPageNumber){
            /*
                this simulates an asynchronous page fetch on page number change
                if the object has paging turned on, this callback will be invoked
                on load with page 1
            */

            // generate new rows if the requestedPageNumber is not already fully present in self.rows
            let newEnd = ((self.maxRows * requestedPageNumber) -1);
            let newStart = (newEnd - (this.maxRows -1));
            if (newStart < 0){ newStart = 0; }
            let needsFetch = false;
            for (let i=newStart; i < newEnd; i++){
                needsFetch = (needsFetch || (! (self.rows[i] instanceof Element)));
            }

            // generate a page full of rows and push 'em on the pile
            // if one wanted to be a bit more detailed one could capture the
            // index at which needsFetch turns true and start from there
            if (needsFetch){

                // this just holds for a minute to simulate latency
                await new Promise(function(toot, boot){ setTimeout(function(){ toot(true); }, 1000); });

                // and this generates the random page of rows
                for (let i=0; i< self.maxRows; i++){ self.addRow(getRandomRow(), false); };
            }
            // back to the pageNumber setter ...
            return(true);
        }
    }).append(tbl);


    // test enable disable
    this.DOMElement.querySelector('#btnToggleEnable').addEventListener('click',function(e){
        if (e.target.textContent == 'disable'){
            testTable.enable = false;
            e.target.textContent = 'enable';
        }else{
            testTable.enable = true;
            e.target.textContent = 'disable';
        }
    });

    // test change label
    this.DOMElement.querySelector('#btnChangeLabel').addEventListener('click',function(e){
        testTable.label = "noice!";
    });

    // test hide label
    let labelLocations = ['top', 'left', 'none'];
    this.DOMElement.querySelector('#brnToggleLabel').addEventListener('click',function(e){
        let idx = labelLocations.indexOf(e.target.textContent);
        idx ++;
        if (idx > (labelLocations.length -1)){ idx = 0; }
        testTable.labelLocation = labelLocations[idx];
        e.target.textContent = testTable.labelLocation;
        console.log(`labelLocation: ${testTable.labelLocation}`);
    });

    // test toggle DOM state
    let that = this;
    this.DOMElement.querySelector('#brnToggle').addEventListener('click',function(e){
        if (testTable.onScreen){
            testTable.remove();
        }else{
            testTable.append(tbl);
        }
    });

    // test toggle ctrl panel
    this.DOMElement.querySelector('#btnToggleCtrl').addEventListener('click',function(e){
        if (e.target.textContent == "hide ctrl"){
            e.target.textContent = "show ctrl";
            testTable.showControlPanel = false;
        }else{
            e.target.textContent = "hide ctrl";
            testTable.showControlPanel = true;

        }
    });

    // test column swap. let's do apples and oranges, why not?
    this.DOMElement.querySelector('#btnClear').addEventListener('click',function(e){
        log.textContent = '';
    });

    // test sticky toggle
    this.DOMElement.querySelector('#btnSticky').addEventListener('click',function(e){
        if (e.target.textContent == 'Sticky Header'){
            testTable.stickyHeader = true;
            testTable.maxHeight    = '20em';
            e.target.textContent   = 'Static Header';
        }else {
            testTable.stickyHeader = false;
            testTable.maxHeight    = null;
            e.target.textContent   = 'Sticky Header';
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
