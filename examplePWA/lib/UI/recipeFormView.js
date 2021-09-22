/*
    recipeFormView.js
*/
class recipeFormView extends formView {




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
            _originalRowTitle:  '',
            debug:              true
        }, defaults),
        callback
    );

} // end constructor




/*
    renderCallback
*/
renderCallback(){
    super.renderCallback();

    // setup the rowTitle
    this._originalRowTitle = this.rowTitle;

    // if we're being born with a non-null entryID, use that for the rowID
    if (this._formElements.entryID instanceof noiceCoreUIFormElement){
        if (this.isNotNull(this._formElements.entryID.value)){
            this.rowID = this.formElements.entryID.value;
        }
    }
}



/*
    handleTemplate override
*/
get handleTemplate(){
    return(`
        <div class="rowHandle" data-templatename="_handleMain" data-rowid="${this.rowID}" data-status="unidentified" data-dirty="false">
            <div class="handle">
                <h3 data-templatename="rowTitle" data-templateattribute="true">&nbsp;</h3>
                <div class="handleDataRow">
                    <span data-templatename="rowStatus" data-templateattribute="true">&nbsp;</span>
                    <span data-templatename="category" data-templateattribute="true">&nbsp;</span>
                    <span data-templatename="status" data-templateattribute="true">&nbsp;</span>
                </div>
                <div class="handleDataRow">
                    <span data-templatename="author" data-templateattribute="true">&nbsp;</span>
                    <span data-templatename="modifiedDate" data-templateattribute="true">&nbsp;</span>
                </div>
            </div>
        </div>
    `);
}




/*
    fieldValueChangeCallback(fieldName, newValue, oldValue, formElement)
*/
fieldValueChangeCallback(fieldName, newValue, oldValue, formElement){
    let that = this;
    return(new Promise(function(toot, boot){
        if (that.debug){ that._app.log(`${that._className} | fieldValueChangeCallback(${fieldName}, ${newValue}, ${oldValue})`); }

        /*
            copy title value to the rowTitle
        */
        if (fieldName == 'title'){
            that.rowTitle = (that.isNotNull(newValue))?newValue:that._originalRowTitle;
        }

        /*
            link entryID value to rowID
        */
        if ((fieldName == 'entryID') && (that.isNotNull(newValue))){
            that.rowID = newValue;
        }

        // insert thine shenanigans here

        toot(newValue);
    }));
}


} // end of class
