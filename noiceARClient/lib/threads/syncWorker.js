/*
    syncWorker.js
    This handles syncing the indexedDB tables with the
    server. If you need to talk to the server, this is
    where it's done.

    this one uses BMC Remedy ARS backend
*/




/*
    thread constuctor
    remember paths are relative & this lives in ./lib/threads
*/
try {
    importScripts(
        '../noice/noiceCore.js',
        '../noice/noiceIndexedDB.js',
        '../noice/noiceWorkerThread.js',
        '../../config/appConfig.js'
    );
}catch(e){
    throw(`syncWorker.js thread threw unexpectedly loading libraries: ${e}`);
}
let thread = new noiceWorkerThread({
    threadName:              'syncWorker',
    config:                  _applicationConfig,
    dequeueLocked:           false,
    version:                 1,
    debug:                   true,
    signalHandlers: {
        init:               initializeThread,
        phoneHome:          phoneHome
    },
});




/*
    initializeThread(data)
    mount the indexedDB, if we're online, phoneHome
*/
function initializeThread(data){
    thread.log(`v ${thread.version} | initializeThread | mounting indexedDB: ${thread.config.indexedDBDefinition.dbName}/v${thread.config.indexedDBDefinition.dbVersion} ...`);
    let catchAll = false;
    let returnSignal = "initComplete";
    new Promise(function(toot, boot){

        // just snag these two because we'll need 'em later for api connects
        thread.config.location = {
            protocol: self.location.protocol.replace(':', ''),
            server:   self.location.hostname
        };

        // mount the indexedDB
        let mountError = false;
        new noiceIndexedDB({
            dbName:           thread.config.indexedDBDefinition.dbName,
            dbVersion:        thread.config.indexedDBDefinition.dbVersion,
            storeDefinitions: thread.config.indexedDBDefinition.storeDefinitions
        }).open({
            destructiveSetup: false,
            setupCallback:    function(self){
                thread.log('initializeThread | upgrading database ...');
                thread.signalParent({
                    type:   'statusUpdate',
                    data:   {
                        signal: 'startupMessage',
                        attributes: {
                            showPieChart:   true,
                            runAnimation:   true,
                            dbStatusDetail: 'upgrading database ...'
                        }
                    }
                });
            }
        }).catch(function(error){
            mountError = true;
            boot(`cannot mount indexedDB: ${error} `);
        }).then(function(dbHandle){
            if (! mountError){

                thread.log(`v ${thread.version} | initializeThread | mounted indexedDB`);
                thread.indexedDB = dbHandle;

                // signal the parent
                thread.signalParent({
                    type:   'statusUpdate',
                    data:   {
                        signal: 'startupMessage',
                        attributes: {
                            showPieChart:   true,
                            runAnimation:   false,
                            dbStatusDetail: `mounted ${thread.config.indexedDBDefinition.dbName} v${thread.config.indexedDBDefinition.dbVersion}`
                        }
                    }
                });

                // get database description
                let descError = false;
                dbHandle.getDescription().catch(function(error){
                    descError = true;
                    boot(`mounted indexedDB but failed getDescription()?!: ${error}`);
                }).then(function(desc){
                    if (! descError){
                        toot({
                            error: false,
                            databaseDescription: desc
                        });
                    }
                });
            }
        });

    }).catch(function(error){
        catchAll = true;
        thread.log(error);
        thread.signalParent({ type: returnSignal, data: { error: true, errorMessage: error } });
    }).then(function(returnData){
        if (! catchAll){
            if (! (returnData instanceof Object)){ returnData = {}; }
            if (! (returnData.hasOwnProperty('error'))){ returnData.error = false; }
            thread.signalParent({ type: returnSignal, data: returnData });
        }
    });
}




/*
    phoneHome()
    this will be where we sync data
    this is a catch all function called on a recusrive loop from the main thread
    so it may need to be broken into constituent functions, but in general:

        * pull a delta of the recipes table (so anything modified since the last sync on the server)
        * detect collisions with the journal (modified on server after user modified journal entry)
            * figure out how we want to deal with that, i'm thinking defer the journal writes, pop
              a dialog or something and let the user figure out how they would like to handle the collision
        * dequeue the journal entries, modifies and creates
        * if we've got backups or something do that

*/
function phoneHome(data){
    thread.log(`phoneHome | start`);
    let catchAll = false;
    let returnSignal = "phoneHomeComplete";
    new Promise(function(toot, boot){
        if (self.navigator.onLine){

            /*
                insert shenanigans here
                8/27/21 @ 1605 -- return here after we've fleshed out the rest some

                8/30/21 @ 2220 -- i think the thing to do here is to break out the steps outlined above
                into constituent functions, almost exactly as listed. First phase, all of them are pretty
                much dummies. Second phase, we replace the constituent functions one at a time, wiring it up
                to a known backend like ARS. Third phase, we build a custom backend and point it to that.

            */
            toot(true);

        }else{
            boot('client is not online');
        }
    }).catch(function(error){
        catchAll = true;
        thread.log(error);
        thread.signalParent({ type: returnSignal, data: { error: true, errorMessage: error } });
    }).then(function(returnData){
        if (! catchAll){
            if (! (returnData instanceof Object)){ returnData = {}; }
            if (! (returnData.hasOwnProperty('error'))){ returnData.error = false; }
            thread.signalParent({ type: returnSignal, data: returnData });
        }
    });
}
