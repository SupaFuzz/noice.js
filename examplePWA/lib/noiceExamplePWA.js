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
        LOH 9/30/21 @ 1504 ...

            * [done] < back button css is horkarooni'd

            * [done] add an updatePosition() callback thing on balloonDialog
              make it so you can define a function that sets the dialog's
              x/y.
                * call that function on append()
                  like an appendCallback() or something

                * add an 'orientationchange' listner to it, and call updatePosition() from it

            * [done] the class default handleClone() on recordEditorUI

            * [done] a pipe to writeRecipe and handleClone() on recipeEditor

            * [done] a dialog to contain the search dialog on recordEditorUI

            * [done] a search mechanism, baked into recordEditorUI would be great

            * file export

            * file import

            * make a remedy form

            * make a syncWorker that knows how to transmit things to it
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




/*
    writeRecipe(rowID, {data})
    this is a pretty dumb indexedDB row writer for demo purposes

        * rowID
          either an entryID value or a GUID this is how we identify the row in the recipes table

        * data, an object of the form { <fieldName>: <fieldValue> ... }

    in all cases, we check for an existing row with rowID, if we find one, we will
    merge {data} with the existing row, before using put() to replace the existing
    row with the updated data. In the case where we can't find it, we merge an empty
    object, but in all cases we are blowing it into the indededDB

    there'll probably end up being something like a _rowMeta field with an object on it
    to keep track of row syncStatus and all of that
*/
writeRecipe(rowID, data){
    let that = this;
    return(new Promise(function(toot, boot){

        // bounce if we don't have rowID
        if (that.isNull(rowID)){
            boot(new noiceException({
                message:        `${that._className} | writeRecipe() | rowID is null`,
                messageNumber:  100,
                thrownBy:       'main thread | writeRecipe'
            }));

        // bounce if we don't have data
        }else if (! (data instanceof Object)){
            boot(new noiceException({
                message:        `${that._className} | writeRecipe(${rowID}) | data is not an Object`,
                messageNumber:  101,
                thrownBy:       'main thread | writeRecipe'
            }));

        // bounce if we don't have the indexedDB yet
        }else if (! (that.indexedDB instanceof noiceIndexedDB)){
            boot(new noiceException({
                message:        `${that._className} | writeRecipe(${rowID}) | indexedDB is not mounted`,
                messageNumber:  102,
                thrownBy:       'main thread | writeRecipe'
            }));

        // do that thang ...
        }else{

            // look for the rowID
            let getAbort = false;
            that.indexedDB.get({
                storeName:  'recipes',
                key:        rowID
            }).catch(function(error){
                if (! (error.hasOwnProperty('messageNumber') && (error.messageNumber == 404))){
                    getAbort = true;
                    boot(new noiceException({
                        message:        `${that._className} | writeRecipe(${rowID}) | indexedDB threw unexpectedly on get(): ${error}`,
                        messageNumber:  103,
                        thrownBy:       'main thread | writeRecipe'
                    }));
                }
            }).then(function(existingRow){
                if (! getAbort){

                    // merge
                    let mergeData = (existingRow instanceof Object)?existingRow:{};
                    Object.keys(data).forEach(function(fieldName){ mergeData[fieldName] = data[fieldName]; });

                    // just in case something dumb happened
                    mergeData.rowID = rowID;

                    // insert _rowMeta
                    mergeData._rowMeta = {
                        queued:     that.epochTimestamp(true),
                        rowStatus:  'queued'
                    }

                    // blow it into the table
                    let putAbort = false;
                    that.indexedDB.put({
                        storeName:  'recipes',
                        object:     mergeData
                    }).catch(function(error){
                        putAbort = true;
                        boot(new noiceException({
                            message:        `${that._className} | writeRecipe(${rowID}) | indexedDB threw unexpectedly on put(): ${error}`,
                            messageNumber:  104,
                            thrownBy:       'main thread | writeRecipe',
                            data:           mergeData
                        }));
                    }).then(function(){
                        // return the merged data on the promise as success
                        if (! putAbort){ toot(mergeData); }
                    });
                }
            });
        }
    }));
}




/*
    echoRecipes()
    dumb toubleshooting tool, dump the contents of recipes table to the console
*/
echoRecipes(){
    let that = this;
    return(new Promise(function(toot, boot){
        let cursorAbort = false;
        that.indexedDB.openCursor({
            storeName:  'recipes',
            callback:   function(cursor){
                if (that.isNotNull(cursor)){
                    console.log(cursor.value);
                    cursor.continue();
                }
            }
        }).catch(function(error){
            cursorAbort = true;
            that.log(`echoRecipes | openCursor threw: ${error}`);
            boot(error);
        }).then(function(){
            if (! cursorAbort){
                toot(true);
            }
        })
    }))
}




/*
    getRecipeTitlelist()
    return a unique lit of all title values in the recipes table
    there are probably much better ways of doing this. We're writing
    a demo here, m'kay?
*/
getRecipeTitlelist(){
    let that = this;
    let recipeList = {};
    let abrt = false;
    return(new Promise(function(toot, boot){
        that.indexedDB.openCursor({
            storeName:  'recipes',
            indexName:  'title',
            callback:   function(cursor){
                if (that.isNotNull(cursor)){
                    recipeList[cursor.value.title] = 1;
                    cursor.continue();
                }
            }
        }).catch(function(error){
            abrt = true;
            that.log(`${that.className} | getRecipeTitlelist | openCursor threw unexpectedly: ${error}`);
            boot(error);
        }).then(function(){
            if (! abrt){
                toot(Object.keys(recipeList).sort());
            }
        });
    }));
}




/*
    searchRecipesByTitle({
        title:  that.roogleInput.value,

        // insert search options here later

    })

    this searches the recipes table by 'title' attribute
    bydefault anyhow. Would be cool to hack in a case-insensitive
    full-text-search if the search by title index doesn't find stuff
    etc. But again ... this is a demo, no need to go apeshit, LOL

    but seriously though.
    this, when I get back around to it:

    https://hacks.mozilla.org/2014/06/breaking-the-borders-of-indexeddb/

    so many cool db shenanigans ... so many ...
*/
searchRecipesByTitle(args){
    let that = this;
    return(new Promise(function(toot, boot){
        let queryFail = false;
        that.indexedDB.getAll({
            storeName:  'recipes',
            indexName:  'title',
            query:      args.title
        }).catch(function(error){
            queryFail = true;
            that.log(`${that._className} | searchRecipesByTitle | indexedDB.getAll() threw unexpectedly: ${error}`);
            boot(error);
        }).then(function(results){
            if (! queryFail){ toot(results); }
        });
    }));
}




} // end noiceExamplePWA class
