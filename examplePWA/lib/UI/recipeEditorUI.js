/*
    recipeEditor.js
    this is a recordEditorUI subclass for creating / editing
    recipeFormView objects
*/
class recipeEditorUI extends recordEditorUI {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:           1,
            _className:         'recipeEditor',
            handleNumber:       1
        }, defaults),
        callback
    );

    // setup a custom search menu
    let that = this;
    that.openSearchMenuCallback = function(selfRef){ return(that.handleOpenSearchMenu(selfRef)); }
    that.searchMenu = that.getSearchMenu();

} // end constructor




/*
    addRow() override

*/
async addRow(otherView, autoSelect){
    let that = this;
    this._app.log(`${this._className} | addRow()`);
    let skipForDupe = false;

    let view;
    if (that.isNotNull(otherView) && (otherView instanceof formView)){
        view = otherView;

        // do we already have this one? if so, we gonna exit
        skipForDupe = that.uiHolder.UIList.hasOwnProperty(view.rowID);;


    }else{
        view = await that.makeNewFormView();
    }

    if (! skipForDupe){
        // setup the rowHandle and add it to the handleList
        let viewHandle = view.handle.append(that._DOMElements.handlelist);
        viewHandle.selectCallback = function(selfRef){ return(that.handleRowSelect(viewHandle._DOMElements._handleMain)); }

        // add the formView to our uiHolder with the view's rowID
        this.uiHolder.addUI(view, view.rowID);

        // then select the new rowHandle (this causes real problems in a loop somehow?)
        if (! (autoSelect == false)){ await that.handleRowSelect(viewHandle); }

        // increment our untitled document count
        that.handleNumber++;
    }

    return(true);
}




/*
    makeNewFormView(formView)
    this makes a new reecipeFormView in create mode either with default field values
    if (formView is null), or if formView is presnet, we'll copy in formView.data
    (allowing changeField callbacks etc)
*/
makeNewFormView(externalFormView){
    let that = this;
    return(new Promise(function(toot, boot){
        let newView = new recipeFormView({
            formMode:           'create',
            config:             that._app.config.Forms.recipe,
            _app:               that._app,
            rowTitle:           `Untitled #${that.handleNumber}`,
            cancelButtonText:   '',

            // custom stuff
            handleNumber:       that.handleNumber,

            // callbacks
            saveCallback:       function(formViewReference){ return(that.handleFormViewSave(formViewReference)); },
            cloneCallback:      function(cloneViewReference){ return(that.handleFormViewClone(cloneViewReference)); },
            cloneableCallback:  function(formViewReference, flag){ return(that.toggleCloneIcon(formViewReference, flag)); },
            areYouSureCallback: function(formViewReference, focusArgs){ return(that.saveChangesDialog(formViewReference, focusArgs)); },

            debug:              true,
        });
        if (that.isNotNull(externalFormView) && (externalFormView instanceof formView)){
            newView.rowTitle = externalFormView.rowTitle;
            newView.setData(externalFormView.data).then(function(){
                newView.changeFlag = false;
                toot(newView);
            });
        }else if (that.isNotNull(externalFormView) && (externalFormView instanceof Object)){
            newView.setData(externalFormView).then(function(){
                newView.changeFlag = false;
                toot(newView);
            });
        }else{
            toot(newView)
        }
    }));

}




/*
    toggleCloneIcon(formViewReference, flag)
    this is the cloneableCallback for our formViews
*/
async toggleCloneIcon(formViewReference, flag){
    if (formViewReference.onScreen){ this._DOMElements.btnClone.disabled = (flag == false); }
    return(true);
}



/*
    handleFormViewSave(formViewReference)
    this is the formView's saveCallback, and we pipe it to the app's writeRecipe() function
*/
handleFormViewSave(formViewReference){
    let that = this;

    return(new Promise(function(toot, boot){
        let writeFields = {};
        formViewReference.changedFields.forEach(function(field){
            writeFields[field.fieldName] = field.newValue;
        });
        let writeAbort = false;
        that._app.writeRecipe(formViewReference.rowID, writeFields).catch(function(error){
            writeAbort = true;
            boot(error);
        }).then(function(dbRow){
            if (! writeAbort){
                formViewReference.rowStatus = dbRow._rowMeta.rowStatus;
                toot(dbRow);
            }
        });
    }));
}




/*
    handleFormViewClone(cloneViewReference)
    this is the formView's cloneCallback, the cloneFormViewReference is a
    reference to the selected formView's cloneView.

    We'll need to make a new formView from cloneFormViewReference's .data,
    get the handle, and add it to the uiHolder etc.
    so really what we need is a function for adding a formView to the UI, etc.
    which is technically what addRow() should be except that it should take
    a formView as an argument and if there isn't one already, *then* spawn one
*/
handleFormViewClone(cloneViewReference){
    let that = this;
    return(new Promise(function(toot, boot){
        if (that.debug){ that._app.log(`${that._className} | handleFormViewClone | called`); }
        let abrt = false;
        that.makeNewFormView(cloneViewReference).catch(function(error){
            abrt = true;
            that._app.log(`${that._className} | handleFormViewClone | failed to instantiate new formView from cloneView: ${error}`);
            boot(error);
        }).then(function(newView){
            if (! abrt){
                that.addRow(newView);
                let saveAbrt = false
                newView.save().catch(function(error){
                    saveAbrt = true;
                    that._app.log(`${that._className} | handleFormViewClone | clone created but save() failed: ${error}`);
                    boot(error);
                }).then(function(){
                    if (! saveAbrt){ toot(true); }
                })
            }
        });
    }));
}




/*
    getSearchMenu()
    just a really dumb search menu. in practice this would of course
    be much more elaborate
*/
getSearchMenu(){
    let that = this;

    let container = document.createElement('div');
    container.className = 'searchMenu';

    // btnContiner
    let btnContainer = document.createElement('div');
    btnContainer.className = 'btnContainer';

    // footer msg
    let ftrMsg = document.createElement('span');
    ftrMsg.className = 'ftrMsg';
    ftrMsg.innerHTML = '&nbsp;';
    btnContainer.appendChild(ftrMsg);

    // search button
    let btnSearch = document.createElement('button');
    btnSearch.textContent = 'search';
    btnSearch.className = 'btnSearch';
    btnContainer.appendChild(btnSearch);

    // "recipe google", LOL
    that.roogleInput = new noiceCoreUIFormElementInput({
        label:                  'search',
        labelLocation:          'none',
        maxLength:              0,
        trimWhitespace:         true,
        valueChangeCallback:    async function(newVal, oldVal, formElement){

            // keeping in mind this is just a dumb demo ... :-)
            btnSearch.disabled = that.isNull(newVal);
            return(newVal);
        }
    }).append(container);
    container.appendChild(btnContainer);

    btnSearch.addEventListener('click', function(evt){

        // let um know ya here!
        if (that.debug){ that._app.log(`${that._className} | btnSearch with searchtext: ${that.roogleInput.value}`); }

        // do that thang!
        let searchAbort = false;
        that._app.searchRecipesByTitle({
            title:  that.roogleInput.value,

            // insert search options here later

        }).catch(function(error){
            searchAbort = true;
            that._app.log(`${that._className} | btnSearch | searchRecipesByTitle() threw unexpectedly: ${error}`);
        }).then(function(dbRows){
            if ((! searchAbort) && (dbRows.length > 0)){

                // spawn new recipeFormViews with the local bindings for each of the returned rows
                let newViews = [];
                let pk = [];
                dbRows.forEach(function(row){ pk.push(new Promise(function(t,b){
                    let abrt = false;
                    that.makeNewFormView(row).catch(function(error){
                        abrt = true;
                        b(error);
                    }).then(function(nv){
                        if (! abrt){
                            nv.rowID = row.rowID;
                            if (row.hasOwnProperty('_rowMeta') && (row._rowMeta instanceof Object) && row._rowMeta.hasOwnProperty('rowStatus')){
                                nv.rowStatus = row._rowMeta.rowStatus;
                            }
                            newViews.push(nv);
                            t(nv);
                        }
                    });

                }))});

                // when all the view making is complete
                let makeAbrt = false;
                Promise.all(pk).catch(function(error){
                    makeAbrt = true;
                    that._app.log(`${that._className} | btnSearch | makeNewFormView() threw unexpectedly: ${error}`);
                }).then(function(){
                    if (! makeAbrt){
                        let showAbort = false;
                        that.showSearchResults(newViews).catch(function(error){
                            showAbort = true;
                            that._app.log(`${that._className} | btnSearch | showSearchResults() threw unexpectedly: ${error}`);

                        }).then(function(){
                            if (! showAbort){
                                // search results displayed, close dialog
                                that.searchMenuDialog.remove();
                            }
                        });
                    }
                });



            }else{
                /*
                    set a "no results" message and reset btnSearch
                    so the user has to change search criteria and when
                    they do, remove th e message
                */
            }
        });
    });

    return(container);
}




/*
    handleOpenSearchMenu(selfRef)
    fires when the user clicks the search button and can abort menu
    open by throwing. Using it here to just get all the recipe names
    and put them in the data list for the search field

    yeah ... I did say this was a dumb demo up there :-)
*/
handleOpenSearchMenu(selfRef){
    let that = this;
    return(new Promise(function(toot, boot){

        // insert shenanigans here
        let abrt = false;
        that._app.getRecipeTitlelist().catch(function(error){
            abrt = true;
            that._app.log(`${that._className} | handleOpenSearchMenu | main/getRecipeTitlelist threw unexepectedly: ${error}`);
            boot(error);
        }).then(function(result){
            if (that.roogleInput instanceof noiceCoreUIFormElementInput){
                that.roogleInput.values = result;
            }
        });

        toot(true);
    }))
}




/*
    showSearchResults(formViews)
*/
showSearchResults(formViews){
    let that = this;
    return( new Promise(function(bigToot, bigBoot){

        /*
            show dialog if there are existing search results
        */
        let dialogAbort = false;
        new Promise(function(toot, boot){
            if (that.uiHolder.listUIs().length > 0){
                try {
                    new noiceCoreUIYNDialog({
                        heading:        'Existing Search Results',
                        message:        'Discard existing search results and show new? or merge new search reulsts with existing?',
                        yesButtonTxt:   'merge',
                        noButtonTxt:    'discard',
                        hideCallback:   function(myself){ toot(myself.zTmpDialogResult); }
                    }).show(that.DOMElement);
                }catch(e){
                    boot(e);
                }
            }else{
                toot(true);
            }
        }).catch(function(error){
            // this should never happen
            dialogAbort = true;
            that._app.log(`${that._className} | showSearchResults | noiceCoreUIYNDialog threw unexpectedly: ${error}`);
        }).then(function(mergeFlag){
            if (! dialogAbort){
                if (mergeFlag){

                    /*
                        NOTE: 9/30/21 -- Promise.all is not synchronous, LOL
                        like it doesn't chain your promises and execute them one at time,
                        it shotguns those suckas. Which is why the handleRowSelect call inside addRow()
                        causes some problems ... it depends on the DOM being all setup

                        what would be more appropriate would be a recursive function to execute 'em
                        all in sequence. But I'm lazy and this is just a demo. So, we send a flag not to
                        execute the handleRowSelect(), LOL
                    */

                    let pk = [];
                    formViews.forEach(function(formView){ pk.push(that.addRow(formView, false)); });
                    let abrt = false;
                    Promise.all(pk).catch(function(error){
                        abrt = true;
                        that._app.log(`${that._className} | showSearchResults | addRow threw unexpectedly: ${error}`);
                        bigBoot(error);
                    }).then(function(){
                        that.handleRowSelect(formViews[(formViews.length -1)].handle);
                        bigToot(true);
                    });
                }else{
                    // deselect anything selected and await the exit
                    let pk = [];
                    that._DOMElements.handlelist.querySelectorAll(`.rowHandle[data-selected='true']`).forEach(function(handle){
                        pk.push(that.handleRowSelect(handle));
                    });
                    let focusCancel = false;
                    Promise.all(pk).catch(function(error){
                        focusCancel = true;
                        that._app.log(`${that._className} | showSearchResults(discard) | focus change canceled: ${error}`);
                        bigBoot(error);
                    }).then(function(){
                        if (! focusCancel){
                            // remove everything we got
                            let pkk = [];
                            Object.keys(that.uiHolder.UIList).forEach(function(formViewGUID){
                                pkk.push(that.uiHolder.UIList[formViewGUID].close());
                            });
                            let nabrt = false;
                            Promise.all(pkk).catch(function(error){
                                nabrt = true;
                                that._app.log(`${that._className} | showSearchResults(discard) | remove views canceled: ${error}`);
                            }).then(function(){
                                if (! nabrt){
                                    let pkkk = [];
                                    formViews.forEach(function(formView){ pkkk.push(that.addRow(formView, false)); });
                                    let abrt = false;
                                    Promise.all(pkkk).catch(function(error){
                                        abrt = true;
                                        that._app.log(`${that._className} | showSearchResults(discard) | addRow threw unexpectedly: ${error}`);
                                        bigBoot(error);
                                    }).then(function(){
                                        that.handleRowSelect(formViews[(formViews.length -1)].handle);
                                        bigToot(true);
                                    });
                                }
                            })
                        }
                    });
                }
            }
        });
    }));
}




} // end class
