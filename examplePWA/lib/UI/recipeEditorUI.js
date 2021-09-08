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
        }, defaults),
        callback
    );

} // end constructor




}
