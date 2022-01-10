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
        _additionalContent:     '',
        _cheatCode:             null,
        headingClass:           'ihHeadingClass',
        contentClass:           'ihHeadingContentClass',
        messageContainerClass:  'ihHeadingMessageClass',
    },defaults),callback);

    this.setup();
} // end constructor


/*
    html getter
*/
get html(){

    /*
        1/6/22 @ 1655
        we'll support these platforms:
        'Safari Mobile' -> existing install instructions
        'Safari'        -> "use chrome"
        'Chrome'        -> update icons and install instructions
        'Edge'          -> update icons and install instructions
        'Firefox'       -> "use chrome"
    */
    let platform = this.identifyClient();
    console.log(`${this._className} | html getter | platform: ${platform}`);
    if (platform == 'Safari Mobile'){
        return(`
            <div class="ihDialog" style="display:grid;grid-template-columns:1fr;border-color:transparent;">
                <div class="${this.messageContainerClass}">
                    <p class="msg"><strong>Install this webapp</strong> on your device: tap <img class="iosShareIcon" style="vertical-align:middle;margin-bottom:.5em;"/><br>
                    then <strong>Add to homescreen</strong> <img class="iosAddToHomescreenIcon" style="vertical-align:middle;" /><br /></p>
                </div>
                <div class="additionalContent">${this.additionalContent}</div>
            </div>
        `);
    }else if (platform == 'Edge'){
        return(`
            <div class="ihDialog" style="display:grid;grid-template-columns:1fr;border-color:transparent;">
                <div class="${this.messageContainerClass}">
                    <p class="msg"><strong>Install this webapp</strong> on your device: tap <img class="edgeInstallIcon" style="vertical-align:middle;margin-bottom:.5em;"/><br>
                    then tap the <strong>Install</strong> button<br /></p>
                </div>
                <div class="additionalContent">${this.additionalContent}</div>
            </div>
        `);
    }else if (platform == 'Chrome'){
        return(`
            <div class="ihDialog" style="display:grid;grid-template-columns:1fr;border-color:transparent;">
                <div class="${this.messageContainerClass}">
                    <p class="msg"><strong>Install this webapp</strong> on your device: tap <img class="chromeInstallIcon" style="vertical-align:middle;margin-bottom:.5em;"/><br>
                    then tap the <strong>Install</strong> button<br /></p>
                </div>
                <div class="additionalContent">${this.additionalContent}</div>
            </div>
        `);
    }else{
        return(`
            <div class="ihDialog" style="display:grid;grid-template-columns:1fr;border-color:transparent;">
                <div class="${this.messageContainerClass}">
                    <p class="msg">
                        <strong>Install this webapp</strong> on a mobile device<br>
                        or <strong>load in Chrome or Edge</strong> to install on desktop</strong><br />
                    </p>
                </div>
                <div class="additionalContent">${this.additionalContent}</div>
            </div>
        `);
    }
}




/*
    setup()
*/
setup(){

    // snag needed DOM Elements
    this.additionalContentDOM = this.DOMElement.querySelector('div.additionalContent');

    // init DOM values that have getter/drsetters
    ['additionalContent'].forEach(function(at){ this[at] = this[at]; }, this);

    // insert iosShareIcon svg (override getter if you need to change it)
    this.DOMElement.querySelectorAll('img.iosShareIcon').forEach(function(img){
        let url = URL.createObjectURL(new Blob([this.iosShareIcon], {type: 'image/svg+xml'}));
        img.addEventListener('load', () => URL.revokeObjectURL(url), {once: true});
        img.src = url;
    }, this);

    // insert iosAddToHomescreenIcon svg (override getter if you need to change it)
    this.DOMElement.querySelectorAll('img.iosAddToHomescreenIcon').forEach(function(img){
        let url = URL.createObjectURL(new Blob([this.iosAddToHomescreenIcon], {type: 'image/svg+xml'}));
        img.addEventListener('load', () => URL.revokeObjectURL(url), {once: true});
        img.src = url;
    }, this);

    // insert chromeInstallIcon svg
    this.DOMElement.querySelectorAll('img.chromeInstallIcon').forEach(function(img){
        let url = URL.createObjectURL(new Blob([this.chromeInstallIcon], {type: 'image/svg+xml'}));
        img.addEventListener('load', () => URL.revokeObjectURL(url), {once: true});
        img.src = url;
    }, this);

    // insert edgeInstallIcon svg
    this.DOMElement.querySelectorAll('img.edgeInstallIcon').forEach(function(img){
        let url = URL.createObjectURL(new Blob([this.edgeInstallIcon], {type: 'image/svg+xml'}));
        img.addEventListener('load', () => URL.revokeObjectURL(url), {once: true});
        img.src = url;
    }, this);
}




/* getters n setters */

get additionalContent(){ return(this._additionalContent); }
set additionalContent(v){
    this._additionalContent = v;
    if (this.additionalContentDOM instanceof Element){ this.additionalContentDOM.innerHTML = this._additionalContent; }
}
get cheatCode(){ return(this._cheatCode); }
set cheatCode(v){
    this._cheatCode = v;
    if (this.isNotNull(this._cheatCode)){
        this._cheatIdx = 0;
        this._cheatChars = [];
        this._cheatFound = false;
        for(let i=0; i<this._cheatCode.length; i++){ this._cheatChars.push(this._cheatCode.charCodeAt(i)); }
        if (this.cheatListener instanceof Function){ document.removeEventListener('keypress', this.cheatListener); }

        this.cheatListener = this.getEventListenerWrapper(function(evt, selfReference){

            if (((selfReference._cheatIdx === 0) && (evt.keyCode === selfReference._cheatChars[selfReference._cheatIdx]))){
                selfReference._cheatFound = true;
            }else if ((selfReference._cheatIdx > 0) && selfReference._cheatFound && (evt.keyCode === selfReference._cheatChars[selfReference._cheatIdx])){
                selfReference._cheatFound = true;
            }else{
                selfReference._cheatFound = false;
                selfReference._cheatIdx = 0;
            }
            if (selfReference._cheatFound && (selfReference._cheatIdx == (selfReference._cheatChars.length -1))){

                // the cheat was found
                selfReference._app.log(`${selfReference._className} | cheatCode was successfully entered by user`);
                selfReference._cheatIdx = 0;
                selfReference._cheatFound = false;
                document.removeEventListener('keypress', selfReference.cheatListener);

                if (selfReference.cheatCodeCallback instanceof Function){
                    try {
                        selfReference.cheatCodeCallback(selfReference);
                    }catch(e){
                        selfReference._app.log(`${selfRefernce._className} | cheatCodeCallback threw unexpectedly: ${e}`);
                    }
                }
            }else if (selfReference._cheatFound){
                selfReference._cheatIdx ++;
                if (selfReference._cheatIdx > (selfReference._cheatChars.length -1)){ selfReference._cheatIdx = 0;}
            }
        });

        document.addEventListener('keypress', this.cheatListener);
    }
}


get iosShareIcon(){
    return(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg
       xmlns:dc="http://purl.org/dc/elements/1.1/"
       xmlns:cc="http://creativecommons.org/ns#"
       xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
       xmlns:svg="http://www.w3.org/2000/svg"
       xmlns="http://www.w3.org/2000/svg"
       xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
       xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
       width="9.9570303mm"
       height="12.848239mm"
       viewBox="0 0 9.9570303 12.848239"
       version="1.1"
       id="svg3584"
       inkscape:version="1.0.1 (3bc2e813f5, 2020-09-07)"
       sodipodi:docname="iOS_share_system_new.svg">
      <defs
         id="defs3578" />
      <sodipodi:namedview
         id="base"
         pagecolor="#ffffff"
         bordercolor="#666666"
         borderopacity="1.0"
         inkscape:pageopacity="0.0"
         inkscape:pageshadow="2"
         inkscape:zoom="9.9022964"
         inkscape:cx="-13.598954"
         inkscape:cy="17.464872"
         inkscape:document-units="mm"
         inkscape:current-layer="layer1"
         inkscape:document-rotation="0"
         showgrid="false"
         inkscape:pagecheckerboard="true"
         fit-margin-top="0"
         fit-margin-left="0"
         fit-margin-right="0"
         fit-margin-bottom="0"
         inkscape:window-width="1711"
         inkscape:window-height="1047"
         inkscape:window-x="30"
         inkscape:window-y="23"
         inkscape:window-maximized="0" />
      <metadata
         id="metadata3581">
        <rdf:RDF>
          <cc:Work
             rdf:about="">
            <dc:format>image/svg+xml</dc:format>
            <dc:type
               rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
            <dc:title></dc:title>
          </cc:Work>
        </rdf:RDF>
      </metadata>
      <g
         inkscape:label="Layer 1"
         inkscape:groupmode="layer"
         id="layer1"
         transform="translate(-109.43139,-108.80071)">
        <path
           style="color:#000000;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;font-variant-ligatures:normal;font-variant-position:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-alternates:normal;font-variant-east-asian:normal;font-feature-settings:normal;font-variation-settings:normal;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;text-orientation:mixed;dominant-baseline:auto;baseline-shift:baseline;text-anchor:start;white-space:normal;shape-padding:0;shape-margin:0;inline-size:0;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000000;solid-opacity:1;vector-effect:none;fill:#161719;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.264583;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate;stop-color:#000000"
           d="m 116.12817,113.34036 h 1.71924 c 0.42309,0 0.75195,0.32691 0.75195,0.75 v 6.01758 c 0,0.4231 -0.32886,0.75195 -0.75195,0.75195 h -6.87696 c -0.4231,0 -0.75,-0.32885 -0.75,-0.75195 v -6.01758 c 0,-0.42309 0.3269,-0.75 0.75,-0.75 h 1.71924 v -0.79101 h -1.71924 c -0.84669,0 -1.53906,0.69432 -1.53906,1.54101 v 6.01758 c 0,0.84669 0.69237,1.54101 1.53906,1.54101 h 6.87696 c 0.84669,0 1.54101,-0.69432 1.54101,-1.54101 v -6.01758 c 0,-0.84669 -0.69432,-1.54101 -1.54101,-1.54101 h -1.71924 z"
           id="path2938"
           sodipodi:nodetypes="cssssssssccsssssssscc" />
        <path
           id="rect2947"
           style="fill:#161719;fill-opacity:1;stroke:none;stroke-width:0.264583;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
           d="m 113.88049,109.32988 -1.71463,1.71462 c -0.14693,0.14694 -0.14709,0.38362 -5.3e-4,0.5302 0.14658,0.14658 0.38275,0.14591 0.52969,-0.001 l 1.28157,-1.28158 v 6.65541 c 0,0.2078 0.16736,0.37517 0.37517,0.37517 h 0.0326 c 0.20781,0 0.37517,-0.16737 0.37517,-0.37517 v -6.73913 l 1.36529,1.3653 c 0.14694,0.14693 0.38311,0.14709 0.52969,5.2e-4 0.14658,-0.14658 0.14642,-0.38274 -5.3e-4,-0.52968 l -1.71514,-1.71462 c -0.001,-0.001 -0.52916,-0.52916 -0.52916,-0.52916 -0.47644,0.47182 -0.47644,0.47439 -0.52916,0.52917 z"
           sodipodi:nodetypes="ccssscsssscsscccc" />
      </g>
    </svg>`);
}
get iosAddToHomescreenIcon(){
    return(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg
           xmlns:dc="http://purl.org/dc/elements/1.1/"
           xmlns:cc="http://creativecommons.org/ns#"
           xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
           xmlns:svg="http://www.w3.org/2000/svg"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
           xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
           width="10.286152mm"
           height="10.360161mm"
           viewBox="0 0 10.286152 10.360161"
           version="1.1"
           id="svg1039"
           sodipodi:docname="iOS_add_system_new.svg"
           inkscape:version="1.0.1 (3bc2e813f5, 2020-09-07)">
          <defs
             id="defs1033" />
          <sodipodi:namedview
             id="base"
             pagecolor="#ffffff"
             bordercolor="#666666"
             borderopacity="1.0"
             inkscape:pageopacity="0.0"
             inkscape:pageshadow="2"
             inkscape:zoom="3.959798"
             inkscape:cx="19.438397"
             inkscape:cy="19.578256"
             inkscape:document-units="mm"
             inkscape:current-layer="layer1"
             inkscape:document-rotation="0"
             showgrid="false"
             inkscape:pagecheckerboard="true"
             fit-margin-top="0"
             fit-margin-left="0"
             fit-margin-right="0"
             fit-margin-bottom="0"
             inkscape:window-width="1304"
             inkscape:window-height="679"
             inkscape:window-x="30"
             inkscape:window-y="23"
             inkscape:window-maximized="0" />
          <metadata
             id="metadata1036">
            <rdf:RDF>
              <cc:Work
                 rdf:about="">
                <dc:format>image/svg+xml</dc:format>
                <dc:type
                   rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
                <dc:title></dc:title>
              </cc:Work>
            </rdf:RDF>
          </metadata>
          <g
             inkscape:label="Layer 1"
             inkscape:groupmode="layer"
             id="layer1"
             transform="translate(-100.69026,-142.98659)">
            <rect
               style="fill:none;stroke:#161719;stroke-width:0.892175;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
               id="rect981"
               width="9.3939772"
               height="9.4679861"
               x="101.13634"
               y="143.43268"
               ry="2.0276234" />
            <path
               id="rect983"
               style="fill:none;stroke:#161719;stroke-width:0.892167;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
               d="m 105.80544,145.83348 v 2.30529 h -2.30529 v 0.0558 h 2.30529 v 2.30528 h 0.0558 v -2.30528 h 2.30528 v -0.0558 h -2.30528 v -2.30529 z" />
          </g>
    </svg>`);
}

/*
    MS Edge PWA Install Icon
*/
get edgeInstallIcon(){return(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   width="10.286152mm"
   height="10.360161mm"
   viewBox="0 0 10.286152 10.360161"
   version="1.1"
   id="svg1039"
   sodipodi:docname="tmp2.svg"
   inkscape:version="1.0.2 (e86c8708, 2021-01-15)">
  <defs
     id="defs1033" />
  <sodipodi:namedview
     id="base"
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1.0"
     inkscape:pageopacity="0.0"
     inkscape:pageshadow="2"
     inkscape:zoom="9.1646743"
     inkscape:cx="19.438397"
     inkscape:cy="19.578257"
     inkscape:document-units="mm"
     inkscape:current-layer="layer1"
     inkscape:document-rotation="0"
     showgrid="true"
     inkscape:pagecheckerboard="false"
     fit-margin-top="0"
     fit-margin-left="0"
     fit-margin-right="0"
     fit-margin-bottom="0"
     inkscape:window-width="1920"
     inkscape:window-height="1147"
     inkscape:window-x="1440"
     inkscape:window-y="25"
     inkscape:window-maximized="1">
    <inkscape:grid
       type="xygrid"
       id="grid42" />
  </sodipodi:namedview>
  <metadata
     id="metadata1036">
    <rdf:RDF>
      <cc:Work
         rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type
           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
        <dc:title></dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <g
     inkscape:label="Layer 1"
     inkscape:groupmode="layer"
     id="layer1"
     transform="translate(-100.69026,-142.98659)">
    <g
       id="g118"
       transform="matrix(0.5,0,0,0.5,55.328088,76.48551)">
      <rect
         style="fill:none;stroke:#161719;stroke-width:0.892175;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
         id="rect981"
         width="9.3939772"
         height="9.4679861"
         x="101.13634"
         y="143.43268"
         ry="0.92799997" />
      <rect
         style="fill:none;stroke:#161719;stroke-width:0.892175;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
         id="rect981-4"
         width="9.3939772"
         height="9.4679861"
         x="91.732025"
         y="143.43268"
         ry="0.92799997" />
      <rect
         style="fill:none;stroke:#161719;stroke-width:0.892175;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
         id="rect981-46"
         width="9.3939772"
         height="9.4679861"
         x="91.732025"
         y="133.99136"
         ry="0.92799997" />
      <path
         id="rect983-2"
         style="fill:none;stroke:#161719;stroke-width:0.892167;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
         d="m 105.80544,136.39217 v 2.30529 h -2.30529 v 0.0558 h 2.30529 v 2.30528 h 0.0558 v -2.30528 h 2.30528 v -0.0558 h -2.30528 v -2.30529 z" />
    </g>
  </g>
</svg>`); }


// Chrome PWA Install Icon
get chromeInstallIcon(){return(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   width="9.9570303mm"
   height="9.8774118mm"
   viewBox="0 0 9.9570303 9.8774119"
   version="1.1"
   id="svg3584"
   inkscape:version="1.0.2 (e86c8708, 2021-01-15)"
   sodipodi:docname="tmp.svg">
  <defs
     id="defs3578" />
  <sodipodi:namedview
     id="base"
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1.0"
     inkscape:pageopacity="0.0"
     inkscape:pageshadow="2"
     inkscape:zoom="9.9022964"
     inkscape:cx="14.591542"
     inkscape:cy="31.944759"
     inkscape:document-units="mm"
     inkscape:current-layer="layer1"
     inkscape:document-rotation="0"
     showgrid="true"
     inkscape:pagecheckerboard="false"
     fit-margin-top="0"
     fit-margin-left="0"
     fit-margin-right="0"
     fit-margin-bottom="0"
     inkscape:window-width="1920"
     inkscape:window-height="1147"
     inkscape:window-x="1440"
     inkscape:window-y="25"
     inkscape:window-maximized="1">
    <inkscape:grid
       type="xygrid"
       id="grid852"
       originx="-1.5039822e-14"
       originy="-0.57362999" />
  </sodipodi:namedview>
  <metadata
     id="metadata3581">
    <rdf:RDF>
      <cc:Work
         rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type
           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
        <dc:title></dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <g
     inkscape:label="Layer 1"
     inkscape:groupmode="layer"
     id="layer1"
     transform="translate(-109.43139,-109.37434)">
    <g
       id="g867">
      <path
         style="color:#000000;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;font-variant-ligatures:normal;font-variant-position:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-alternates:normal;font-variant-east-asian:normal;font-feature-settings:normal;font-variation-settings:normal;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;text-orientation:mixed;dominant-baseline:auto;baseline-shift:baseline;text-anchor:start;white-space:normal;shape-padding:0;shape-margin:0;inline-size:0;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000000;solid-opacity:1;vector-effect:none;fill:#161719;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.264583;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate;stop-color:#000000"
         d="m 118.59936,115.67785 v 1.25508 c 0,0.4231 -0.32886,0.75195 -0.75195,0.75195 h -6.87696 c -0.4231,0 -0.75,-0.32885 -0.75,-0.75195 v -6.01758 c 0,-0.42309 0.3269,-0.75 0.75,-0.75 0,0 2.4739,-0.009 3.30674,0 0.59775,0.006 0.59813,-0.79101 0,-0.79101 -0.88633,0 -3.30674,0 -3.30674,0 -0.84669,0 -1.53906,0.69432 -1.53906,1.54101 v 6.01758 c 0,0.84669 0.69237,1.54101 1.53906,1.54101 h 6.87696 c 0.84669,0 1.54101,-0.69432 1.54101,-1.54101 v -1.25508 c -0.0408,-0.61414 -0.80614,-0.58429 -0.78906,0 z"
         id="path2938"
         sodipodi:nodetypes="csssssssssssssscc" />
      <path
         id="rect2947"
         style="fill:#161719;fill-opacity:1;stroke:none;stroke-width:0.250843;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
         d="m 117.03431,114.44192 1.71462,-1.54117 c 0.14693,-0.13207 0.14709,-0.34481 5.3e-4,-0.47656 -0.14658,-0.13175 -0.38275,-0.13115 -0.52969,9e-4 l -1.28156,1.15193 v -3.86547 c 0,-0.18677 -0.16736,-0.33721 -0.37517,-0.33721 h -0.0326 c -0.20781,0 -0.37517,0.15044 -0.37517,0.33721 v 3.94072 l -1.36529,-1.22718 c -0.14694,-0.13207 -0.38312,-0.13221 -0.5297,-4.7e-4 -0.14658,0.13175 -0.14642,0.34402 5.3e-4,0.4761 l 1.71515,1.54116 0.52916,0.47563 c 0.47644,-0.42409 0.47644,-0.4264 0.52916,-0.47564 z"
         sodipodi:nodetypes="ccssscsssscsscccc" />
      <path
         style="fill:#161719;fill-opacity:1;stroke:#161719;stroke-width:0.264583px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
         d="m 111.23491,118.06112 -0.52917,1.05834 h 7.40833 l -0.52916,-1.05834 z"
         id="path854" />
    </g>
  </g>
</svg>`)}




/*
    identifyClient()
    the year is 2022, and there's still not a better way to know what browser engine
    you're inside of. No really. Should you doubt me, I suggest a quick googlin'
    as every caveat you will read on the internet says ... "test features not platform"
    and that's laudible, but hun, here's the deal:

    sometimes you just need to know. this is for that.
*/
identifyClient(){

    if (navigator){

        // detect iOS
        if (
            ('vendor' in navigator) &&
            (/Apple/.test(navigator.vendor)) &&
            ('maxTouchPoints' in navigator) &&
            (parseInt(navigator.maxTouchPoints) > 0)
        ){
            return('Safari Mobile');

        // detect desktop safari
        } else if (
            ('vendor' in navigator) &&
            (/Apple/.test(navigator.vendor)) &&
            ('maxTouchPoints' in navigator) &&
            (parseInt(navigator.maxTouchPoints) == 0)
        ){
            return('Safari');

        // detect edge
        }else if (
            (/Edg\//.test(navigator.userAgent)) ||
            (/Edge\//.test(navigator.userAgent))
        ){
            return('Edge');

        // detect chrome
        } else if (
            ('vendor' in navigator) &&
            (/Google/.test(navigator.vendor)) &&
            (/Chrome\//.test(navigator.userAgent))
        ){
            return('Chrome');

        // detect firefox
        }else if (
            (/Firefox\//.test(navigator.userAgent))
        ){
            return('Firefox');

        // no idea
        }else{
            return(null);
        }
    }else{
        return(null);
    }
}




} // end ihDialog class
