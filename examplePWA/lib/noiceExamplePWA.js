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
        let that = this;

        /*
            LOH 8/27/21 @ 1321 -- lunch
            next step ... lets dream up something like
            the nscan startupDialog, but more like a splash screen
            for instance, not necessarily needing a start button
        */
        this.startupDialog = new startupDialog({
            title:                  `${this.appName} (v${this.version})`,
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
                // start up the app (note: startup() will call setupUI() for us and the rest)
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
