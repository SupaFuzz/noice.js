/*
    splashDialog.js
    12/28/21 - a better version of startupDialog
    this is a splash screen with optional user interaction features

    as before, in general, this:

    -----------------------------------
    | <title>                         |
    |---------------------------------|
    |          |                      |
    |  <gfx>   |    <screenHolder>    |
    |          |                      |
    -----------------------------------

    where:

    <gfx> is a screenHolder with two UIs:
        * welcomeImage - shows a welcome image (default hicox_flower.svg)
        * pieChart  - shows a pieChart you can send data to

    <screenHolder> is a screenHolder with three UIs:
        * welcomeMessage - shows a welcome message with start/cancel buttons
        * auth - shows user/pass with login button (see authCallback)
        * loading - shows a loading UI with various status messages

    <title> is a string

    requires:
        * noiceCore
        * noiceCoreUI
        * noiceRadialPolygonPath
        * noiceCoreUIFormElement
*/
class splashDialog extends noiceCoreUIElement {




/*
    constructor
*/
constructor(args, defaults, callback){

    // instantiate
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'splashDialog',
        _showStartButton:       true,
        _startButtonText:       'start',
        _showReloadButton:      false,
        _reloadButtonText:      'reload',
        _welcomeTitle:          "Welcome",
        _welcomeMessage:        "To begin, touch 'start'",
        _welcomeImage:          null,
        _display:                'welcomeMessage', // or 'auth' or 'custom'
        _showPieChart:          false,
        _runAnimation:          false,
        _authErrorMessage:      null,
        title:                 'startup',
        headingClass:           'dialogHeadingClass',
        contentClass:           'dialogContentClass',
        messageContainerClass:  'dialogMessageClass',
        necessaryStyle:         {
            position:       'absolute',
            overflow:       'hidden',
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'center',
            width:          '100%',
            height:         '100%',
            left:           '0',
            top:            '0',
            zIndex:         '99'
        },
        pieCharts: [
            { name:'db',      fill:'rgba(6, 133, 135, .5)' },
            { name:'network', fill:'rgba(17, 47, 65, .2)' }
        ]

    },defaults),callback);

    this.setup();

} // end constructor




/*
    html getter
*/
get html(){return(`
    <div class="startupDialogUI">
        <div class="${this.headingClass}"><h2 data-templatename="title" data-templateattribute="true">${this.title}</h2></div>
        <div class="${this.contentClass}" style="display:grid;grid-template-columns:2fr 3fr;align-items:center;">
            <div data-templatename="gfxFrame"></div>
            <div data-templatename="messageContainer" class="${this.messageContainerClass}" style="height: 100%;"></div>
        </div>
    </div>
`)}




/*
    applyNecessaryStyle
*/
applyNecessaryStyle(){
    let that = this;
    Object.keys(that.necessaryStyle).forEach(function(a){ that.DOMElement.style[a] = that.necessaryStyle[a]; });
}




/*
    setup
*/
setup(){
    let that = this;

    // configure UI container style to full-screen blocking overlay
    that.applyNecessaryStyle();

    // setup the gfxFrame screenHolder
    that.gfxScreenHolder = new noiceCoreUIScreenHolder({
        fullscreen: false,
        UIList: {
            welcomeImage: new noiceCoreUIScreen({
                fullscreen: false,
                getHTMLCallback: function(s){ return(that.welcomeImage); },
                onScreenCallback: async function(s){
                    let b = s.DOMElement.getBoundingClientRect();
                    that._welcomeImageWidth = b.width;
                    that._welcomeImageHeight = b.height;
                    return(true);
                }
            }),
            pieChart: new noiceCoreUIScreen({
                fullscreen: false,
                getHTMLCallback: function(s){ return(''); },
                renderCallback: function(s){
                    that.pieChart = new noicePieChart({
                        showPieChart: true,
                        size: '5em',
                        pieCharts: that.pieCharts,
                        zIndex: 1
                    }).append(s.DOMElement);
                }
            })
        }
    }).append(that._DOMElements.gfxFrame);

    // set welcomeImage by default and set the pie chart size to match it's dimensions
    that.gfxScreenHolder.switchUI('welcomeImage').then(function(){

        // set pieChart size
        that.pieChart.size = `${that._welcomeImageWidth}px`;

        // setup animation hooks
        that.pieChart.animationStartCallback = function(self){
            if (! self.hasOwnProperty('_animatePolygon')){
                self._animatePolygon = new noiceRadialPolygonPath({
                    edges:          3,
                    radius:         ((self.chartSize/2) * (6/8)),
                    baseFillOpacity:.25
                }).append(self.svgDOMObject);
            }
        };

        that.pieChart.animationCallback = function(self){
            if (self.hasOwnProperty('_animatePolygon')){
                self._animatePolygon.phase = -(((self._animationFrame%2000)/2000) * Math.PI * 2);
                self._animatePolygon.fillOpacity = (self._animatePolygon.baseFillOpacity + (.15 * ((Math.cos(2*Math.PI * (self._animationFrame%250)/250)) + .5)));
                if (((self._animationFrame%100)/100) == 0){
                    self._animatePolygon.edges = 3 + Math.floor(Math.random() * 5);
                }
            }
        };

        that.pieChart.animationExitCallback = function(self){
            if (self.hasOwnProperty('_animatePolygon')){
                self._animatePolygon.remove();
                delete self._animatePolygon
            }
        };
    });

    // setup the messageContainer screenHolder
    that.msgScreenHolder = new noiceCoreUIScreenHolder({
        fullscreen: false,
        UIList: {

            // the welcome message & start/reload buttons
            welcomeMessage: new noiceCoreUIScreen({
                fullscreen: false,
                welcomeTitle: that.welcomeTitle,
                welcomeMessage: that.welcomeMessage,
                getHTMLCallback: function(s){return(`
                    <div data-templatename="welcomeContent" class="welcomeContent" style="
                        width: 100%;
                        height: 100%;
                        display: grid;
	                    grid-template-rows: auto 3.5em;
                    ">
                        <div class="startupWelcome" style="align-self:center;">
                            <h2 class="welcomeTitle" data-templatename="welcomeTitle" data-templateattribute="true"></h2>
                            <p class="welcomeMessage" data-templatename="welcomeMessage" data-templateattribute="true"></p>
                        </div>
                        <div class="buttons" style="
                            display: flex;
	                        flex-direction: row-reverse;
                        ">
                            <button data-templatename="btnStart" style="display:${that.showStartButton?'block':'none'};">${that.startButtonText}</button>
                            <button data-templatename="btnReload" style="display:${that.showReloadButton?'block':'none'};">${that.reloadButtonText}</button>
                        </div>
                    </div>
                `)},
                renderCallback: function(s){
                    // hook up the buttons to the callbacks
                    s._DOMElements.btnStart.addEventListener('click', function(evt){
                        if (that.startButtonCallback instanceof Function){ that.startButtonCallback(that, evt); }
                    });
                    s._DOMElements.btnReload.addEventListener('click', function(evt){
                        if (that.reloadButtonCallback instanceof Function){ that.reloadButtonCallback(that, evt); }
                    });
                }
            }),

            // auth
            auth: new noiceCoreUIScreen({
                fullscreen: false,
                getHTMLCallback: function(s){return(`
                    <div data-templatename="welcomeContent" class="welcomeContent authStartupDialog" style="
                        width: 100%;
                        height: 100%;
                        display: grid;
	                    grid-template-rows: auto 3.5em;
                    ">
                        <div class="startupWelcome loginUI" style="align-self:center;" data-templatename="startupWelcome"></div>
                        <div class="buttons" style="
                            display: flex;
	                        flex-direction: row-reverse;
                        ">
                            <button data-templatename="btnStart" style="display:${that.showStartButton?'block':'none'};">${that.startButtonText}</button>
                            <button data-templatename="btnReload" style="display:${that.showReloadButton?'block':'none'};">${that.reloadButtonText}</button>
                        </div>
                    </div>
                `)},
                renderCallback: function(s){

                    // setup auth inputs and error message widget
                    that.userInput = new noiceCoreUIFormElementInput({
                        type:           'char',
                        maxLength:      40,
                        label:          'Login ID',
                        labelLocation:  'left',
                        valueLength:    'auto'
                    }).append(s._DOMElements.startupWelcome);

                    that.userPass = new noiceCoreUIFormElementPassword({
                        type:           'char',
                        maxLength:      254,
                        label:          'Password',
                        labelLocation:  'left',
                        valueLength:    'auto'
                    }).append(s._DOMElements.startupWelcome);

                    that.authErrorMsg = document.createElement('span');
                    that.authErrorMsg.className = 'authErrorMsg';
                    that.authErrorMsg.style.display = "none";
                    //that.authErrorMsg.style.opacity = 0;
                    s._DOMElements.startupWelcome.appendChild(that.authErrorMsg);

                    // hook up the buttons to the callbacks
                    s._DOMElements.btnStart.addEventListener('click', function(evt){
                        if (that.startButtonCallback instanceof Function){ that.startButtonCallback(that, evt); }
                    });
                    s._DOMElements.btnReload.addEventListener('click', function(evt){
                        if (that.reloadButtonCallback instanceof Function){ that.reloadButtonCallback(that, evt); }
                    });

                }
            })


            //loading UI
        }
    }).append(that._DOMElements.messageContainer);
    that.msgScreenHolder.switchUI(that.display);


} // end setup








/*
    getters and setters
*/




/*
    display stuff
*/
get display(){ return(this._display); }
set display(v){
    this._display = v;
    if (this.msgScreenHolder instanceof noiceCoreUIScreenHolder){
        this.msgScreenHolder.switchUI(this.display);
    }
}




/*
    showPieChart
    (toggles between welcomeImage and pieChart)
*/
get showPieChart(){ return(this._showPieChart); }
set showPieChart(v){
    this._showPieChart = (v === true);
    if (this.gfxScreenHolder instanceof noiceCoreUIScreenHolder){
        this.gfxScreenHolder.switchUI((this._showPieChart)?'pieChart':'welcomeImage')
    }
}




/*
    runAnimation
*/
get runAnimation(){ return(this._runAnimation); }
set runAnimation(v){
    this._runAnimation = (v === true);
    if ((this._runAnimation) && (! this.showPieChart)){ this.showPieChart = true; }
    if (this.pieChart instanceof noicePieChart){
        this.pieChart.runAnimation = this._runAnimation;
    }
}




/*
    authErrorMessage
*/
get authErrorMessage(){ return(this._authErrorMessage); }
set authErrorMessage(v){
    this._authErrorMessage = v;
    if (this.authErrorMsg instanceof Element){
        this.authErrorMsg.textContent = this._authErrorMessage;
        this.authErrorMsg.style.display = (this.isNull(this._authErrorMessage))?'none':'block';
    }
}




/*
    start & reload button stuff
*/
get showStartButton(){ return(this._showStartButton); }
set showStartButton(v){
    this._showStartButton = (v === true);
    if (
        (this.msgScreenHolder instanceof noiceCoreUIScreenHolder) &&
        (this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI) instanceof noiceCoreUIScreen)
    ){
        this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI)._DOMElements.btnStart.style.display = (this.showStartButton)?'block':'none';
    }
}
get startButtonText(){ return(this._startButtonText); }
set startButtonText(v){
    this._startButtonText = v;
    if (
        (this.msgScreenHolder instanceof noiceCoreUIScreenHolder) &&
        (this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI) instanceof noiceCoreUIScreen)
    ){
        this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI)._DOMElements.btnStart.textContent = v;
    }
}
get showReloadButton(){ return(this._showReloadButton); }
set showReloadButton(v){
    this._showReloadButton = (v === true);
    if (
        (this.msgScreenHolder instanceof noiceCoreUIScreenHolder) &&
        (this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI) instanceof noiceCoreUIScreen)
    ){
        this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI)._DOMElements.btnReload.style.display = (this.showReloadButton)?'block':'none';
    }
}
get reloadButtonText(){ return(this._reloadButtonText); }
set reloadButtonText(v){
    this._reloadButtonText = v;
    if (
        (this.msgScreenHolder instanceof noiceCoreUIScreenHolder) &&
        (this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI) instanceof noiceCoreUIScreen)
    ){
        this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI)._DOMElements.btnReload.textContent = v;
    }
}




/*
    welcomeMessage and welcomeTitle
*/
get welcomeMessage(){ return(this._welcomeMessage); }
set welcomeMessage(v){
    this._welcomeMessage = v;
    if (
        (this.msgScreenHolder instanceof noiceCoreUIScreenHolder) &&
        (this.msgScreenHolder.getUI('welcomeMessage') instanceof noiceCoreUIScreen)
    ){
        this.msgScreenHolder.getUI('welcomeMessage').welcomeMessage = v;
    }
}
get welcomeTitle(){ return(this._welcomeTitle); }
set welcomeTitle(v){
    this._welcomeTitle = v;
    if (
        (this.msgScreenHolder instanceof noiceCoreUIScreenHolder) &&
        (this.msgScreenHolder.getUI('welcomeMessage') instanceof noiceCoreUIScreen)
    ){
        this.msgScreenHolder.getUI('welcomeMessage').welcomeTitle = v;
    }
}




/*
    btnStart & btnReload
*/
get btnStart(){
    if (
        (this.msgScreenHolder instanceof noiceCoreUIScreenHolder) &&
        (this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI) instanceof noiceCoreUIScreen) &&
        (this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI)._DOMElements.btnStart instanceof Element)
    ){
        return(this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI)._DOMElements.btnStart);
    }else{
        return(null);
    }
}
get btnReload(){
    if (
        (this.msgScreenHolder instanceof noiceCoreUIScreenHolder) &&
        (this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI) instanceof noiceCoreUIScreen) &&
        (this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI)._DOMElements.btnReload instanceof Element)
    ){
        return(this.msgScreenHolder.getUI(this.msgScreenHolder.currentUI)._DOMElements.btnReload);
    }else{
        return(null);
    }
}


/*
    welcomeImage
    the hicox_flower logo is the default welcomeImage
    override this getter to change it or just set welcomeImage
*/
set welcomeImage(v){ this._welcomeImage = v; }
get welcomeImage(){
    if (this.isNull(this._welcomeImage)){
        return(this.hicox_flower);
    }else{
        return(this._welcomeImage);
    }
}
get hicox_flower(){
    return(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg
       xmlns:dc="http://purl.org/dc/elements/1.1/"
       xmlns:cc="http://creativecommons.org/ns#"
       xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
       xmlns:svg="http://www.w3.org/2000/svg"
       xmlns="http://www.w3.org/2000/svg"
       xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
       xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
       width="200"
       height="200"
       viewBox="0 0 52.916665 52.916668"
       version="1.1"
       id="svg896"
       inkscape:version="1.0.2 (e86c8708, 2021-01-15)"
       sodipodi:docname="hicox_flower.svg">
      <defs
         id="defs890" />
      <sodipodi:namedview
         id="base"
         pagecolor="#ffffff"
         bordercolor="#666666"
         borderopacity="1.0"
         inkscape:pageopacity="0.0"
         inkscape:pageshadow="2"
         inkscape:zoom="1.979899"
         inkscape:cx="175.13933"
         inkscape:cy="160"
         inkscape:document-units="mm"
         inkscape:current-layer="g1551"
         inkscape:document-rotation="0"
         showgrid="false"
         inkscape:pagecheckerboard="true"
         units="px"
         inkscape:window-width="1920"
         inkscape:window-height="1147"
         inkscape:window-x="1440"
         inkscape:window-y="25"
         inkscape:window-maximized="1" />
      <metadata
         id="metadata893">
        <rdf:RDF>
          <cc:Work
             rdf:about="">
            <dc:format>image/svg+xml</dc:format>
            <dc:type
               rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
            <dc:title />
          </cc:Work>
        </rdf:RDF>
      </metadata>
      <g
         inkscape:label="Layer 1"
         inkscape:groupmode="layer"
         id="layer1">
        <g
           id="g1551"
           transform="matrix(0.81,0,0,0.81,5.0270832,5.0270832)">
          <circle
             style="fill:#ed553b;fill-opacity:1;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972"
             cx="26.381578"
             cy="26.38159"
             r="10.833059" />
          <circle
             style="fill:#404040;fill-opacity:0.66;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972-1"
             cx="45.449997"
             cy="26.38159"
             r="6.4482498"
             data-loc="e" />
          <circle
             style="fill:#404040;fill-opacity:0.66;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972-1-5"
             cx="7.4666681"
             cy="26.38159"
             r="6.4482498"
             data-loc="w" />
          <circle
             style="fill:#404040;fill-opacity:0.66;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972-1-54"
             cx="26.535137"
             cy="7.4667029"
             r="6.4482498"
             data-loc="n" />
          <circle
             style="fill:#404040;fill-opacity:0.66;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972-1-6"
             cx="26.535137"
             cy="45.449963"
             r="6.4482498"
             data-loc="s" />
          <circle
             style="fill:#404040;fill-opacity:0.33;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972-1-56"
             cx="18.961145"
             cy="37.40099"
             r="3.9852767"
             transform="rotate(-45)"
             data-loc="ne" />
          <circle
             style="fill:#404040;fill-opacity:0.33;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972-1-5-9"
             cx="-19.022215"
             cy="37.40099"
             transform="rotate(-45)"
             r="3.9852767"
             data-loc="sw" />
          <circle
             style="fill:#404040;fill-opacity:0.33;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972-1-54-3"
             cx="0.046285719"
             cy="18.48612"
             r="3.9852767"
             transform="rotate(-45)"
             data-loc="nw" />
          <circle
             style="fill:#404040;fill-opacity:0.33;stroke:#030f27;stroke-width:0.324952;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.659919"
             id="path4972-1-6-7"
             cx="0.046285719"
             cy="56.469357"
             r="3.9852767"
             transform="rotate(-45)"
             data-loc="se" />
        </g>
      </g>
    </svg>`);
}



} // end splashDialog
