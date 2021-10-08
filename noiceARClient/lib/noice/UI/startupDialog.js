/*
    this implements a full screen modal dialog
    more or less laid out like this:

        -----------------------------------
        | <title>                         |
        |---------------------------------|
        | pie      |                      |
        | chart    |  <arbitrary content> |
        | svg      |                      |
        -----------------------------------

    the rest is up to you in external CSS
*/
class startupDialog extends noiceCoreUIOverlay{

/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'startupDialog',
        _netStatus:             'network status:',
        _dbStatus:              'database status:',
        _netReadBytes:          '0 bytes',
        _dbStatusDetail:        '',
        _showPieChart:          false,
        _showCancelBtn:         false,
        _title:                 'startup',
        _message:               'application startup',
        _charts:                {},
        _runAnimation:          false,
        _animationFrame:        0,
        _welcomeMode:          false,
        _welcomeTitle:          'Welcome',
        _welcomeMessage:        "To begin, touch 'start'",
        headingClass:           'dialogHeadingClass',
        contentClass:           'dialogContentClass',
        chartSize:              200,
        chartBackroundClass:    'chartBknd',
        dbStats:                {},
        messageContainerClass:  'dialogMessageClass',
        welcomeImage:           './gfx/hicox_flower.svg'
    },defaults),callback);

    this.setup();
} // end constructor


/*
    html getter
*/
get html(){

    return(`
        <div class="startupDialogUI">
            <div class="${this.headingClass}"><h2>${this.title}</h2></div>
            <div class="${this.contentClass}" style="display:grid;grid-template-columns:2fr 3fr;align-items:center;">
                <div class="gfx"">
                    <center><img class="scannerDiagram" src="${this.welcomeImage}" height="${(this.chartSize)}" style="display:none;"/>
                    <svg viewBox="${(this.chartSize/-2)} ${(this.chartSize/-2)} ${this.chartSize} ${this.chartSize}" width="${this.chartSize}" height="${this.chartSize}" xmlns="http://www.w3.org/2000/svg">
                        <circle class="chartBknd" cx="0" cy="0" r="${(this.chartSize/2) * (7/8)}" />
                    </svg>
                    </center>
                </div>
                <div class="${this.messageContainerClass}">
                    <div class="startupProgress">
                        <h3 class="msg">${this.message}</h3>
                        <span id="netStatus">${this.netStatus}</span><br>
                        <span id="netReadBytes" class="statusDetail">${this.netReadBytes}</span><br>
                        <span id="dbStatus">${this.dbStatus}</span><br>
                        <div id="dbStatusDetail" class="statusDetail">${this.dbStatusDetail}</div><br>
                        <ul id="dbTableDetail"></ul>
                    </div>
                    <div class="startupWelcome" style="display:none;">
                            <h2 class="welcomeTitle">${this.welcomeTitle}</h2>
                            <p class="welcomeMessage">${this.welcomeMessage}</p>
                    </div>
                    <div class="btnContainer" style="width:100%;text-align:right;">
                        <button id="btnInventoryStart">start</button>
                        <button id="btnInventoryCancel" style="display:none;">reload</button>
                    </div>
                </div>
            </div>
        </div>
    `);
}

/* getters n setters */
get netStatus(){ return(this._netStatus); }
set netStatus(v){
    this._netStatus = v;
    if (this.netStatusDOMObject instanceof Element){ this.netStatusDOMObject.textContent = this._netStatus; }
}
get dbStatus(){ return(this._dbStatus); }
set dbStatus(v){
    this._dbStatus = v;
    if (this.dbStatusDOMObject instanceof Element){ this.dbStatusDOMObject.textContent = this._dbStatus; }
}
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
get netReadBytes(){ return(this._netReadBytes); }
set netReadBytes(v){
    this._netReadBytes = v;
    if (this.netReadBytesDOMObject instanceof Element){ this.netReadBytesDOMObject.textContent = this._netReadBytes; }
}
get dbStatusDetail(){ return(this._dbStatusDetail); }
set dbStatusDetail(v){
    this._dbStatusDetail = v;
    if (this.dbStatusDetailDOMObject instanceof Element){ this.dbStatusDetailDOMObject.innerHTML = this._dbStatusDetail; }
}
get welcomeMode(){ return(this._welcomeMode); }
set welcomeMode(v){
    if (this.startupProgressDiv instanceof Element){
        if (v === true){
            // entering welcomeMode
            this.startupProgressDiv.style.display            = 'none';
            this.startupWelcomeDiv.style.display             = 'grid';
            this.startupWelcomeDiv.style.gridTemplateColumns = '1fr';
            this.startupWelcomeDiv.style.alignSelf           = 'center';
            this.scannerDiagram.style.display                = 'block';
        }else{
            // exiting welcomeMode
            this.startupProgressDiv.style.display  = 'block';
            this.startupWelcomeDiv.style.display   = 'none';
            this.scannerDiagram.style.display      = 'none';
        }
    }
    this._welcomeMode = (v === true);
}
get welcomeMessage(){ return(this._welcomeMessage); }
set welcomeMessage(v){
    this._welcomeMessage = v;
    if (this.welcomeMessageDOM instanceof Element){ this.welcomeMessageDOM.textContent = this._welcomeMessage; }
}
get welcomeTitle(){ return(this._welcomeTitle); }
set welcomeTitle(v){
    this._welcomeTitle = v;
    if (this.welcomeTitleDOM instanceof Element){ this.welcomeTitleDOM.textContent = this._welcomeTitle; }
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
    this.titleDOMObject          = this.DOMElement.querySelector(`.${this.headingClass} h2`);
    this.startupProgressDiv      = this.DOMElement.querySelector('div.startupProgress');
    this.startupWelcomeDiv       = this.DOMElement.querySelector('div.startupWelcome');
    this.netStatusDOMObject      = this.DOMElement.querySelector('#netStatus');
    this.dbStatusDOMObject       = this.DOMElement.querySelector('#dbStatus');
    this.netReadBytesDOMObject   = this.DOMElement.querySelector('#netReadBytes');
    this.svgParentDiv            = this.DOMElement.querySelector('div.gfx');
    this.svgDOMObject            = this.DOMElement.querySelector('div.gfx svg');
    this.startButtonDOMObject    = this.DOMElement.querySelector('#btnInventoryStart');
    this.cancelButtonDOMObject   = this.DOMElement.querySelector('#btnInventoryCancel');
    this.messageDOMObject        = this.DOMElement.querySelector(`.${this.messageContainerClass} h3.msg`);
    this.dbStatusDetailDOMObject = this.DOMElement.querySelector('#dbStatusDetail');
    this.dbTableDetail           = this.DOMElement.querySelector('#dbTableDetail');
    this.scannerDiagram          = this.DOMElement.querySelector('img.scannerDiagram');
    this.welcomeMessageDOM       = this.DOMElement.querySelector('.welcomeMessage');
    this.welcomeTitleDOM         = this.DOMElement.querySelector('.welcomeTitle');

    let that = this;

    // setup callbacks for the buttons
    this.DOMElement.querySelector('#btnInventoryStart').addEventListener('click', function(e){
        // let the caller decide when to kill welcomeMode ...
        // if (that.welcomeMode){ that.welcomeMode = false; }
        if (that.startButtonCallback instanceof Function){ that.startButtonCallback(that, e); }
    });

    /*
        test stuff
    */
    this.DOMElement.querySelector('#btnInventoryCancel').addEventListener('click', async function(e){
        if (that.cancelButtonCallback instanceof Function){ that.cancelButtonCallback(that, e); }
    });



    // init DOM values that have getter/drsetters
    [
        'netStatus','dbStatus','title', 'message', 'netReadBytes', 'showPieChart',
        'showCancelBtn', 'welcomeMode', 'welcomeTitle', 'welcomeMessage'
    ].forEach(function(at){ this[at] = this[at]; }, this);

    // setup the pieCharts
    if (this.hasOwnProperty('pieCharts') && (this.pieCharts instanceof Array)){
        this.pieCharts.forEach(function(c){ this.addPieChart(c); }, this);
    }
}

// showCancelBtn
get showCancelBtn(){ return(this._showCancelBtn); }
set showCancelBtn(v){
    this._showCancelBtn = (v == true);
    if (this.cancelButtonDOMObject instanceof Element){
        this.cancelButtonDOMObject.style.display = (this.showCancelBtn)?'inline-block':'none';
    }
}


// hackery
set showPieChart(v){
    this._showPieChart = (v === true);
    if (this.svgDOMObject instanceof Element){
        //this.svgDOMObject.style.visibility = (this.showPieChart)?'visible':'collapse';
        this.svgDOMObject.style.display = (this.showPieChart)?'block':'none';
    }
}
get showPieChart(){ return(this._showPieChart); }



/*
    addPieChart({
        name:           <distinct name>
        fill:           <css-compatible color -- use rgba for transparency. not fill-opacity>
        stroke:         <css-compatible color -- use rgba for transparency. not stroke-opacity>
        strokeWidth:    int
    })
    this adds a progress indicator to the pie chart. there can be many inside the same
    pie chart vertically stacked. The vertical stacking context is back to front
    in the order you add them.
*/
addPieChart(args){

    /* TO-DO: these should have proper error objects some day */
    if (!(args instanceof Object)){ throw("[addPieChart] args is not an object"); }
    if (!(args.hasOwnProperty('name') && this.isNotNull(args.name))){ throw("[addPieChart]: name is required"); }

    /* defaults */
    if (!(args.hasOwnProperty('fill') && this.isNotNull(args.fill))){ args.fill = 'rgba(17, 47, 65, .2)'; }
    if (!(args.hasOwnProperty('stroke') && this.isNotNull(args.stroke))){ args.stroke = 'rgba(17, 47, 65, .6)'; }
    if (!(args.hasOwnProperty('strokeWidth') && this.isNotNull(args.strokeWidth))){ args.strokeWidth = '1px'; }

    /* make the path */
    this._charts[args.name] = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this._charts[args.name].setAttribute('fill', args.fill);
    this._charts[args.name].setAttribute('stroke', args.stroke);
    this._charts[args.name].setAttribute('stroke-width', args.strokeWidth);

    /* append it */
    this.svgDOMObject.appendChild(this._charts[args.name])
}




/*
    updatePieChart(name, percent)
    set the pieChart specified by <name> to <percent>
*/
updatePieChart(name, percent){
    /* TO-DO: these should have proper error objects some day */
    if (this.isNull(name) || (! this._charts.hasOwnProperty(name))){ throw("[updatePieChart]: invalid name"); }

    let p = ((percent%100)/100);
    let radius = ((this.chartSize/2) * (7/8));
    let angle = 2 * Math.PI * p;

    // this takes care of a visual loose end, if you set strokeOpacity in the css for your chart
    if ((p == 100) || (p == 0)){
        this._charts[name].style.opacity = 0;
    }else{
        this._charts[name].style.opacity = 1;
    }

    /* time for some quick "d" */
    this._charts[name].setAttribute('d', `
        M 0,0
        L 0, ${-1 * radius}
        A ${radius} ${radius} 0 ${(p<=.5)?0:1} 1 ${(radius * Math.sin(angle))}, ${(-1 * radius * Math.cos(angle))}
        L 0,0 Z
    `);
}


} // end startupDialog class
