/*
    inventoryDashboard.js

    this is a handy blank uiScreen extension class template
    TO-DO 7/19/23 - clean up and include in standard lib
*/
import { noiceCoreUIScreen } from '../noice/noiceCoreUI.js';
import { noiceObjectCore } from '../noice/noiceCore.js';

class inventoryDashboard extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'inventoryDashboard',
            debug: false
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <h1>Yo Mamma</h1>
`)}




/*
    setupCallback(self)
    perform these actions after render but before focus is gained
*/
setupCallback(self){

    /*
        do thine setup here ye verily
    */

}




/*
    firstFocusCallback(focusArgs)
    this gets called once on the first focus (might need it might not dunno)
*/
firstFocusCallback(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}




/*
    gainfocus(forusArgs)
    fires every time we gain focus
*/
gainFocus(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}




/*
    losefocus(forusArgs)
    fires every time we gain focus
*/
loseFocus(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}



}
export { inventoryDashboard };
