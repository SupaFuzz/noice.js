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
        _defs:                          {}
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
                    that.log(`${that._className} | initUI() | startButtonCallback | startApp() threw unexpectedly: ${error}`, true);
                }).then(function(uiHolder){
                    if (! startAbort){
                        evt.target.disabled = false;
                        if (uiHolder instanceof noiceCoreUIScreenHolder){
                            uiHolder.append(document.body);
                            let abrt = false;
                            uiHolder.switchUI('main').catch(function(error){
                                abrt = true;
                                that.log(`${that._className} | startButtonCallback() | cannot give main UI focus?: ${error}`);
                            }).then(function(){
                                if (! abrt){ self.remove(); }
                            })
                        }

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

        // fetch the form definitions from the server
        let defAbort = false;
        that.fetchFormDefs(that.api).catch(function(error){
            defAbort = true;
            that.log(`${that._className} | startApp() | fetchFormDefs() failed: ${error}`);
            boot(error);
        }).then(function(defs){
            if (! defAbort){
                that._defs = defs;

                /*
                    form definitions from server are in {that.defs}
                    for now, blindly create ARForm instances for everything in the list
                    when completed, the ARForm class will setup a separate, private indexedDB
                    for each object instance. To query, we will literally query the ARForm
                    object, and for saving we'll have some callbacks and stuff

                    for now, let's just drive a UI
                */

                // we got the form definitions from the server, now what?
                console.log('success');
                console.log(defs);

                // setup the UIHolder and UIs
                that.UIs = {
                    main:   new noiceARClientMainUI({
                        _app:       that,
                        hdrTitle:   `${that.appName} ${that.version}`,
                        hdrMsg:     'ready',
                        mainContent: that.getFormSelector()
                    }),

                    // LOOSE END: add recordEditorUI instances for each form
                    // but of course we'd need a new recordEditorUI subclass
                    // something like ARRecordEditor or something I dunno ...
                    // we'll come back to that.
                    // For now, a main UI with a form selector
                };
                Object.keys(that._defs.forms).forEach(function(formName){
                    console.log(formName);
                    console.log(that._defs.forms[formName]);
                    that.UIs[formName] = new noiceARForm({
                        _app:       that,
                        formName:   formName,
                        ARSConfig:  that._defs,
                        title:      formName,
                        burgerMenu: that.getBurgerMenu()
                    });
                });


                // make the the screen holder and display defaultUI
                that.screenHolder = new noiceCoreUIScreenHolder({
                    UIList:         that.UIs,
                    defaultUI:      'main',
                    showDefaultUI:  true
                });

                // close the dialog and let the caller give the main UI focus
                toot(that.screenHolder);

            }
        })

    }));


} // end startApp()




/*
    fetchFormDefs(api)
    get all of the forms from noiceARClientForms on the server
    send a logged-in api handle as the argument as we might call this
    in a few different scenarios
*/
fetchFormDefs(api){
    let that = this;

    return(new Promise(function(toot, boot){

        // bounce for no api key
        if (! (api instanceof noiceRemedyAPI)){
            boot(`${that._className} | fetchFormDefs | api handle not provided`);
        }else{

            // update the dialog if it's open
            if (that.startupDialog.onScreen){
                that.startupDialog.welcomeTitle = `Starting ${that.appName}`;
                that.startupDialog.welcomeMessage = "get form list from server ...";
            }

            // get form list!
            let formListAbort = false;
            api.query({
                schema: 'noiceARClientForms',
                fields: ['formName', 'configuration'],
                QBE:    `'Status' = "available"`
            }).catch(function(error){
                formListAbort = true;
                boot(error);
            }).then(function(result){
                if (! formListAbort){

                    if (that.startupDialog.onScreen){
                        that.startupDialog.welcomeMode = false;
                        that.startupDialog.message = `Fetching config for ${result.entries.length} forms`;
                        that.startupDialog.dbStatusDetail = 'idle';
                        that.startupDialog.showPieChart = true;
                        that.startupDialog.updatePieChart('network', 0);
                    }

                    // snatch dem forms guuuurl!
                    let _defs =  { forms: {}, menus: {} };
                    let pk = [];
                    result.entries.forEach(function(row){
                        if (! (_defs.hasOwnProperty(row.values.formName))){
                            pk.push(new Promise(function(t,b){
                                let defAbort = false;
                                that.api.getRelatedFormsAndMenus({ schema: row.values.formName }).catch(function(error){
                                    defAbort = true;
                                    that.log(`${that._className} | startApp() | getRelatedFormsAndMenus(${row.values.formName}) | ${error}`);
                                    b(error);
                                }).then(function(def){

                                    // merge result with _defs
                                    ['menus', 'forms'].forEach(function(kind){
                                        if (def[kind] instanceof Object){
                                            Object.keys(def[kind]).forEach(function(thing){
                                                _defs[kind][thing] = def[kind][thing];
                                            });
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
                            toot(_defs);
                        }
                    })
                }
            });
        }

    }))
}




/*
    getFormSelector()
    get a form selector
*/
getFormSelector(){
    let that = this;
    let formSelectorUI = document.createElement('div');
    formSelectorUI.className = 'formSelectorUI';
    Object.keys(that._defs.forms).forEach(function(formName){
        let item = document.createElement('div');
        item.className = 'formSelectorChoice';
        item.dataset.selected = 'false';
        item.dataset.guid = that.getGUID();

        let h2 = document.createElement('h2');
        h2.className = 'formName';
        h2.textContent = formName;
        item.appendChild(h2);

        let btnBar = document.createElement('div');
        btnBar.className = 'btnContainer';

        let btnOpen = document.createElement('button');
        btnOpen.className = 'btnOpen';
        btnOpen.textContent = 'open';
        btnOpen.addEventListener('click', function(evt){ evt.stopPropagation(); that.handleFormOpen(formName); })
        btnBar.appendChild(btnOpen);

        let btnQueue = document.createElement('button');
        btnQueue.className = 'btnQueue';
        btnQueue.textContent = 'queue';
        btnQueue.addEventListener('click', function(evt){ evt.stopPropagation(); that.handleFormQueue(formName); })
        btnBar.appendChild(btnQueue);

        let btnExport = document.createElement('button');
        btnExport.className = 'btnExport';
        btnExport.textContent = 'export';
        btnExport.addEventListener('click', function(evt){ evt.stopPropagation(); that.handleFormExport(formName); })
        btnBar.appendChild(btnExport);

        item.appendChild(btnBar);

        item.addEventListener("click", function(evt){
            formSelectorUI.querySelectorAll(`.formSelectorChoice[data-selected="true"]:not(.formSelectorChoice[data-guid="${item.dataset.guid}"])`).forEach(function(el){
                el.dataset.selected = false;
            });
            item.dataset.selected = (item.dataset.selected == 'true')?'false':'true';
            //that.handleFormSelect(formName);
        });
        formSelectorUI.appendChild(item);
    });
    return(formSelectorUI);
}




/*
    handleFormOpen(formName)
*/
handleFormOpen(formName){
    console.log(`handleFormOpen(${formName})`);
    return(this.screenHolder.switchUI(formName));
}


/*
    handleFormQueue(formName)
*/
handleFormQueue(formName){
    console.log(`handleFormQueue(${formName})`)
}


/*
    handleFormExport(formName)
*/
handleFormExport(formName){
    console.log(`handleFormExport(${formName})`)
}




} // end class
