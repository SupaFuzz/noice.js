/*
    recipeFormView.js
*/
class recipeFormView extends formView{




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:           1,
            _className:         'recipeFormView',
            _handleTemplate:    '',
            handleNumber:       1
        }, defaults),
        callback
    );
    this.DOMElement.classList.add('formView');

} // end constructor




/*
    handleTemplate override
*/
get handleTemplate(){
    return(`
        <div class="rowHandle" data-templatename="_handleMain" data-guid="${this.getGUID()}" data-status="unidentified">
            <div class="handle">
                <h3 style="margin: .5em;">${this.handleNumber}</h3>
            </div>
        </div>
    `);
}




} // end of class
