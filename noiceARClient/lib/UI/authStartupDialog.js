/*
    authStartupDialog.js
    this is a startupDialog subclass extended to have a user/pass
    entry with an authCallback(), etc etc.
*/
class authStartupDialog extends startupDialog {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(args, noiceObjectCore.mergeClassDefaults({
        _version:               1,
        _className:             'authStartupDialog'
    }, defaults), callback);

}




/*
    setup()
    tack on the auth stuff
*/
setup(){
    super.setup();

    let that = this;

    // insert the auth DOM stuff
    that.loginDiv = document.createElement('div');
    that.loginDiv.className = 'loginUI';

    that.userInput = new noiceCoreUIFormElementInput({
        type:           'char',
        maxLength:      40,
        label:          'Login ID',
        labelLocation:  'left',
        valueLength:    'auto'
    }).append(that.loginDiv);

    that.userPass = new noiceCoreUIFormElementPassword({
        type:           'char',
        maxLength:      254,
        label:          'Password',
        labelLocation:  'left',
        valueLength:    'auto'
    }).append(that.loginDiv);

    that.authErrorMsg = document.createElement('span');
    that.authErrorMsg.className = 'authErrorMsg';
    that.authErrorMsg.style.display = "none";
    that.loginDiv.appendChild(that.authErrorMsg);

    that.startupWelcomeDiv.appendChild(that.loginDiv);

    // set it up
    that.startButtonDOMObject.disabled = true;
    that.startButtonDOMObject.textContent = 'Login';
    that.cancelButtonDOMObject.textContent = "check for updates";
    that.cancelButtonDOMObject.classList.add('btnUpdate');

    // toggle the login button
    that.userInput.valueChangeCallback = async function(n, o, s){
        that.startButtonDOMObject.disabled = (that.isNull(n) || that.isNull(that.userPass.value));
        return(n);
    }
    that.userPass.valueChangeCallback = async function(n, o, s){
        that.startButtonDOMObject.disabled = (that.isNull(n) || that.isNull(that.userInput.value));
        return(n);
    }

    // chain the startButtonCallback behind the authCallback if we have both
    if ((that.authCallback instanceof Function) && (that.startButtonCallback instanceof Function)){
        let tmp = that.startButtonCallback;
        that.startButtonCallback = function(that, evt){
            evt.target.disabled = true;
            that.authErrorMsg.style.display = "none";
            let authAbort = false;
            that.authCallback({ user: that.userInput.value, password: that.userPass.value }).catch(function(error){
                authAbort = true;
                that._app.log(`${that._className} | authCallback threw: ${error}, startup aborted`);
                that.authErrorMsg.textContent = error;
                that.authErrorMsg.style.display = "block";
                evt.target.disabled = false;
            }).then(function(authOutput){
                if (! authAbort){ tmp(that, evt); }
            })
        }
    }
}


} // end class
