/*
    noiceARForm.js
    accepts the output of noiceRemedyAPI.getRelatedFormsAndMenus({schema:<schemaName>})
    as the .config attribute at instantiation

    this is a three-way broker between the UI, the indexedDB and the server.

    .formName (getter/setter)
    you gotta give it a name and it'd better be unique like it is server side because that's
    how we're gonna identify existing data, etc

    .getFormViewConfig(<formView>)
    this returns formView compatible config object (note we cal also inject filters and
    such here to hook it all up)

    .indexedDBConfig (getter)
    returns noiceIndexedDB compatible objectStore definition containing datastores needed
    to drive an ARForm (so a primary, journal, meta, etc)

    .getFormView({rowData: <rowData>, rowID: <rowID>, mode:<formMode>, ...})
    return a noiceARFormView (formView descendant) populated with given data (if given),
    for the specified rowID, and wired into the noiceARForm instance (saveCal lback(),
    cloneCallback(), passthroughs, etc)

    we are going to have our own indexedDB for each form object.
    we save to, and query from our own indexedDB, which means we'll need something like
    a noiceForm class or the like to descend from (eventually, but for now we just buildin'),
    but especially once we've got something like QBE -> IndexedDB ready, def for a parent class

    we are going to need a special callback that executes BEFORE the indexedDB save, has the
    capability to abort the save, and the capability to change the content to save:

        * aboutToSaveCallback()
          execute before we write the indexedDB. This is the hook for talking to the server
          if we're online and doing it all realtime. We need to be able to return alternate
          save contents to write to the indexedDB as if we do successfully write to the server
          our job is to write the main table with the re-pulled record, rather than the journal

    messageNumbers:
        1   bad ARSConfig object
        2   formName not in ARSConfig
        3   formName is not set
        4   requested view not defined in config
        5   no viewName given, cannot determine default from config
*/
class noiceARForm extends noiceCoreChildClass {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({

        // object infrastructure
        _version:           1,
        _className:         'noiceARForm',

        // abstracted attributes
        _formName:              null,
        _formViewConfig:        {},
        _indexedDBConfig:       {},
        _ARSConfig:             {},

        // default label stuff
        _editLabelLocation:     'left',
        _editLabelLength:       '14.754060723vw',
        _cloneLabelLocation:    'top'

    }, defaults), callback);
}




/*
    set/get ARSConfig
*/
get hasARSConfig(){ return(Object.keys(this._ARSConfig) > 0); }
get ARSConfig(){ return(this._ARSConfig); }
set ARSConfig(v){

    // just basic config checking, nothing too deep
    let throwError = null;
    if (
        (v instanceof Object) &&
        (v.hasOwnProperty('forms')) &&
        (v.forms instanceof Object)
    ){
        if (
            this.isNotNull(this.formName) &&
            (! (v.forms.hasOwnProperty(this.formName)))
        ){
            throwError = `specified ARSConfig does not include formName (${this.formName})`;
        }
    }else{
        throwError = 'specified ARSConfig object is not valid';
    }
    if (that.isNotNull(throwError)){
        throw(new noiceException({
            message:        `${this._className}/ARSConfig setter: ${throwError}`,
            messageNumber:   1,
            thrownBy:       `${that._className}/ARSConfig setter`
        }));
    }else{
        this._ARSConfig = v;
    }
}




/*
    set/get formName
*/
get formName(){ return(this._formName); }
set formName(v){
    if (this.hasARSConfig && (this.ARSConfig.hasOwnProperty('forms')) && (! (this.ARSConfig.forms.hasOwnProperty(v)))){
        throw(new noiceException({
            message:        `${this._className}/formName setter: specified formName(${v}) not in ARSConfig`,
            messageNumber:   2,
            thrownBy:       `${that._className}/formName setter`
        }));
    }else{
        this._formName = v;
    }
}




/*
    get formViewConfig(viewName)
    viewName is optional, we'll throw if the viewName doesn't exist as a child of
    of .display_properties on the fields
*/
getFormViewConfig(viewName){
    let that = this;

    // da bouncer
    if (that.isNull(that.formName)){
        throw(new noiceException({
            message:        `${this._className}/getFormViewConfig formName is not set`,
            messageNumber:   3,
            thrownBy:       `${that._className}/getFormViewConfig`
        }));
    }else{

        // find the distinct list of views in the config
        let views = {};
        Object.keys(that.ARSConfig.forms[that.formName].idIndex).forEach(function(fieldID){
            if (that.ARSConfig.forms[that.formName].idIndex[fieldID].display_properties instanceof Object){
                Object.keys(that.ARSConfig.forms[that.formName].idIndex[fieldID].display_properties).forEach(function(viewName){
                    views[viewName] = true;
                });
            }
        });

        // bounce if we don't have that one
        if ((that.isNotNull(viewName) && (Object.keys(views).indexOf(viewName) < 0)){
            throw(new noiceException({
                message:        `${this._className}/getFormViewConfig ${formName} requested ${viewName} is not in config`,
                messageNumber:   4,
                thrownBy:       `${that._className}/getFormViewConfig`
            }));
        }

        // setup a default view
        if (that.isNull(viewName)){
            if (views.hasOwnProperty('Default Administrator View')){
                viewName = 'Default Administrator View';
            }else if (views.hasOwnProperty('Default Administrator View__c')){
                viewName = 'Default Administrator View__c';
            }else if (Object.keys(views).length > 0){
                viewName = Object.keys(views).sort()[0];
            }
            if (that.isNull(viewName)){
                throw(new noiceException({
                    message:        `${this._className}/getFormViewConfig ${formName} cannot find default viewName in config`,
                    messageNumber:   5,
                    thrownBy:       `${that._className}/getFormViewConfig`
                }));
            }
        }


        let out = { fields: {}, filters: {} };
        Object.keys(that.ARSConfig.forms[that.formName].idIndex).forEach(function(fieldID){
            /*
                properties we need to find:

                    .type
                    .maxLength
                    .label
                    .displayOrder
                    .displaySection
                    .rows
                    .values [for enums]
                    .modes: {
                        modify: { display, edit, nullable, defaultValue}
                        create: { display, edit, nullable}
                        clone:  { fieldMenu, inhertValue, nullable}
                    }
            */
            let shawty = that.ARSConfig.forms[that.formName].idIndex[fieldID]
            out.fields[fieldID] = {
                id: fieldID,
                type: shawty.datatype.toLowerCase(),
                name: shawty.name,
                label: shawty.display_properties[viewName].LABEL,
                labelLocation: that.editLabelLocation,
                labelLength: that.editLabelLength,
                modes: {
                    create: {
                        display: (shawty.display_properties[viewName].VISIBLE == 1),
                        edit: (shawty.display_properties[viewName].ENABLE == 2),
                        nullable: (! (shawty.field_option == 'REQUIRED')),
                        defaultValue: shawty.default_value
                    },
                    modify: {
                        display: (shawty.display_properties[viewName].VISIBLE == 1),
                        edit: (shawty.display_properties[viewName].ENABLE == 2),
                        nullable: (! (shawty.field_option == 'REQUIRED')),
                        defaultValue: shawty.default_value
                    },
                    clone:  {
                        fieldMenu: ((shawty.display_properties[viewName].ENABLE == 2) && (! (shawty.field_option == 'DISPLAY'))),
                        edit: (shawty.display_properties[viewName].ENABLE == 2),
                        nullable: (! (shawty.field_option == 'REQUIRED')),
                        labelLocation: that.cloneLabelLocation,

                        // these are gonna need some help on the logic
                        inheritValue: (! (shawty.field_option == 'SYSTEM')),
                        removable: (! (shawty.field_option == 'REQUIRED'))
                    }
                }
            }

            // put in maxLength if we've got one
            if (shawty.limit.hasOwnProperty('max_length')){ out.fields[fieldID].maxLength = shawty.limit.max_length; }

            // fix integer type
            if (out.fields[fieldID].type == 'integer'){ out.fields[fieldID].type = 'int'; }

            // fix "enum"
            if (out.fields[fieldID].type == 'enum'){

                // sort out the type
                if (shawty.display_properties[viewName].hasOwnProperty('DATA_RADIO')){
                    if (shawty.display_properties[viewName].DATA_RADIO == 1){
                        // radio
                        out.fields[fieldID].type = 'radio';
                    }else if (shawty.display_properties[viewName].DATA_RADIO == 2){
                        // checkbox
                        out.fields[fieldID].type = 'checkbox';
                    }
                }else{
                    // dropdown
                    out.fields[fieldID].type = 'dropdown';
                }

                // value list
                out.fields[fieldID].values = [];
                if (shawty.limit.hasOwnProperty('selection_values')){
                    shawty.limit.selection_values.forEach(function(o){
                        out.fields[fieldID].values.push(o.name);
                    });
                }

            }

            // insert menu if we've got one
            if (shawty.limit.hasOwnProperty('char_menu')){
                out.fields[fieldID].menu = shawty.limit.char_menu;
            }

            // insert ROWS if we've got that
            if (shawty.display_properties[viewName].hasOwnProperty('DATA_ROWS')){
                out.fields[fieldID].rows = shawty.display_properties[viewName].DATA_ROWS;
            }

            // interpolate displayOrder from tab_order if we've got it
            if (shawty.display_properties[viewName].hasOwnProperty('TAB_ORDER')){
                out.fields[fieldID].displayOrder = shawty.display_properties.TAB_ORDER;
            }

            // displaySection from custom css style
            if (
                shawty.display_properties[viewName].hasOwnProperty('FIELD_CUSTOMSTYLE') &&
                that.isNotNull(shawty.display_properties[viewName].FIELD_CUSTOMSTYLE) &&
                (/^noiceFieldSection_/.test(shawty.display_properties[viewName].FIELD_CUSTOMSTYLE))
            ){
                out.fields[fieldID].displaySection = shawty.display_properties[viewName].FIELD_CUSTOMSTYLE.replace('noiceFieldSection_','');
            }

            // if you didn't put in that, then the FIELD_OPTION shall be thine displaySection. verily.
            if ((! (out.fields[fieldID].hasOwnProperty('displaySection')))){
                out.fields[fieldID].displaySection = shawty.field_option;
            }


            /*
                LOH 10/18/21 @ 2022
                ok hooked up the displaySection.
                recon there are lotsa syntax errors. give it a try and see what it spits out next.
            */

            /*
                .datatype mappings
                CHAR        => "char"
                DATE        => "date"
                INTEGER     => "int"
                REAL        => "real"
                DECIMAL     => "decimal"
                TABLE       => "table"
                CURRENCY    => "currency"
                ENUM        => "dropdown", "checkbox", "radio"
                    checkbox, dropdown, and radio are indistinguishible in
                    the root. They are all .datatype="ENUM". This can be
                    shadily determined by checking view properties.
                    Look for this:

                    .display_properties[<viewName>].DATA_RADIO
                        0 = "dropdown"
                        1 = "radio"
                        2 = "checkbox"

                also the 'text' noiceCoreFormElement type is CHAR where:
                .display_properties[<viewName>].DATA_ROWS > 1

                also the displayMode is actually
                .display_properties[<viewName>].ENABLE
                    0 = ??
                    1 = Read Only
                    2 = Read/Write
                    3 = Disabled

                also the hidden flag is
                .display_properties[<viewName>].VISIBLE
                    0 = hide
                    1 = show
            */



            /*
                these interesting things appear in the field details spat back by the API:

                .id = <fieldID>
                .datatype: CHAR |
                .last_update_time: <isoDateTime>
                .name: (is this dbName or is this Label?)
                .field_option == "REQUIRED" | "SYSTEM" | "OPTIONAL"
                .create_mode "OPEN_AT_CREATE" | "PROTECTED_AT_CREATE" ('Allow Any User to Submit')
                .display_properties = {
                    <viewName>: {
                        DATA_COLS: <int>
                        DATA_ROWS: <int>
                        TAB_ORDER: <int>
                        VISIBLE:   <int> (abstract bool? seeing lotsa 1's)
                    },
                    ...
                }
                .limit: {
                    char_menu:  <name of menu>
                    length_unit: "AR_LENGTH_UNIT_BYTE" (?)
                    max_length: <int>
                    menu_style: OVERWRITE | APPEND
                    pattern: <str>
                    full_text_options: {
                        index_for_fts:      <"None" | indexName>
                        literal_fts_index:  <bool>
                    }
                }

            */
        });
    }
}




}
