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


        // startup the UI
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
        }),
        recordEditor: new recipeEditorUI({
            _app:       that,
            title:      'create / edit',
            burgerMenu: that.getBurgerMenu()
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
        LOH 9/21/21 @ 1701

        keeping in mind that this is a backend-less implementation, so we aren't ever really
        going to touch the 'recipe' table, nor are we going to do anything with syncWorker
        until we do have a backend ...

        next up:

            * make something like journalAdd({row}) to write rows to indexedDB

            * make something like journalLaminate({rowID}) to get a complete row record from the journal
              we'll tack onto it later when the backend stuff comes around

            * make something like getRecipeFromDB({rowID}) to front-end journalLaminate (again, so we
              can loop in the recipe table when we have one finally), and this would return a formView
              from which we can pull the handle etc

            * make some kinda searchRecipe(<str>) thing that searches indexes, or whatever to get results
              may need extra args like what index, and do we wanna go full-text and all that crapola. But
              something to sit behind search options, and speaking of ...

            * make a search option on recordEditorUI ... baloonDialog, a text entry, perhaps some
              index selectors. Make a tab system for search results (recently added, search result, etc).
              add the ability for named searches. No more main screen searching. One UI per-form.
              And the main screen can be for deciding which form you want.

              WHICH MEANS ... we may want to rethink some of the indexedDB searching nomenclature, etc
              above. eventually we want multiple forms open at once here from the main screen. Can you
              dig this?

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
    args is of the form {
        threadName: 'syncWorker',
        event: {
            data: {
                type:   'statusUpdate',
                data:   {
                    signal:     <theActualMessage>,
                    attributes: <{arbitrary data}>
                }
            }
        }
    }
*/
handleSyncWorkerStatusUpdate(args){
    let that = this;
    let input = args.event.data.data;

    // handle startupMessage signals if the startupDialog is onScreen

    // handle 'indexedDBUpgrade' messages while startupDialog is onScreen
    if ((input.signal == 'startupMessage') && (that.startupDialog.onScreen)){
        if (that.startupDialog.welcomeMode){ that.startupDialog.welcomeMode = false; }
        Object.keys(input.attributes).forEach(function(attribute){
            that.startupDialog[attribute] = input.attributes[attribute];
        })
    }

    // insert more shenanigans here
}




/*
    crashedDialog()
    show a dialog, maybe send a crash report, the ship has gone down maytee ...
*/
crashedDialog(){
    let that = this;

    // insert shenanigans here
}




/*
    checkForUpdates(evt)
    call refreshApp in serviceWorker and pop a dialog to restart the app if there
    is one. Might also later tack on something to call phoneHome into syncWorker
    and pull back new data (after I build the back end).
    evt is optional but would be a click event if present
*/
checkForUpdates(evt){
    let that = this;
    if (evt instanceof Event){ evt.target.disabled = true; }
    let errflg = false;
    that.threadResponse({
        threadName:         'serviceWorker',
        isServiceWorker:    true,
        postMessage:        { type: 'refreshApp' },
        awaitResponseType:  'refreshAppComplete'
    }).catch(function(error){
        errflg = true;
        that.log(`${that._className} | checkForUpdates() | serviceWorker/refreshApp call threw: ${error}`);
        alert(`check for updates failed: ${error}`);
        if (evt instanceof Event){ evt.target.disabled = false; }
    }).then(function(msg){
        if (! errflg){
            if ((msg.data.hasOwnProperty('hasUpdate')) && (msg.data.hasUpdate == true)){
                new Promise(function(toot, boot){
                    let prompt = new noiceCoreUIYNDialog({
                        heading:    'Application Update',
                        message:    `
                            ${that.appName} has installed an update and needs to restart.
                            Touch 'Restart' to restart the app, or touch 'Cancel' to
                            load the update when you exit the app.
                        `,
                        yesButtonTxt: 'Restart',
                        noButtonTxt:  'Cancel',
                        hideCallback:   function(self){
                            toot(self.zTmpDialogResult);
                        }
                    }).show(that.DOMElement);
                    prompt.DOMElement.dataset.update = "true";
                }).then(function(zTmpDialogResult){
                    if (zTmpDialogResult == true){
                        window.location.reload();
                    }
                })
            }else{
                alert("no update available");
                if (evt instanceof Event){ evt.target.disabled = false; }
            }
        }
    });
}




/*
    resetApp(evt)
    dump the journal and the cache and reload
*/
resetApp(evt){
    let that = this;
    that.log(`${that._className} | resetApp | called`)
}




/*
    exportFile(evt)
    dump the entire indexedDB into a json file and let the user download it
*/
exportFile(evt){
    let that = this;
    that.log(`${that._className} | exportFile | called`);
}




/*
    importFile(evt)
    replace the entire indexedDB with a json file
*/
importFile(evt){
    let that = this;
    that.log(`${that._className} | importFile | called`);
}




/*
    getBurgerMenu()
    get an instance of the system-level burger menu
*/
getBurgerMenu(){
    let that = this;
    let _burgerMenu = document.createElement('div');
    _burgerMenu.className = 'burgerMenu';

    let burgerStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr',
        placeItems: 'center'
    }
    Object.keys(burgerStyle).forEach( function(c){ _burgerMenu.style[c] = burgerStyle[c]; } );

    // check for updates button
    let btnUpdate = document.createElement('button');
    btnUpdate.className = "btnUpdate";
    btnUpdate.textContent = 'check for updates';
    btnUpdate.addEventListener('click', function(evt){ that.checkForUpdates(evt); });
    _burgerMenu.appendChild(btnUpdate);

    // reset button
    let btnReset = document.createElement('button');
    btnReset.className = "btnReset";
    btnReset.textContent = 'reset';
    btnReset.addEventListener('click', function(evt){ that.resetApp(evt); });
    _burgerMenu.appendChild(btnReset);

    // export button
    let btnExport = document.createElement('button');
    btnExport.className = "btnExport";
    btnExport.textContent = 'export to file';
    btnExport.addEventListener('click', function(evt){ that.exportFile(evt); });
    _burgerMenu.appendChild(btnExport);

    // import button
    let btnImport = document.createElement('button');
    btnImport.className = "btnImport";
    btnImport.textContent = 'import from file';
    btnImport.addEventListener('click', function(evt){ that.importFile(evt); });
    _burgerMenu.appendChild(btnImport);

    // make 'em all text buttons
    _burgerMenu.querySelectorAll('button').forEach(function(el){ el.classList.add('textButton'); });

    return(_burgerMenu);
}



} // end noiceExamplePWA class
