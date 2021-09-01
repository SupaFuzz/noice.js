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
        './lib/UI/recordEditor.js',
        './lib/UI/recordFormView.js',

        './gfx/touch_icon.png',
        './gfx/favicon.png',
        './gfx/splash_screen.png',
        './gfx/hicox_flower.svg',
        './gfx/burger.svg',

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
        './lib/noice/UI/startupDialog.js'
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
            createOptions:  { keyPath: 'entryId' },
            indexes: {
                entryId:    { keyPath: 'entryId', unique: true},
                author:     { keyPath: 'author' },
                name:       { keyPath: 'name' },
                title:      { keyPath: 'title' }
            }
        },

        /*
            journal
            if the user creates a new recipe, or modifies an existing
            one, the data is written here. For changes to existing
            recipes, the 'rowId' is the 'entryId' value from the
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
        entryID:    {
            id:                 1,
            dbIndex:            'entryId',
            type:               'char',
            maxLength:          15,
            label:              'Entry ID',
            labelLocation:      'left',
            valueLength:        'auto',
            displayOrder:       1,
            displaySection:     'identification',
            modes: {
                modify: { display:true, edit:false, nullable:true },
                create: { display:false, edit:false, nullable:true },
                clone:  { fieldMenu: false }
            }
        },
        name:       {
            id:                 8,
            dbIndex:            'name',
            type:               'char',
            maxLength:          '254',
            label:              'Name',
            labelLocation:      'left',
            valueLength:        'auto',
            displayOrder:       2,
            displaySection:     'identification',
            trimWhitespace:     true,
            modes:{
                modify: { display:true, edit:true, nullable:false },
                create: { display:true, edit:true, nullable:false },
                clone:  { fieldMenu: true, inheritValue: true }
            }
        },
        author:     {
            id:                 2,
            dbIndex:            'author',
            type:               'char',
            maxLength:          '254',
            label:              'Author',
            labelLocation:      'left',
            valueLength:        'auto',
            displayOrder:       3,
            displaySection:     'identification',
            trimWhitespace:     true,
            modes:{
                modify: { display:true, edit:true, nullable:false },
                create: { display:true, edit:true, nullable:false },
                clone:  { fieldMenu: true, inheritValue: true }
            }
        },
        createDate: {
            id:                 3,
            type:               'dateTime',
            label:              'Create Date',
            labelLength:        'auto',
            labelLocation:      'left',
            valueLength:        'auto',
            displaySection:     'etc.',
            displayOrder:       4,
            poExport:           false,
            modes:{
                modify: { display:true, edit:false, nullable:true },
                create: { display:false, edit:false, nullable:true },
                clone:  { fieldMenu: false }
            },
        },
        title:      {
            id:                 12340001,
            dbIndex:            'title',
            type:               'char',
            maxLength:          '254',
            label:              'Title',
            labelLocation:      'left',
            valueLength:        'auto',
            displayOrder:       3,
            displaySection:     'main',
            trimWhitespace:     true,
            modes:{
                modify: { display:true, edit:true, nullable:false },
                create: { display:true, edit:true, nullable:false },
                clone:  { fieldMenu: true, inheritValue: true }
            }
        },
        body:       {
            id:                 12340002,
            type:               'text',
            maxLength:          0,
            label:              'Body',
            labelLength:        'auto',
            labelLocation:      'left',
            valueLength:        'auto',
            displayOrder:       5,
            displaySection:     'main',
            trimWhitespace:     true,
            modes:{
                modify: { display:true, edit:true, nullable:false },
                create: { display:true, edit:true, nullable:false },
                clone:  { fieldMenu: true, inheritValue: true }
            }
        },
        status:     {
            id:                 7,
            type:               'dropdown',
            label:              'Status',
            labelLength:        'auto',
            labelLocation:      'left',
            displayOrder:       6,
            displaySection:     'etc.',
            values:             [ 'unpublished', 'published' ],
            modes: {
                modify: { display:true, edit:true, nullable:false },
                create: { display:true, edit:true, nullable:false, defaultValue: 'unpublished'},
                clone:  { fieldMenu: true, inheritValue: true }
            }
        },
        modifiedDate: {
            id:                 6,
            type:               'dateTime',
            label:              'Modified Date',
            labelLength:        'auto',
            labelLocation:      'left',
            valueLength:        'auto',
            displaySection:     'etc.',
            displayOrder:       7,
            modes:{
                create: { display:false, edit:false, nullable:true },
                modify: { display:true, edit:false, nullable:true },
                clone:  { fieldMenu: false }
            },
        },
        lastModifiedBy: {
            id:                 5,
            type:               'char',
            maxLength:          255,
            name:               'lastModifiedBy',
            labelLength:        'auto',
            labelLocation:      'left',
            valueLength:        'auto',
            displaySection:     'etc.',
            displayOrder:       8,
            modes:{
                modify: { display:true, edit:false, nullable:true },
                create: { display:false, edit:false, nullable:true },
                clone:  { fieldMenu: false }
            }
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
