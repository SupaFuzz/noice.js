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
        _formDefs:                      {}
    }, defaults), callback);



}




/*
    initUI()    override
    show the install banner or the startup dialog but
    with auth extensions
*/
initUI(){
    let that = this;

    // snag the protocol & hostname (we'll need it for api connects)
    that.config.apiConnect.protocol = window.location.protocol.replace(':', '');
    that.config.apiConnect.server   = window.location.hostname;

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
            welcomeTitle: 'Welcome',
            welcomeMessage: `To begin, enter your AR System Login ID and Password, then touch Login`,
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
                let startAbort = false;
                that.startApp().catch(function(error){
                    startAbort = true;
                    this.log(`${this._className} | initUI() | startButtonCallback | startApp() threw unexpectedly: ${error}`, true);
                }).then(function(){
                    if (! startAbort){
                        evt.target.disabled = false;
                        self.remove();
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
            authCallback:   function(authObject){
                return(new Promise(function(t, b){

                    // merge authObject into apiConnect
                    Object.keys(authObject).forEach(function(k){ that.config.apiConnect[k] = authObject[k]; });

                    // get down!
                    let apiAbort = false;
                    new noiceRemedyAPI(that.config.apiConnect).authenticate().catch(function(error){
                        apiAbort = true;
                        that.log(`${that._className} | initUI() | ARS API / authenticate() threw unexpectedly: ${error}`);
                        b('login failed');
                    }).then(function(api){
                        if (! apiAbort){
                            that.api = api;
                            t(true);
                        }
                    })
                }))
            },
            showPieChart: false,
            welcomeMode:  true,
            _app:         this
        }).append(document.body);

    }
}

/*
    startApp()
*/
startApp(){
    let that = this;

    return(new Promise(function(toot, boot){
        that.startupDialog.welcomeTitle = `Starting ${that.appName}`;
        that.startupDialog.welcomeMessage = "get form list from server ...";

        // get form list!
        let formListAbort = false;
        that.api.query({
            schema: 'noiceARClientForms',
            fields: ['formName', 'configuration'],
            QBE:    `'Status' = "available"`
        }).catch(function(error){
            formListAbort = true;
            boot(error);
        }).then(function(result){
            if (! formListAbort){

                that.startupDialog.welcomeMode = false;
                that.startupDialog.message = `Fetching config for ${result.entries.length} forms`;
                that.startupDialog.dbStatusDetail = 'idle';
                that.startupDialog.showPieChart = true;
                that.startupDialog.updatePieChart('network', 0);

                // fetch dem forms guuuurl!
                that._formDefs = {};
                let pk = [];
                result.entries.forEach(function(row){
                    if (! (that._formDefs.hasOwnProperty(row.values.formName))){
                        pk.push(new Promise(function(t,b){
                            let defAbort = false;
                            that.api.getFormFields({ schema: row.values.formName }).catch(function(error){
                                defAbort = true;
                                that.log(`${that._className} | startApp() | failed fetching def for schema: ${row.values.formName} | ${error}`);
                                b(error);
                            }).then(function(def){
                                that._formDefs[row.values.formName] = {
                                    configuration: row.values.configuration,
                                    fields:        def
                                };
                                // note we can drive the progress pie in here by checking the extent of _formDefs
                                t(true);
                            });
                        }));
                    }
                });
                let defAbort = false;
                Promise.all(pk).catch(function(error){
                    defAbort = true;
                    boot(`failed fetching schema definitions: ${error}`);
                }).then(function(){
                    if (! defAbort){
                        console.log('success');
                        console.log(that._formDefs);
                    }
                })


                /*
                    LOH 10/13/21 @ 1608
                    fixing up getFormDefinitions() cascade in noiceRemedAPI.js
                    after that, then we'll need to build the indexedDB, etc.
                */


                /* remove
                console.log(`I made it this far with API key: ${that.api.token}`);
                console.log(result);
                toot(true);
                */
            }
        });
    }))

/*
    get back to this stuff later, we will eventually have a syncWorker and all
    of that, but gotta work out building the indexedDB def from the remedy defs first ...

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
*/
} // end startApp()



} // end class
