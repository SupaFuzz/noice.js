/*

    NOTE: 9/1/21 @ 1415 -> THIS IS DEFUNCT(ish)
    noiceCoreUIElement now handles templating and automatic DOMElement accessors
    included for completeness, but really just use coreUIElement


    this implements a noiceCoreUIElement with an automatically generated
    set of getters and setters for attributes you specify on the templateElements
    object.

    most notably, these setters will update the corresponding DOMElements
    specified in the html getter. To specify an element to be managed
    from templateElements in the HTML:

        <span class="${this.templateElementClassName}" data-fieldname="<fieldName>"> ... </span>

    where <fieldName> is a key in the templateElements object




*/

class noiceCoreUITemplate extends noiceCoreUIElement {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:                   1,
        _className:                 'noiceCoreUITemplate',
        _templateElements:          {},
        _clones:                    {},
        debug:                      false,
        templateElementClassName:   'ncuiTemplateField'
    },defaults),callback);

    // setup the fieldMap
    this.updateElementMap();

    /* initialize the templateElement values */
    Object.keys(this.templateElements).forEach(function(templateElementName){
        this[templateElementName] = this.templateElements[templateElementName];
    }, this);


} // end constructor





/*
    clones
*/
get clones(){ return(this._clones); }
getClone(){

    // note: we have to do it this way, rather than calling the constructor directly
    // as we want this to work transparently for subclasses
    // OK, yeah ... just override this, then it'll be sure the clone is inside
    // your subclass --. I'm sure this can be done I just don't got time to be elegant
    // about it right now


    /*
    let cloneGUID = this.getGUID();
    let that = this;
    this.clones[cloneGUID] = Object.create(this);
    this.clones[cloneGUID].DOMEElement = this.DOMElement.cloneNode(true);
    this.clones[cloneGUID]._templateElements = {};
    Object.keys(this.templateElements).forEach(function(teName){
        this.clones[cloneGUID]._templateElements[teName] = this.templateElements[teName];
    }, this);
    this.clones[cloneGUID].DOMEElement.dataset.cloneGUID = cloneGUID;
    this.clones[cloneGUID]._selectable = true;
    this.clones[cloneGUID]._selected = false;


    console.log(`getClone returning: ${cloneGUID}`);

    return(this.clones[cloneGUID]);
    */


    /*
        -- this should just be another nocieCoreUITemplate object
        -- that we are TREATING like a clone. Can you dig this?

    let clone = this.DOMElement.cloneNode(true);
    clone.dataset.cloneGuid = this.getGUID;
    this._clones[clone.dataset.cloneGuid] = {
        elementMap: that.getElementMap(clone),
        DOMElement: clone
        selected: false,
    };
    return(clone);
    */
}
destroyClone(cloneGuid){
    if (this._clones[cloneGuid]){
        this._clones[cloneGuid].remove();
        delete(this._clones[cloneGuid]);
    }
}



/*
    updateElementMap(oldElementMap)
    find all of the templateElements present in our private DOM tree
    then make sure we have attribute acessors set up for each

    oldElementMap, if specified is the previous value of 'templateElements'
    this allows us to weed out attribute acessors that are not in the new list
    if it has changed
*/
updateElementMap(oldElementMap){
    let that = this;

    // snag pointers to all of the templateElements we can find in this.DOMElement
    that._templateElementPointers = {};
    if (this.DOMElement instanceof Element){
        this.DOMElement.querySelectorAll(`.${that.templateElementClassName}`).forEach(function(el){
            if ((el.dataset.fieldname) && that.templateElements.hasOwnProperty(el.dataset.fieldname)){
                if (! that._templateElementPointers.hasOwnProperty(el.dataset.fieldname)){
                    that._templateElementPointers[el.dataset.fieldname] = [];
                }
                that._templateElementPointers[el.dataset.fieldname].push(el);
            }
        });
    }

    // remove defunct attribute accessors
    if (oldElementMap instanceof Object){
        Object.keys(oldElementMap).forEach(function(oldElementName){
            if (! that.templateElements.hasOwnProperty(oldElementName)){ delete that[oldElementName]; }
        })
    }

    // set up attribute acessors for each of the templateElements (that we haven't already setup)
    Object.keys(this.templateElements).forEach(function(fieldName){
        let tmp = Object.getOwnPropertyDescriptor(that, fieldName);
        if (! ((that.isNotNull(tmp) && (tmp.set instanceof Function)))){

            Object.defineProperty(that, fieldName, {
                get:          function(){ return(that.getDOMAttribute(fieldName)); },
                set:          function(v){ that.setDOMAttribute(fieldName, v); }
            });
        }
    });
}




/*
    getElementMap(DOMElement)
*/
getElementMap(DOMElement){
    let that = this;

    let useME = (DOMElement instanceof Element)?DOMElement:that.DOMElement;

    // snag pointers to all of the templateElements we can find in this.DOMElement
    let _templateElementPointers = {};
    useMe.querySelectorAll(`.${that.templateElementClassName}`).forEach(function(el){
        if ((el.dataset.fieldname) && that.templateElements.hasOwnProperty(el.dataset.fieldname)){
            if (! _templateElementPointers.hasOwnProperty(el.dataset.fieldname)){
                _templateElementPointers[el.dataset.fieldname] = [];
            }
            _templateElementPointers[el.dataset.fieldname].push(el);
        }
    });
    return(_templateElementPointers);
}



/*
    hard-coded acessor for templateElements
*/
get templateElements(){ return(this._templateElements); }
set templateElements(v){
    let tmp = this._templateElements;
    this._templateElements = v;

    this.updateElementMap(tmp);
}




/*
    the getter & setter that all of the templateElements acessors point to
    if you send an instance of Element we will simply empty the templateElement's
    DOM tree and append the specified Element as a child.
*/
getDOMAttributeTextValue(attribute){
    if (this.hasOwnProperty(`_${attribute}`)){
        if (this[`_${attribute}`] instanceof Element){
            return(this[`_${attribute}`].textContent)
        }else{
            return(this[`_${attribute}`])
        }
    }else{
        return(null)
    }
}
getDOMAttribute(attribute){
    if (this.hasOwnProperty(`_${attribute}`)){
        return(this[`_${attribute}`]);
    }else{
        return(null);
    }
}
setDOMAttribute(attribute, value, recurse){

    // this is a handy one you might wanna keep around ...
    //console.log(`setDOMAttribute(${attribute}, ${value}, ${(recurse === false)})`)

    // set own templateElement
    if (this.templateElements.hasOwnProperty(attribute)){
        if (this._templateElementPointers.hasOwnProperty(attribute) && (this._templateElementPointers[attribute] instanceof Array )){
            this._templateElementPointers[attribute].forEach(function(el){

                // clear it
                el.innerHTML = '';

                // replace it
                if (value instanceof Element){
                    this[`_${attribute}`] = value.cloneNode(true);
                    if (this._templateElementPointers[attribute].length > 1){
                        el.appendChild(this[`_${attribute}`]);
                    }else{
                        el.append(this[`_${attribute}`]);
                    }

                // update text
                }else{
                    el.textContent = value;
                    this[`_${attribute}`] = value;
                }
            }, this)
        }else{
            this[`_${attribute}`] = value;
        }
        this.DOMElement.dataset[attribute] = (this[`_${attribute}`] instanceof Element)?this[`_${attribute}`].textContent:this[`_${attribute}`];
    }

    // distribute templateElement change to cloneOf or clones
    if (! (recurse === false)){
        if ((this.cloneOf instanceof noiceCoreUITemplate) || (Object.keys(this.clones).length > 0)){
            let copyValue = value;
            if (value instanceof Node){ copyValue = value.cloneNode(true); }
            this.distributeAttributeUpdate(attribute, value);
        }
    }
}
distributeAttributeUpdate(attribute, value){

    if (this.debug){ console.log(`${this._className} | distributeAttributeUpdate(${attribute}, ${value}) | isClone: ${(this.cloneOf instanceof noiceCoreUITemplate)}`); }

    // helper function compares attribute values
    function compareMe(src, dst){
        let srcVal = (src instanceof Element)?src.textContent:src;
        let dstVal = (dst instanceof Element)?dst.textContent:dst;
        return(srcVal == dstVal);
    }

    // if this is a clone
    if (this.cloneOf instanceof noiceCoreUITemplate){
        // update the parent
        if (this.cloneOf.hasOwnProperty(`_${attribute}`) && (! compareMe(value, this.cloneOf[`_${attribute}`]))){
            this.cloneOf.setDOMAttribute(attribute, value, false);

        }

        if (Object.keys(this.cloneOf.clones).length > 0){
            // update the clones of the parent (but not self)
            Object.keys(this.cloneOf.clones).forEach(function(cloneGUID){
                if (cloneGUID == this.guid){ return(true); }
                // update the clone

                if (this.cloneOf.clones[cloneGUID].hasOwnProperty(`_${attribute}`) && (! compareMe(value, this.cloneOf.clones[cloneGUID][`_${attribute}`]))){
                    this.cloneOf.clones[cloneGUID].setDOMAttribute(attribute, value, false);
                }
            }, this);
        }

    // if this has clones
    }else if (Object.keys(this.clones).length > 0){
        Object.keys(this.clones).forEach(function(cloneGUID){
            // update the clone
            this.clones[cloneGUID].setDOMAttribute(attribute, value, false);
        }, this)
    }

}




} // end noiceCoreUITemplate
