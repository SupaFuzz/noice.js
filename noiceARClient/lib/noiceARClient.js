/*
    noiceARClient.js
    this is a PWA app core upon which we will build an ARClient

    that's right, we're just subclassing the example PWA
    for the LOLz
*/
class noiceARClient extends noiceExamplePWA {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({

        // object infrastructure
        _version:                       1,
        _className:                     'noiceARClient',
        localStorageKey:                'noiceARClient_App',

    }, defaults), callback);
}




/*
    initUI()    override
    show the install banner or the startup dialog but
    with auth extensions
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

        // setup authStartupDialog
        this.startupDialog = new authStartupDialog({
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

                self.welcomeTitle = `Starting ${that.appName}`;
                self.welcomeMessage = "initialize syncWorker thread ..."

                // init the syncWorker thread then startup the UI
                let callError = false;
                that.threadResponse({
                    threadName:         'syncWorker',
                    postMessage:        { type: 'init' },
                    awaitResponseType:  'initComplete'
                }).catch(function(error){
                    callError = true;
                    that.log(`[main thread] syncWorker/init call failed?: ${error}`, true);
                }).then(function(responseData){
                    if (! callError){

                        self.welcomeMessage = 'mounting indexedDB';
                        let mountError = false;
                        new noiceIndexedDB({
                            dbName:           that.config.indexedDBDefinition.dbName,
                            dbVersion:        that.config.indexedDBDefinition.dbVersion,
                            storeDefinitions: that.config.indexedDBDefinition.storeDefinitions
                        }).open({
                            destructiveSetup: false
                        }).catch(function(error){
                            mountError = true;
                            boot(`cannot mount indexedDB: ${error} `);
                        }).then(function(dbHandle){

                            // show the install banner or the startupDialog, depending
                            that.indexedDB = dbHandle;
                            that.startup();

                        });

                    }
                });


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




} // end class
