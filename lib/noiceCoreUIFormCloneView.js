/*
    noiceCoreUIFormCloneView.js
    this implements a noiceCoireUIElement subclass representing
    a cloneView of a noiceCoreUIFormView object.

    an object of this class is returned when you call
    getCloneView() on a noiceCoreUIFormView (or descentant) object

    in general you're gonna end up with something looking like this:

    --------------------------------
    |  <rfidTagNumber>
    |  <serialNumber>
    |  <assignee>       (+) (-)
    |  [select field ^]
    |
    |                    [CLONE]
    --------------------------------

    a noiceCoreUIFormView object is a required input to the constructor.
    let's call that this.cloneMaster

    the template used to build the above is determined this.cloneMaster.cloneViewHTML
    this should be a getter in the style of get html() (so able to use the config and
    the fieldReference mechanism, etc). In this way, noiceCoreUIFormView subclasses
    can control the rendering of the clone view by overriding *.cloneViewHTML
*/
class noiceCoreUIFormCloneView extends noiceCoreUIElement {




/*
    constructor({
        cloneMaster:    <noiceCoreUIFormView descendant>
        cloneCallback:  function(clickEvent, selfReference){ ... }
    });
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'noiceCoreUIFormCloneView',
        _fieldReferences:       {},
        //deferRender:            true,
        debug:                  false,
        fieldReferenceClass:    'ncfuFormFieldReference',
        formElements:           {},
        openMenuCallbacks:      {}
    },defaults),callback);

    // we must have a cloneMaster to do this stuff ...
    if (! this.cloneMaster instanceof noiceCoreUIFormView){
        throw(`${this._className} | constructor | 'cloneMaster' is not a subclass of noiceCoreUIFormView`);
    }

    // render after the input validation otherwise gonna get no fun error tracing
    //this.render();
    this.setup();
}




/*
    html getter (shenanigans)
    return the cloneMaster's cloneViewHTML or the defaultCloneView
*/
get html(){
    let t;
    try {
        t = this.cloneMaster.cloneViewHTML;
    }catch (e){
        if (this.debug){
            this._app.log(`${this._className} | html getter | cloneMaster.cloneViewHTML threw unexpectedly: ${e}`);
        }
    }
    return(this.isNotNull(t)?t:this.defaultCloneView);
}




/*
    defaultCloneView
*/
get defaultCloneView(){
    let that = this;

    /*
        this approach will require some hooks in the field config
        to determine which fields to include by default in the
        clone view
    */

    let html = [];
    let tmp = [];

    Object.keys(that.cloneMaster.fieldConfigByID).sort(function(a,b){
        return(that.cloneMaster.fieldConfigByID[a].displayOrder - that.cloneMaster.fieldConfigByID[b].displayOrder)
    }).forEach(function(fieldID){

        if (
            (that.cloneMaster.fieldConfigByID[fieldID].modes.clone instanceof Object) &&
            (that.cloneMaster.fieldConfigByID[fieldID].modes.clone.default)
        ){
            if (! that.formElements.hasOwnProperty(fieldID)){ that.getFormElement(fieldID); }
            tmp.push(fieldID);
        }
    });
    tmp.forEach(function(fieldID){
        if (! (that.cloneMaster.fieldConfigByID[fieldID].modes.clone.removable == true)){
            html.push(that.fieldReference(fieldID));
        }
    });
    tmp.forEach(function(fieldID){
        if (that.cloneMaster.fieldConfigByID[fieldID].modes.clone.removable == true){
            html.push(that.fieldReference(fieldID));
        }
    });


    // keepin' it real. real basic.
    return(
        `<div class="frame" style="display:grid;grid-template-columns: 1fr;">
            <div class="cloneFieldContainer">${html.join('')}</div>
            <div class="btnContainer">
                ${this.fieldReference('fieldSelector')}
                <button class="btnClone">clone</button>
            </div>
         </div>`
    );
}




/*
    setup()
*/
setup(){
    let that = this;

    /*
        for convinience
    */
    that.fieldConfigByLabel = {};
    Object.keys(that.cloneMaster.fieldConfigByID).forEach(function(fieldID){
        that.fieldConfigByLabel[that.cloneMaster.fieldConfigByID[fieldID].label] = that.cloneMaster.fieldConfigByID[fieldID];
    });

    /*
        create the fieldSelector and it's add button
    */
    let btnAdd = document.createElement('button');
    btnAdd.className = "btnAdd";
    btnAdd.autocomplete = 'off';
    btnAdd.disabled = true;
    that.formElements['fieldSelector'] = new noiceCoreUIFormElementSelect({
        label: 'add field',
        labelLocation: 'left',
        values: [],
        valueChangeCallback:    function(newValue, oldValue){
            // toggle the add button in here
            if (that.isNotNull(newValue)){
                btnAdd.disabled = false;
            }else{
                btnAdd.disabled = true;
            }
        }
    });
    that.formElements['fieldSelector'].DOMElement.querySelector('div.ncufeFieldSection').appendChild(btnAdd);

    // and the btnAdd's hook ...
    that.cloneFieldContainer = that.DOMElement.querySelector('.cloneFieldContainer');
    btnAdd.addEventListener('click', function(evt){

        // console.log(`addButton -> ${that.fieldConfigByLabel[that.formElements['fieldSelector'].value].id}`);

        let fieldID = that.fieldConfigByLabel[that.formElements['fieldSelector'].value].id;
        if (! that.formElements.hasOwnProperty(fieldID)){ that.getFormElement(fieldID); }
        if (! that.formElements[fieldID].onScreen){
            that.formElements[fieldID].labelLocation = 'top';
            //let b = document.createElement('div');
            //b.className = 'ncfuFormFieldReference';
            //that.formElements[fieldID].append(b);
            //that.cloneFieldContainer.appendChild(b);

            that.formElements[fieldID].append(that.cloneFieldContainer);
            that.refreshAvailableFieldsMenu();
        }
    });


    /*
        insert all the formElement references
    */
    that.btnContainer = that.DOMElement.querySelector('.btnContainer');
    (this.DOMElement.querySelectorAll(`.${this.fieldReferenceClass}`) || []).forEach(function(el){
        this.formElements[this._fieldReferences[el.id]].labelLocation = 'top';
        this.formElements[this._fieldReferences[el.id]].append(el);

        // hang remove hook here -> this.formElements[fieldID]._btnRemove
        // weelll .. no. Really it should be set in getFormElement()
        // good trivia, will leave the note

    }, this);

    /*
        setup the "fields available to add" menu
    */
    that.refreshAvailableFieldsMenu();

    /*
        if we've got a cloneCallback, hook it up to btnClone
    */
    that.btnClone = that.DOMElement.querySelector(`button.btnClone`);
    if (that.btnClone instanceof Element){
        that.btnClone.addEventListener('click', function(evt){
            that.cloneClickHandler(evt, that);
        });
    }


}




/*
    refreshAvailableFieldsMenu
*/
refreshAvailableFieldsMenu(){
    let that = this;
    let cascade = {};

    Object.keys(that.cloneMaster.fieldConfigByID).forEach(function(fieldID){
        if (
            ((! that.formElements.hasOwnProperty(fieldID)) || (! that.formElements[fieldID].onScreen)) &&
            (that.isNotNull(that.cloneMaster.fieldConfigByID[fieldID].displaySection)) &&
            (that.cloneMaster.fieldConfigByID[fieldID].modes instanceof Object) &&
            (that.cloneMaster.fieldConfigByID[fieldID].modes.clone instanceof Object) &&
            (that.cloneMaster.fieldConfigByID[fieldID].modes.clone.hasOwnProperty('fieldMenu')) &&
            (that.cloneMaster.fieldConfigByID[fieldID].modes.clone.fieldMenu === true)
        ){
            let sec = that.cloneMaster.fieldConfigByID[fieldID].displaySection;
            if (! cascade.hasOwnProperty(sec)){ cascade[sec] = []; }
            //cascade[sec].push([`${fieldID}`, that.cloneMaster.fieldConfigByID[fieldID].label]);
            cascade[sec].push(that.cloneMaster.fieldConfigByID[fieldID].label);
        }
    });

    let map = [];
    Object.keys(cascade).sort().reverse().forEach(function(secTitle){
        map.push({label: secTitle, values: cascade[secTitle]});
    });

    that.formElements['fieldSelector'].values = map;
}





/*
    getFormElement(fieldID)
*/
getFormElement(fieldID){
    let that = this;

    // note we have to do this to avoid sending pointers to getFormElement
    let tmp = JSON.parse(JSON.stringify(that.cloneMaster.fieldConfigByID[fieldID]));

    // copy form mode prefs into the object properties ... from the object properties ... look I can't defend this it is what it is
    if (tmp.modes.clone instanceof Object){
        Object.keys(tmp.modes.clone).forEach(function(a){
            tmp[a] = tmp.modes.clone[a];
        });
    }

    if ((that.cloneMaster.fieldConfigByID[fieldID].modes.clone instanceof Object) && ( !(that.cloneMaster.fieldConfigByID[fieldID].modes.clone.inheritValue === false))){
        tmp.value = that.cloneMaster.formElements[fieldID].value;
    }

    if ((that.cloneMaster.menus instanceof Object) && (that.cloneMaster.menus.hasOwnProperty(fieldID))){ tmp.values = that.cloneMaster.menus[fieldID]; }

    this.formElements[fieldID] = noiceCoreUIFormView.getFormElement(tmp.type, tmp, {_app: that._app, parentUI: that.parentUI });

    this.formElements[fieldID].valueChangeCallback = function(valNew, valOld){
        that.fieldValueChange(fieldID, valNew, valOld);
    };

    // handle the removable shiz ...
    if (! ((that.cloneMaster.fieldConfigByID[fieldID].modes.clone instanceof Object) && (that.cloneMaster.fieldConfigByID[fieldID].modes.clone.removable == false))){
        this.formElements[fieldID].DOMElement.dataset.removable = 'true';
        let btn = document.createElement('button');
        btn.className = "btnRemove";
        btn.dataset.fieldid = `${fieldID}`;
        this.formElements[fieldID].DOMElement.querySelector('div.ncufeFieldSection').append(btn);
        this.formElements[fieldID]._btnRemove = btn;
        this.formElements[fieldID]._btnRemove.addEventListener('click', function(evt){
            if (that.formElements[fieldID].onScreen){
                // insert any additional removal logic here
                that.formElements[fieldID].remove();
                that.refreshAvailableFieldsMenu();
            }
        });
    }else{
        this.formElements[fieldID].DOMElement.dataset.removable = 'false';
    }

    this.formElements[fieldID].resetOldValue();

    return(this.formElements[fieldID])
}




/*
    fieldValueChange(fieldID, valNew, valOld)
*/
fieldValueChange(fieldID, valNew, valOld){
    let that = this;

    if (that.fieldValueChangeCallback instanceof Function){
        that.fieldValueChangeCallback(fieldID, valNew, valOld);
    }
}




/*
    fieldReference(fieldID)
    register a placeholder div in this.html which will contain the specified field
*/
fieldReference(fieldID){
    let guid = this.getGUID();
    this._fieldReferences[guid] = fieldID;
    return(`<div class="${this.fieldReferenceClass}" id="${guid}"></div>`);
}




/*
    mergedClone getter
*/
get mergedClone(){
    // merge clone variables to cloneMaster
    let cloneData = this.cloneMaster.allFields;
    Object.keys(this.formElements).forEach(function(fieldID){
        if (this.formElements[fieldID].onScreen){
            cloneData[fieldID] = this.formElements[fieldID].value;
        }
    }, this);
    return(cloneData);
}



/*
    cloneClickHandler(evt, selfReference)
*/
cloneClickHandler(evt, selfReference){
    let that = this;
    that.btnClone.disabled = true;

    // call the cloneCallback if we've got one
    if ((this.cloneCallback instanceof Function) && (this.cloneCallback.constructor.name == 'AsyncFunction')){
        this.cloneCallback(this.mergedClone, selfReference).catch(function(error){
            /*
                this is sort of built with the idea that we shouldn't ever execute this block
                except in the case of a truly extraordinary thing like a code error. The paradigm
                should be such that the external cloneCallback() handles business logic errors like
                input validation etc, leavng the resultant reocord in the UI somewhere that the user
                can fix it
            */
            throw(`${that._className} | cloneClickHandler | cloneCallback threw unexpectedly: ${error}`);

        }).then(function(callbackOutput){
            /*
                the external cloneCallback() succeeded in as much as it did'nt throw
                callbackOutput has anything returned by the cloneCallback (for instance a guid or entry_id?)
            */

            // release the clone button
            that.btnClone.disabled = false;
        });
    }

}




/*
    dispatchBtnMenuCallback(fieldID, evt)
    one could override just this thing and hard code it or one could set function pointers
    on this.openMenuCallbacks[<fieldID>]
*/
dispatchBtnMenuCallback(fieldID, evt){
    if (this.openMenuCallbacks[fieldID] instanceof Function){
        try {
            this.openMenuCallbacks[fieldID](evt);
        }catch(e){
            throw(`${this._className} | dispatchBtnMenuCallback(${fieldID}) | openMenuCalllback threw unexpectedly ${e}`, e);
        }
    }
}




} // end class
