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
        _defs:                          {},
        _menu
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

                // snatch dem forms guuuurl!
                that._defs =  { forms: {}, menus: {} };
                let pk = [];
                result.entries.forEach(function(row){
                    if (! (that._defs.hasOwnProperty(row.values.formName))){
                        pk.push(new Promise(function(t,b){
                            let defAbort = false;
                            that.api.getRelatedFormsAndMenus({ schema: row.values.formName }).catch(function(error){
                                defAbort = true;
                                that.log(`${that._className} | startApp() | getRelatedFormsAndMenus(${row.values.formName}) | ${error}`);
                                b(error);
                            }).then(function(def){

                                // merge result with that._defs
                                ['menus', 'forms'].forEach(function(kind){
                                    if (def[kind] instanceof Object){
                                        Object.keys(def[kind]).forEach(function(thing){
                                            that._defs[kind][thing] = def[kind][thing];
                                        })
                                    }
                                });
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

                        /*
                            LOH 10/15/21 @ 2014
                            we should have all of the big cascade of forms in that._defs

                            next spider the field list for indexes and build an indexedDB definition
                            on the other hand, it may be beneficial to treat this as a server-client only
                            (no offline mode) then to come back and handle that once we've got the UI side
                            nailed down.

                            so actually, the next thing might be to think about how to model a dynamic formView
                            actually, yes I think so.

                            So ... next up:

                                1) dynamic formView, which is a default formView with an overridden
                                   set config(), basically where we've got some ARS parser that spits out
                                   config that formView already knows then calls the super setter or something

                                2) think about the class model we want to stick in front of the indexedDB.
                                   we're going to need to feel around the issue of adding new dataStores for new
                                   forms as they're added. There could be concurrency issues regarding the indexedDB
                                   versioning etc.

                                   Additionally, we're going to want to think about formalizing the 'journal' concept
                                   offhand ...

                                        new noiceARForm({ config: <...> })

                                            -> getFormView({data: <...>})
                                               returns an ARFormView (formView descendant) object populated with the given data
                                               saveCallback, cloneableCallback are piped through internally to handle insertion
                                               into customized indexedDB journal stuff etc, with external callbacks registered
                                               on the noiceARForm object.

                                            -> query({...})
                                               well I'll tell ya what. If this could learn to parse QBE and drive clever indexedDB
                                               queryies on the journal, etc, that'd be the killer thing. Either way, this also
                                               pipes through a laminateJournal thing ... so

                                   gotta think on this
                        */

                        console.log('success');
                        console.log(that._defs);

                        // if you wanna close the dialog and let it go
                        //toot(true);

                    }
                })
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
