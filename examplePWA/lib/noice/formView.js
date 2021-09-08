/*
    formView.js
    this is a reworking of noiceCoreUIFormView.js and will likely
    replace it when I'm done here

    messageNumbers:
        1   bad config object
        2   unknown field type
        3   failed to instantiate formElement
        4   no fields in config
        5   duplicate fields in config

    config = {
        fields:  { <fieldName>: {<fieldConfig>} ...},
        menus:   { <fieldName>: [menuValesObject] }
        filters: []
    }

    html template stuff
    use templatename[str] and templateattribute[bool]
    set templatename = fieldName from the config
    the mode setter should handle the rest
*/
class formView extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:       1,
            _className:     'formView',
            _burgerMenu:    null,
            _formElements:  {},
            debug:          false,
        }, defaults),
        callback
    );

} // end constructor




/*
    html
    this is a super-dumb renderer by displaySection (alpha) / displayOrder
    with a save button and a close button
*/
get html(){
    let that = this;

    // sort out sections and field order
    let fieldListHTML = [];
    let sections = {};
    Object.keys(that._formElements).forEach(function(fieldName){
        sectionName = (that._formElements[fieldName].hasOwnProperty('displaySection'))?that._formElements[fieldName].displaySection:'none';
        if (!(sections.hasOwnProperty(sectionName))){ sections[sectionName] = []; }
        that._formElements[fieldName].name = fieldName;
        sections[sectionName].push(that._formElements[fieldName])
    });
    Object.keys(sections).sort().forEach(function(sectionName){
        fieldListHTML.push(`<fieldset><legend>${sectionName}</legend>`);
        sections[sectionName].sort(function(a,b){ return(a.displayOrder - b.displayOrder); }).forEach(function(formElement){
            fieldListHTML.push(`<div class="formField" data-templatename="${formElement.name}" data-templateattribute="true"></div>`);
        });
        fieldListHTML.push(`</fieldset>`);
    })

    // insert shenanigans here
    return(`${fieldListHTML.join("\n")}`);

    /*
        LOH 9/7/21 @ 2339
        seems like there might be a better way than setting *.name above
        outa gas for tonight. coming along though.
    */

}




/*
    setupCallback()
*/
setupCallback(){
    let that = this;
    that._app.log(`${that._className} | setupCallback`);
}




/*
    onScreenCallback()
*/
onScreenCallback(){
    let that = this;
    that._app.log(`${that._className} | onScreenCallback`);
}




/*
    firstFocusCallback(focusArgs)
*/
firstFocusCallback(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){
        that._app.log(`${that._className} | firstFocusCallback`);
        toot(true);
    }));
}




/*
    gainFocus(focusArgs)
*/
gainFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){
        that._app.log(`${that._className} | gainFocus`);
        toot(true);
    }));
}




/*
    loseFocus(focusArgs)
    -- this'll be where the are you sure dialog fires
*/
loseFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){
        that._app.log(`${that._className} | loseFocus`);
        toot(true);
    }));
}




/*
    rowHandle getter
*/
get rowHandle(){
    // insert shenanigans here
    return(`<h3>this is my handle!</h3>`);
}




/*
    config stuff
*/
get config(){ return(this._config); }
set config(cfg){
    let that = this;

    // bounce if the given config ain't an object at least
    if (! (cfg instanceof Object)){
        throw(new noiceException({
            message:        `${that._className}/config setter: specified config is not an Object`,
            messageNumber:   1,
            thrownBy:       `${that._className}/config setter`
        }));
    }

    // bounce if we don't have fields ...
    if (! (cfg.hasOwnProperty('fields') && (cfg.fields instanceof Object))){
        throw(new noiceException({
            message:        `${this._className}/config setter: specified config does not contain fields`,
            messageNumber:   4,
            thrownBy:       `${this._className}/config setter`
        }));
    }

    // get formElements for everything in the config
    let parseError = false;
    Object.keys(cfg).forEach(function(fieldName){
        if ((! parseError) && (that._formElements.hasOwnProperty(fieldName))){
            parseError = true;
            throw(new noiceException({
                message:        `${this._className}/config setter: specified config defines fieldName: ${fieldName} more than once`,
                messageNumber:   5,
                thrownBy:       `${this._className}/config setter`
            }));
        }
        if (! parseError){
            let extraConfig = {};

            // inject menu if we have one
            if ((cfg.menus instanceof Object) && (cfg.menus.hasOwnProperty(fieldName))){
                extraConfig.values = cfg.menus[fieldName];
            }

            // make it
            that._formElements[fieldName] = formView.getFormElement(
                cfg.fields[fieldName].type,
                cfg.fields[fieldName],
                extraConfig
            );
        }
    });

    // swap it out
    this._config = cfg;
}




/*
    getFormElement(fieldType, fieldConfig, mergeConfig)
    static function for getting form elements from config data
*/
static getFormElement(fieldType, fieldConfig, mergeConfig){

    let tmpConfig = JSON.parse(JSON.stringify(fieldConfig));
    if (mergeConfig instanceof Object){ Object.keys(mergeConfig).forEach(function(a){ tmpConfig[a] = mergeConfig[a]; }); }

    try {
        switch(fieldType){

            /*
                aliases for implemented noiceCoreUIFormElement subclasses
            */
            case   'char':
                // noiceCoreUIFormElementInput
                return(new noiceCoreUIFormElementInput(tmpConfig));
                break;
            case   'date':
                // noiceCoreUIFormElementDate
                return(new noiceCoreUIFormElementDate(tmpConfig));
                break;
            case   'int':
                // noiceCoreUIFormElementNumber
                // to-do: hack input validations onto noiceCoreUIFormElementNumber for each mode
                return(new noiceCoreUIFormElementNumber(tmpConfig));
                break;
            case   'real':
                // noiceCoreUIFormElementNumber (see above)
                return(new noiceCoreUIFormElementNumber(tmpConfig));
                break;
            case   'decimal':
                // noiceCoreUIFormElementNumber (see above)
                return(new noiceCoreUIFormElementNumber(tmpConfig));
                break;
            case   'dropdown':
                // noiceCoreUIFormElementSelect
                // to-do: hack on a 'dynamic' mode (like char menus in ars)
                return(new noiceCoreUIFormElementSelect(tmpConfig));
                break;
            case   'checkbox':
                // noiceCoreUIFormElementCheckbox
                return(new noiceCoreUIFormElementCheckbox(tmpConfig));
                break;
            case   'table':
                // noiceCoreUIFormElementTable
                return(new noiceCoreUIFormElementTable(tmpConfig));
                break;
            case    'text':
                // noiceCoreUIFormElementText
                return(new noiceCoreUIFormElementText(tmpConfig));
                break;
            case   'dateTime':
                // noiceCoreUIFormElementDateTime
                return(new noiceCoreUIFormElementDateTime(tmpConfig));
            break;
            case   'currency':
                // note this is a workaround
                // I should build a proper currency class. someday.
                // but not today
                return(new noiceCoreUIFormElementNumber(tmpConfig));
                break;
            case    'scannerInput':

                let t;
                t = new coreUIScannerInput(tmpConfig);
                return(t);

                //return(new coreUIScannerInput(tmpConfig));
                break;

            /*
                aliases for not-yet-implemented noiceCoreUIFormElement subclasses
            */


            case   'diary':
                // to-do
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'time':
                // to-do: (oh shit! I forgot this one! - required for dateTime composite element)
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'radio':
                // to-do
                throw(`${fieldType} is not yet implemented`);
                break;
            case   'button':
                // to-do: (sigh ... yeah it's probably better modeled as a formElement)
                throw(`${fieldType} is not yet implemented`);
                break;

            /*
                throw an error if we don't know fieldType at all
            */
            default:
                throw(new noiceException({
                    message:        `[static] noiceCoreUIFormView.getFormElement() - invalid fieldType`,
                    messageNumber:   2,
                    thrownBy:       `[static] noiceCoreUIFormView.getFormElement()`
                }));
        }
    }catch(e){
        throw(new noiceException({
            message:        `[static] noiceCoreUIFormView.getFormElement() - failed to instantiate ${fieldType}/${fieldConfig.name}: ${e.toString()}`,
            messageNumber:   3,
            thrownBy:       `[static] noiceCoreUIFormView.getFormElement()`
        }));
    }
}




} // end formView class
