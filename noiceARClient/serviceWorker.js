/*
    serviceWorker.js
    this is the serviceWorker thread.

    this documentation is helpful:
    https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope

    there are 4 "magic" variables in here which are technically properties
    of the ServiceWorkerGlobalScope:

        * self          like "this" for ServiceWorkerGlobalScope as far as I can tell
                        events are received on this object

        * clients       not really sure, but doesn't appear to be supported in safari anyhow

        * registration  the handle by which you deal with loading / activating / reloading the serviceWorker
                        https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

        * caches        this is how you talk to the cache and there's a whole lot to it
                        https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage
*/




/*
    thread constuctor
    make a noiceWorkerThread object, giving you all the noice goodies
    this is the only code that executes "raw" on file include
    everything else is event driven
*/
try {
    importScripts(
        './lib/noice/noiceCore.js',
        './lib/noice/noiceIndexedDB.js',
        './lib/noice/noiceWorkerThread.js',
        './config/appConfig.js'
    );
}catch(e){
    throw(`serviceWorker.js thread threw unexpectedly loading libraries: ${e}`);
}
let thread = new noiceWorkerThread({
    isServiceWorker: true,
    threadName:     'serviceWorker',
    signalHandlers: {
        refreshApp:   refreshApp,
        forceRefresh: forceRefresh
    },
    config:     _applicationConfig
});



/*
    serviceWorker lifecycle listeners
    these signal handlers are for the built-in events for serviceWorker

    NOTE: we're just catching install, fetch and activate, but there are lots more
        https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope
    contentdelete, , notificationclick, notificationclose,push, pushsubscriptionchange and sync
*/


/*
    install
    open the cache, add all the assets to it
    https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/install_event
*/
self.addEventListener('install', function(evt){
    thread.threadHandle = evt.source;
    evt.waitUntil(
        caches.open(thread.config.cache.name).then(function(cache){
            cache.addAll(thread.config.cache.assets).then(function(){
                //console.log('serviceWorker ready');
                thread.log('loaded');
            });
        }).catch(function(error){
            thread.log(`install handler | cache open threw unexpectedly:  ${error}`, true);
        })
    );
});


/*
    activate
    https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/activate_event

    TO-DO: use this to clean up old cache files
    like iterate the file list in the loaded cache, anything that's not in
    thread.config.cache.assets, dump it.
*/
self.addEventListener('activate', function(evt){
    thread.threadHandle = evt.source;
    thread.log(`activate handler | called`);
});


/*
    fetch
    intercept network requests, match them against the cache
    and return the cache value or the result of the network request
    lots of potentially interesting things could be done here ...
*/
self.addEventListener("fetch", function(evt){
    thread.threadHandle = evt.source;
    evt.respondWith(
        caches.match(evt.request).then(function(cacheEntry){
            return (cacheEntry || fetch(evt.request));
        }).catch(function(error){
            thread.log(`fetch handler | cache match threw unexpectedly: ${error}`);
        })
    );
});




/*
    signal handlers
*/


/*
    refreshApp(signalData)
    this pulls everything in assets back over the network and
    writes the item to the cache. If any item was differnet
    (that is, a differnt version of the application code exists
    on the server), this will return true, else false.
*/
async function refreshApp(signalData, eventObject){

    thread.threadHandle = eventObject.source;
    thread.log(`serviceWorker | refreshApp | called`);

    async function helper(){

        // open the cache
        let cache = await caches.open(thread.config.cache.name).catch(function(error){
            // exit for fail to open cache
            let err = `refreshApp | cache open threw unexpectedly:  ${error}`
            thread.log(err);
            thread.signalParent({
                type:   'refreshAppComplete',
                data:   { error:  true, errorMessage: err }
            });
            throw(err);
        });

        // fetch all the assets again, explicitly
        thread.log(`refreshApp | fetching ${thread.config.cache.assets.length} assets ...`);
        let pk = [];
        thread.config.cache.assets.forEach(function(url){
            pk.push(fetch(`${url}?${new Date()})`).catch(function(error){
                thread.log(`serviceWorker | refreshApp | fetch error: ${error} | url: ${url}`);
            }));
        });
        let responses = await Promise.all(pk).catch(function(error){
            // exit for fetch failures to open cache
            let err = `serviceWorker | asset fetch threw unexpectedly:  ${error}`
            thread.log(err);
            thread.signalParent({
                type:   'refreshAppComplete',
                data:   { error:  true, errorMessage: err }
            });
            throw(err);
        });
        thread.log(`refreshApp | completed  ${thread.config.cache.assets.length} network requests, indexing ...`)

        // if the fetched version is different than what's in the cache update
        let updated = [];
        responses.forEach(function(response, idx){
            // fetch the cache version
            updated.push(new Promise(function(t,b){
                let different = false;
                cache.match(thread.config.cache.assets[idx]).catch(function(error){
                    b(`refreshApp | unexpected error getting ${thread.config.cache.assets[idx]} from cache: ${error}`);
                }).then(function(cacheCopy){

                    cache.put(thread.config.cache.assets[idx], response).catch(function(error){
                        b(`refreshApp | unexpected error putting ${thread.config.cache.assets[idx]} in cache: ${error}`);
                    }).then(function(){
                        cache.match(thread.config.cache.assets[idx]).catch(function(error){
                            b(`refreshApp | unexpected error geting ${thread.config.cache.assets[idx]} in cache (after put?!): ${error}`);
                        }).then(function(newCacheCopy){
                            if (/\.png$/i.test(thread.config.cache.assets[idx])){
                                // TO-DO -- figure out how to do binary comparison maybe MD5??
                                t(false)
                            }else{
                                if (thread.isNotNull(cacheCopy)){
                                    try {
                                        cacheCopy.text().catch(function(error){
                                            b(`refreshApp | unexpected error serializing ${thread.config.cache.assets[idx]} contents to text (cache old copy): ${error}`);
                                        }).then(function(cacheOldText){
                                            newCacheCopy.text().catch(function(error){
                                                b(`refreshApp | unexpected error serializing ${thread.config.cache.assets[idx]} contents to text (cache new copy): ${error}`);
                                            }).then(function(cacheNewText){
                                                t(cacheOldText != cacheNewText);
                                            })
                                        });
                                    }catch(e){
                                        b(`refreshApp | unexpected error comparing by text ${thread.config.cache.assets[idx]}: ${e}`);
                                    }
                                }else{
                                    thread.log(`cacheCopy is null for: ${thread.config.cache.assets[idx]}, ignoring`);
                                    t(true);
                                }
                            }
                        });
                    });
                });
            }));
        }); // end itterating fetch responses for assets

        let updateMap = await Promise.all(updated).catch(function(error){
            let err = `refreshApp | failed to process cache:  ${error}`
            thread.log(err);
            thread.signalParent({
                type:   'refreshAppComplete',
                data:   { error:  true, errorMessage: err }
            });
            throw(err);
        });
        let hasUpdate = false;
        updateMap.forEach(function(v){ if (! hasUpdate){ hasUpdate = (v === true); } });
        thread.signalParent({
            type:   'refreshAppComplete',
            data:   { hasUpdate: hasUpdate }
        });
        return(hasUpdate);
    }

    // use waitUntil to be sure the thread is awake
    eventObject.waitUntil(helper());

} // end refreshApp




/*
    forceRefresh()
    for when you're not messin' around
    this deletes all caches we have access to, then reloads the serviceWorker
*/
function forceRefresh(signalData, eventObject){
    thread.threadHandle = eventObject.source;
    thread.log(`serviceWorker | forceRefresh() called`);

    let catchAll = false;
    return(new Promise(function(toot, boot){


        // no ducks given. quack sucka
        let keysError = false;
        self.caches.keys().catch(function(error){
            keysError = true;
            boot(`forceRefresh | self.caches.keys() threw unexpectedly: ${error}`);
        }).then(function(cacheList){
            if (! keysError){
                let pk = [];
                cacheList.forEach(function(cacheId){
                    pk.push(new Promise(function(t,b){
                        let deleteErr = false;
                        self.caches.delete(cacheId).catch(function(error){
                            deleteErr = true;
                            thread.log(`forceRefresh | caches[${cacheId}] failed to delete?!: ${error}`);
                            b(error);
                        }).then(function(){
                            thread.log(`forceRefresh | caches[${cacheId}] deleted successfully`);
                            t(true);
                        });
                    }));
                });
                let delAllError = false;
                Promise.all(pk).catch(function(error){
                    delAllError = true;
                    boot(`forceRefresh | all caches did not delete successfully: ${error}`);
                }).then(function(){
                    if (! delAllError){
                        let regErr = false;
                        self.registration.update().catch(function(error){
                            regErr = true;
                            boot(`forceRefresh | caches deleted, but serviceWorker egistration update failed?: ${error}`);
                        }).then(function(newRegistration){
                            if (! regErr){
                                thread.log(`forceRefresh | complete with success`);
                                toot(true);
                            }
                        });
                    }
                });
            }
        });


    }).catch(function(error){
        catchAll = true;
        thread.log(error);
        thread.signalParent({
            type:   'forceRefreshComplete',
            data:   { error: true, errorMessage: error }
        });
    }).then(function(){
        if (! catchAll){
            thread.signalParent({
                type:   'forceRefreshComplete',
                data:   { error: false, hasUpdate: true }
            });
        }
    }));
}
