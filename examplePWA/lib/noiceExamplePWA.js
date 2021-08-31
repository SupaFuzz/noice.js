class noiceExamplePWA extends noiceApplicationCore {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({


        // object infrastructure
        _version:                       1,
        _className:                     'noiceExamplePWA',
        localStorageKey:                'noiceExamplePWA_App',

        // default values for flags
        restoreOnInstantiate:           true,
        enableServiceworker:            true,
        enforceAppMode:                 true,

        // signalHandlers for async messages from the threads
        threadSignalHandlers: {
            syncWorker: {
                statusUpdate:  function(args, myself){ myself.handleSyncWorkerStatusUpdate(args); }
            }
        },

        // call this function when anything logs with the crashed flag
        crashCallback:                  function(myself){ myself.crashedDialog(); }

        },defaults),callback);

        // show the install banner or the startupDialog, depending
        this.initUI();



        /*
            can we init the syncWorker thread? yes we can.
            can we call the phoneHome method on it?
        let callError = false;
        that.threadResponse({
            threadName:         'syncWorker',
            postMessage:        { type: 'init', data: {arbitrary: 'data'}},
            awaitResponseType:  'initComplete'
        }).catch(function(error){
            callError = true;
            console.log(`syncWorker/init call failed?: ${error}`);
        }).then(function(responseData){
            if (! callError){
                if (responseData.error){
                    console.log(`syncWorker/init failed: ${responseData.errorMessage}`);
                }else{
                    console.log(`syncWorker/init success`);
                    console.log(responseData);

                    // call phoneHome
                    let phError = false;
                    that.threadResponse({
                        threadName:         'syncWorker',
                        postMessage:        { type: 'phoneHome', data: {arbitrary: 'data'}},
                        awaitResponseType:  'phoneHomeComplete'
                    }).catch(function(error){
                        phError = true;
                        console.log(`syncWorker/phoneHome call failed: ${error}`);
                    }).then(function(resp){
                        if (! phError){
                            console.log(`syncWorker/phoneHome success`, resp)
                        }
                    });

                }
            }
        })
        */

}




/*
    initUI()
    show the install banner or the startup dialog
    depending on if we're in chrome standalone mode or
    iosAppMode and if the enforceAppMode flag is set
*/
initUI(){
    let that = this;

    let override = false;
    try {
        override = that.getAppData('_enforceAppModeOverride');
    }catch(e){
        this.log(`${this._className} | initUI() | getAppData threw unexpectedly: ${e} `);
    }

    if (that.enforceAppMode && (! that.appMode) && (! override)){

        // show the install banner
        that.log(`initUI | showing install banner`);
        this.installBanner = new installHelpDialog({
            cheatCode: 'shabidoo',
            cheatCodeCallback: function(selfReference){

                // cheat code allows one to bypass the install banner from desktop browser
                selfReference._app.writeAppData({ '_enforceAppModeOverride': true });
                selfReference._app.installBanner.remove();
                selfReference._app.initUI();
            },
            _app: that
        }).append(document.body);

    }else{

        // setup startupDialog
        this.startupDialog = new startupDialog({
            title:        `${this.appName} (v${this.version})`,
            welcomeTitle: 'Welcome to noice.js',
            pieCharts: [
                { name:'db',      fill:'rgba(6, 133, 135, .5)' },
                { name:'network', fill:'rgba(17, 47, 65, .2)' }
            ],
            showCancelBtn: true,
            cancelButtonCallback:   function(self, evt){
                evt.target.disabled = true;
                let errflg = false;
                that.threadResponse({
                  threadName:         'serviceWorker',
                  isServiceWorker:    true,
                  postMessage:        { type: 'forceRefresh' },
                  awaitResponseType:  'forceRefreshComplete'
                }).catch(function(error){
                  errflg = true;
                  console.log(`call error: ${error}`);
                }).then(function(msg){
                  console.log('success?');
                  console.log(msg);
                  window.location.reload();
                });
            },
            startButtonCallback:    function(self, evt){
                evt.target.disabled = true;
                that.startup();
            },
            animationCallback:      function(self){
                if (self.hasOwnProperty('_animatePolygon')){
                    self._animatePolygon.phase = -(((self._animationFrame%2000)/2000) * Math.PI * 2);
                    self._animatePolygon.fillOpacity = (self._animatePolygon.baseFillOpacity + (.15 * ((Math.cos(2*Math.PI * (self._animationFrame%250)/250)) + .5)));
                    if (((self._animationFrame%100)/100) == 0){
                        self._animatePolygon.edges = 3 + Math.floor(Math.random() * 5);
                    }
                }
            },
            animationStartCallback: function(self){
                if (! self.hasOwnProperty('_animatePolygon')){
                    self._animatePolygon = new noiceRadialPolygonPath({
                        edges:          3,
                        radius:         ((self.chartSize/2) * (6/8)),
                        baseFillOpacity:.25
                    }).append(self.svgDOMObject);
                }
            },
            animationExitCallback:  function(self){
                if (self.hasOwnProperty('_animatePolygon')){
                    self._animatePolygon.remove();
                    delete self._animatePolygon
                }
            },
            showPieChart: false,
            welcomeMode:  true,
            _app:         this
        }).append(document.body);
    }
}




/*
    startup()
    setup the application and dump the user at the default UI
*/
startup(){
    let that = this;

    /*
        just know that everything below will eventually happen
        in a then() block after calling the phoneHome() signal
        against syncWorker.

        But for now we have no backend, so we're just fleshing
        out the rest and will return to that biz later
    */



    // instantiate UIs
    that.UIs = {
        main:   new noiceExamplePWAMainUI({
            _app:       that,
            hdrTitle:   `${that.appName} ${that.version}`,
            hdrMsg:     'ready'
        })
    }

    // remove startupDialog
    that.startupDialog.remove();


    // make the the screen holder and display defaultUI
    that.screenHolder = new noiceCoreUIScreenHolder({
        UIList:         that.UIs,
        defaultUI:      'main',
        showDefaultUI:  true
    }).append(document.body);



    /*
        LOH 8/30/21 @ 1638
        installHelpDialog is done with a clean cheat code implementation!
        also cleaned up the CSS around it quite thoroughly.

        next up:
            * make a placeholder in syncWorker to for fetching the file, parsing, etc
              (we will come back to that)

            * make a main UI

            * make a formView

            * make a submit UI
              use this to enter a test dataset

            * make a json file export like dbDump etc

            * take that file, put it in the config directory or whatever
              flesh out the placeholder in syncWorker (end around not having a backend)

            * then let's thing about a backend LevelDB + Express might get the job done
              at the same time it's less of a rabbit hole to just setup a remedy form
              and get the whole thing done start to finish. THEN come back and have the
              custom backend adventure.
    */
}




/*
    handleSyncWorkerStatusUpdate(args)
    handle 'statusUpdate' messages from the syncWorker thread
*/
handleSyncWorkerStatusUpdate(args){
    let that = this;

    // insert shenanigans here
}




/*
    crashedDialog()
    show a dialog, maybe send a crash report, the ship has gone down maytee ...
*/
crashedDialog(){
    let that = this;

    // insert shenanigans here
}




} // end noiceExamplePWA class
