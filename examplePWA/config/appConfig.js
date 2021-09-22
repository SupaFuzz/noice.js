var _applicationConfig = {




/*
    cache manifest
    the list of files the serviceWorker manages
    when the asset list is updated be sure to
    change the 'name' parameter
*/
cache: {
    name:   'noiceExamplePWA_cache_v1',
    assets: [
        './',
        './index.html',
        './noiceExamplePWA.css',
        './manifest.json',
        './noiceExamplePWA.css',

        './config/appConfig.js',

        './lib/noiceExamplePWA.js',
        './lib/UI/mainUI.js',
        './lib/UI/recipeEditorUI.js',
        './lib/UI/recipeFormView.js',

        './gfx/touch_icon.png',
        './gfx/favicon.png',
        './gfx/splash_screen.png',
        './gfx/hicox_flower.svg',
        './gfx/burger.svg',
        './gfx/checkUpdates_icon.svg',
        './gfx/reset_icon.svg',
        './gfx/export_icon.svg',
        './gfx/import_icon.svg',
        './gfx/checkUpdates_icon_dark.svg',
        './gfx/warning_dark.svg',
        './gfx/back-arrow.svg',
        './gfx/add-icon.svg',
        './gfx/add-icon-dark.svg',
        './gfx/clone-icon.svg',
        './gfx/cancel-icon.svg',
        './gfx/fuscia_warning.svg',
        './gfx/undo-icon.svg',
        './gfx/remove-icon.svg',

        './gfx/fonts/Comfortaa.woff2',

        './lib/noice/noiceCore.js',
        './lib/noice/noiceCoreUI.js',
        './lib/noice/noiceCoreUIFormElement.js',
        './lib/noice/noiceCoreUITemplate.js',
        './lib/noice/noiceCoreUIFormView.js',
        './lib/noice/noiceCoreUIFormCloneView.js',
        './lib/noice/noiceIndexedDB.js',
        './lib/noice/UI/noicePieChart.js',
        './lib/noice/UI/RadialPolygonPath.js',
        './lib/noice/UI/installHelpDialog.js',
        './lib/noice/UI/startupDialog.js',
        './lib/noice/UI/noiceBalloonDialog.js',
        './lib/noice/UI/recordEditorUI.js',
        './lib/noice/formView.js'
    ]
},




/*
    indexedDB definitions
    this is the structure for indexedDB tables the app will access
    when this structure changes, you MUST increment the dbVersion
    to a larger integer value or indexedDB will crash.

    also any column name you wish to index, MUST NOT be an integer
    even a string containing only numeric digits will not work.
    incredibly, this violates the indexedDB WC3 spec, I kid you not!
*/
indexedDBDefinition: {
    dbName:     'noiceExamplePWA_DB',
    dbVersion:  1,
    storeDefinitions: {

        /*
            recipes
            the static table of recipies from the server.
            if changes are made by the user, they are queued in
            the journal table, and we apply them in chronological
            order to the record on view.
        */
        recipes: {
            createOptions:  { keyPath: 'rowID' },
            indexes: {
                entryID:    { keyPath: 'entryID', unique: true},
                author:     { keyPath: 'author' },
                category:   { keyPath: 'category' },
                title:      { keyPath: 'title' }
            }
        },

        /*
            journal
            if the user creates a new recipe, or modifies an existing
            one, the data is written here. For changes to existing
            recipes, the 'rowId' is the 'entryID' value from the
            recipes table. Create transactions generate a GUID
            for the rowId, and subsequent changes to a created
            row share the same rowId
        */
        journal: {
            createOptions:      { keyPath: 'journalId', autoIncrement: true },
            indexes: {
                rowId:          { keyPath: 'rowId' }
            }
        },

        /*
            menus
            contains menu values by fieldID
            objects of the form:
                {
                    fieldID:  <int>,
                    values:   <obj || array>
                }
        */
        menus: {
            createOptions:      {keyPath: 'id', autoIncrement: true},
            indexes: {
                fieldID:        {keypath: 'fieldID'}
            }
        },

        /*
            meta
            arbitrary persistent application data
            objects of the form
                {
                    key:    <str>,
                    value:  <arbitrary> ...
                }
        */
        meta: {
            createOptions:      {keyPath: 'key', unique: true }
        }
    }
},




/*
    form definitions
*/
'Forms': {
    recipe: {
        fields: {
            entryID:    {
                id:                 1,
                dbIndex:            'entryID',
                type:               'char',
                maxLength:          15,
                label:              'Entry ID',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                valueLength:        'auto',
                displayOrder:       1,
                displaySection:     '  identification',
                modes: {
                    modify: { display:true, edit:false, nullable:true },
                    create: { display:false, edit:false, nullable:true },
                    clone:  { fieldMenu:false, inheritValue:false, nullable:true }
                }
            },
            category:       {
                id:                 8,
                dbIndex:            'category',
                type:               'char',
                maxLength:          '254',
                label:              'Category',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                valueLength:        'auto',
                displayOrder:       2,
                displaySection:     '  identification',
                trimWhitespace:     true,
                modes:{
                    modify: { display:true, edit:true, nullable:false },
                    create: { display:true, edit:true, nullable:false },
                    clone:  { fieldMenu: true, inheritValue: true, labelLocation: 'top', removable: true, default: true, displayOrder: 2, nullable:false }
                }
            },
            author:     {
                id:                 2,
                dbIndex:            'author',
                type:               'char',
                maxLength:          '254',
                label:              'Author',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                valueLength:        'auto',
                displayOrder:       3,
                displaySection:     '  identification',
                trimWhitespace:     true,
                modes:{
                    modify: { display:true, edit:true, nullable:false },
                    create: { display:true, edit:true, nullable:false },
                    clone:  { fieldMenu: true, inheritValue: true, labelLocation: 'top', removable: true, nullable:false}
                }
            },
            createDate: {
                id:                 3,
                type:               'dateTime',
                label:              'Create Date',
                labelLength:        'auto',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                valueLength:        'auto',
                displaySection:     'etc.',
                displayOrder:       4,
                poExport:           false,
                modes:{
                    modify: { display:true, edit:false, nullable:true },
                    create: { display:false, edit:false, nullable:true },
                    clone:  { fieldMenu: false, inheritValue:false, nullable:true }
                },
            },
            title:      {
                id:                 12340001,
                dbIndex:            'title',
                type:               'char',
                maxLength:          '254',
                label:              'Title',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                valueLength:        'auto',
                displayOrder:       3,
                displaySection:     ' main',
                trimWhitespace:     true,
                modes:{
                    modify: { display:true, edit:true, nullable:false },
                    create: { display:true, edit:true, nullable:false },
                    clone:  { fieldMenu: true, inheritValue: false, labelLocation: 'top', removable: false, default: true, displayOrder: 1, nullable:false}
                }
            },
            body:       {
                id:                 12340002,
                type:               'text',
                maxLength:          0,
                rows:               10,
                label:              'Body',
                labelLength:        'auto',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                valueLength:        'auto',
                displayOrder:       5,
                displaySection:     ' main',
                trimWhitespace:     true,
                modes:{
                    modify: { display:true, edit:true, nullable:false },
                    create: { display:true, edit:true, nullable:true },
                    clone:  { fieldMenu: true, inheritValue: true, labelLocation: 'top', removable: true, nullable:false}
                }
            },
            status:     {
                id:                 7,
                type:               'dropdown',
                label:              'Status',
                labelLength:        'auto',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                displayOrder:       6,
                displaySection:     'etc.',
                values:             [ 'unpublished', 'published' ],
                modes: {
                    modify: { display:true, edit:true, nullable:false },
                    create: { display:true, edit:true, nullable:false, defaultValue: 'unpublished'},
                    clone:  { fieldMenu: true, inheritValue: true, labelLocation: 'top', removable: true, nullable:false }
                }
            },
            modifiedDate: {
                id:                 6,
                type:               'dateTime',
                label:              'Modified Date',
                labelLength:        'auto',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                valueLength:        'auto',
                displaySection:     'etc.',
                displayOrder:       7,
                modes:{
                    create: { display:false, edit:false, nullable:true },
                    modify: { display:true, edit:false, nullable:true },
                    clone:  { fieldMenu: false, inheritValue:false, nullable:true }
                },
            },
            lastModifiedBy: {
                id:                 5,
                type:               'char',
                maxLength:          255,
                label:              'Last Modified By',
                labelLocation:      'left',
                labelLength:        '14.754060723vw',
                valueLength:        'auto',
                displaySection:     'etc.',
                displayOrder:       8,
                modes:{
                    modify: { display:true, edit:false, nullable:true },
                    create: { display:false, edit:false, nullable:true },
                    clone:  { fieldMenu: false, inheritValue:false, nullable:true }
                }
            }
        },
        filters: {

            /*
                save | 1 - fill in auto-generated dates
            */
            defaultDates: {
                name:       'set default dates',
                enabled:    true,
                executeOn:  'save',
                order:      1,
                formModes:  ['create', 'modify', 'clone'],
                executor:   function(formView, pipeData){
                    return(new Promise(function(toot, boot){

                        // set modifiedDate to current time
                        formView._formElements['modifiedDate'].value = formView.epochTimestamp();

                        // in create mode, set createDate to current time
                        if (formView.formMode == 'create'){
                            formView._formElements['createDate'].value = formView.epochTimestamp();
                        }

                        // if your filter needs to stop the train without throwing set abort: true
                        // if your filter needs to stop the train with throwing, boot with a noiceException
                        toot({
                            abort: false,
                            pipeData: (pipeData instanceof Object)?pipeData:{}
                        });

                    }));
                }
            },


            /*
                validate | 1 - required fields are required
            */
            requiredFieldValidation: {
                name:       'nullable field validation',
                enabled:    true,
                executeOn:  'validate',
                order:      1,
                formModes:  ['create', 'modify', 'clone'],
                executor:  function(formView, pipeData){
                    return(new Promise(function(toot, boot){

                        let validationErrors = [];
                        Object.keys(formView._formElements).forEach(function(fieldName){

                            // look for non-nullable fields which are null
                            if (
                                (formView.config.fields[fieldName].modes) &&
                                (formView.config.fields[fieldName].modes[formView.formMode]) &&
                                (! formView.config.fields[fieldName].modes[formView.formMode].nullable) &&
                                (formView.isNull(formView._formElements[fieldName].value))
                            ){
                                validationErrors.push({
                                    type:           'field',
                                    fieldLabel:     formView._formElements[fieldName].label,
                                    fieldName:      fieldName,
                                    errorNumber:    2,
                                    errorMessage:   'a value is required'
                                });
                                formView._formElements[fieldName].addValidationError(validationErrors[(validationErrors.length -1)]);
                            }

                        });

                        // merge validation errors into pipe data
                        if (pipeData.hasOwnProperty('validationErrors')){
                            validationErrors.forEach(function(err){ pipeData.validationErrors.push(err); })
                        }else{
                            pipeData.validationErrors = validationErrors;
                        }

                        // we out!
                        toot({
                            abort: (validationErrors.length > 0),
                            pipeData: (pipeData instanceof Object)?pipeData:{}
                        });

                    }));
                }
            },




            /*
                more filters would go here

                keep in mind you can do db ops by formView._app.indexedDB
                executeOn: 'save'
                means the filter gets executed on formView.save() before the
                saveCallback so can cancel the save.
                the main thing is that filters execute in order and asynchronously
                but not concurrently. They are chained by 'order'

            */
        }
    },
    // to do: make it fancy with an ingrediant list supporting table
},


/*
    additional things you might want to add in here:
        * a regex army
        * build a field.id mapping table
        * saveFilters for recipes form
*/


} // end config definition
