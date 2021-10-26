/*
    noiceARFormView.js

    This formView subclass adds bits and pieces such that an object of this class
    might represent a row in any Form found on an ARS Server that the authenticated
    user has access to.
*/
class noiceARFormView extends formView {





/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version:           1,
            _className:         'noiceARFormView',
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
                    <span data-templatename="8" data-templateattribute="true">&nbsp;</span>
                    <span data-templatename="7" data-templateattribute="true">&nbsp;</span>
                </div>
                <div class="handleDataRow">
                    <span data-templatename="2" data-templateattribute="true">&nbsp;</span>
                    <span data-templatename="6" data-templateattribute="true">&nbsp;</span>
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
        if (fieldName == '8'){
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




}
