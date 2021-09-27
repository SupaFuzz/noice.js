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
async addRow(otherView){
    let that = this;
    this._app.log(`${this._className} | addRow()`);

    /*
    let view = new recipeFormView({
        formMode:           'create',
        config:             that._app.config.Forms.recipe,
        _app:               that._app,
        rowTitle:           `Untitled #${this.handleNumber}`,
        cancelButtonText:   '',

        // custom stuff
        handleNumber:       that.handleNumber,

        // callbacks
        saveCallback:       function(formViewReference){ return(that.handleFormViewSave(formViewReference)); },
        cloneCallback:      function(cloneViewReference){ return(that.handleFormViewClone(cloneViewReference)); },
        cloneableCallback:  function(formViewReference, flag){ return(that.toggleCloneIcon(formViewReference, flag)); },
        areYouSureCallback: function(formViewReference, focusArgs){ return(that.saveChangesDialog(formViewReference, focusArgs)); },

        // debug stuff
        cloneable:          true,
        _cloneableOnSave:   false,
        debug:              true,
    });
    */
    let view;
    if (that.isNotNull(otherView) && (otherView instanceof formView)){
        view = otherView;
    }else{
        view = await that.makeNewFormView();
    }

    // setup the rowHandle and add it to the handleList
    let viewHandle = view.handle.append(that._DOMElements.handlelist);
    viewHandle.selectCallback = function(selfRef){ return(that.handleRowSelect(viewHandle._DOMElements._handleMain)); }

    // add the formView to our uiHolder with the view's rowID
    this.uiHolder.addUI(view, view.rowID);

    // then select the new rowHandle
    that.handleRowSelect(viewHandle);

    // increment our untitled document count
    that.handleNumber++;

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
                newView.data = externalFormView.data;
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

                /*
                    LOH 9/27/21 @ 1753 -- time for voice therapy!

                    modify makeNewFormView() above to take the second
                    argument as an Object, not a fully constructed view or perhaps an else if
                    or what have you. use makeNewFormView() to make the new views, then
                    make a prompt to let the user replace or append existing records in view on
                    the leftCol.
                    
                */
                console.log('got my search results yo!');
                console.log(dbRows);

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



} // end class
