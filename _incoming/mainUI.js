/*
    mainUI.js
    this is the main screen

    this is a handy object template for a main screen UI switcher thing
    TO-DO (7/19/23): tidy it up and make it part of the lib
*/
import { noiceCoreUIScreen, noiceCoreUIScreenHolder } from '../noice/noiceCoreUI.js';
import { noiceObjectCore } from '../noice/noiceCore.js';
import { noiceBalloonDialog } from '../noice/UI/noiceBalloonDialog.js';

class mainUI extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'mainUI',
            _headerHeight: '2em',
            _burgerMenuTitle: '',
            _showBurgerMenu: true,
            _burgerMenu: null,
            _defaultBurgerMenu: null,
            _locked: false,
            _UIs: {},
            useDefaultBurgerMenu: true,
            burgerMenuContainer: null,
            openBurgerMenuCallback: null,     // async function exexutes before putting burgerMenu on screen toot false to abort open
            burgerMenuOpenedCallback: null,  // function executes in the next animationFrame after placing the burgerMenu on the screen
            debug: true
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <div class="rootLayoutContainer" style="
        display: grid;
        width: 100%;
        height: 100%;
        grid-template-rows: ${this.headerHeight} auto;
    ">
        <div class="header" style="
            display: grid;
            grid-template-columns: auto auto;
            align-items: center;
        ">
            <div class="titleContainer">
                <span class="title" data-templatename="title" data-templateattribute="true">${this.title}</span>
                <span class="subTitle" data-templatename="subTitle" data-templateattribute="true"></span>
            </div>
            <div class="btnContainer" style="
                display: flex;
                flex-direction: row-reverse;
            ">
                <button class="btnBurger"></button>
            </div>
        </div>
        <div class="main" style="overflow-y:auto;"></div>
    </div>
`);}




/*
    setupCallback(self)
    perform these actions after render but before focus is gained
*/
setupCallback(self){
    let that = this;

    // snag useful things
    that.btnContainer = that.DOMElement.querySelector('div.btnContainer');
    that.btnBurger = that.DOMElement.querySelector('button.btnBurger');
    that.main = that.DOMElement.querySelector('div.main');

    // make a container for the burgerMenu to live in
    that.burgerMenuContainer = document.createElement('div');
    that.burgerMenuContainer.className = 'burgerMenu';

    // clickHandler for the burgerMenu
    that.btnBurger.addEventListener('click', (evt) => {
        that.btnBurger.disabled = true;
        requestAnimationFrame(() => {
            that.openBurgerMenu().catch((error) => {
                // loose end: do we wanna pop up or something here?
                that._app.log(`${that._className} v${that._version} | btnBurger.clickHandler() | openBurgerMenu() threw unexpectedly: ${error}`);
            }).then(() =>{
                that.btnBurger.disabled = false;
            });
        });
    });

    // make a uiHolder and put it in the main section
    that.uiHolder = new noiceCoreUIScreenHolder({fullscreen:false}).append(that.main);
}




/*
    firstFocusCallback(focusArgs)
    this gets called once on the first focus (might need it might not dunno)
*/
firstFocusCallback(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        console.log("inside firstFocusCallback()");

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

        console.log("inside gainFocus()");

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

        console.log("inside loseFocus()");

        // toot unless you wanna abort, then boot
        toot(true);
    }));
}




/*
    UIs
*/
get UIs(){ return(this.uiHolder.UIList); }
set UIs(v){
    if (v instanceof Object){
        let that = this;
        requestAnimationFrame(() =>{
            // remove any UIs in the list that aren't in the new one
            Object.keys(that.uiHolder.UIList).filter((a)=>{return(! (v.hasOwnProperty(a)))}).forEach((uiName) => { that.uiHolder.removeUI(uiName); });
            // add or update
            Object.keys(v).forEach((uiName) => { that.uiHolder.addUI(v[uiName], uiName); });
        });
    }
}




/*
    defaultBurgerMenu
*/
get defaultBurgerMenu(){
    let that = this;

    // make one if we don't have one
    if (that.isNull(this._defaultBurgerMenu)){
        let dbm = document.createElement('div');
        dbm.className = 'defaultBurgerMenu';
        dbm.style.display = "grid";

        Object.keys(that.uiHolder.UIList).sort((a,b) => {return(

            /* this works but breaks if a UI doesn't define sortOrder */
            that.uiHolder.UIList[a].sortOrder -
            that.uiHolder.UIList[b].sortOrder

        )}).forEach((uiName) => {
            let btn = document.createElement('button');
            btn.className = "burgerMenuItem";
            if (that.uiHolder.UIList[uiName].hasOwnProperty('btnClass')){ btn.classList.add(that.uiHolder.UIList[uiName].btnClass); }
            btn.dataset.name = uiName;
            btn.dataset.selected = (that.uiHolder.currentUI == uiName);
            btn.textContent = that.uiHolder.UIList[uiName].hasOwnProperty('title')?that.uiHolder.UIList[uiName].title:uiName;
            btn.addEventListener('click', (evt) => {
                btn.disalbed = true;
                that.uiHolder.switchUI((btn.dataset.selected == 'true')?null:uiName).then(() => {

                    let b = (btn.dataset.selected == 'true');

                    // visually un-select everything, then reset this one if we didn't set null
                    dbm.querySelectorAll('button.burgerMenuItem').forEach((el) => {el.dataset.selected = false; });
                    if (! b){ btn.dataset.selected = 'true'; }

                    that.subTitle = b?'':`${btn.textContent}`;

                }).catch((error) => {
                    // this is not necessarily a bad error. could be something like a user abort to save a changeFlag or whatever
                    if (that.debug){ that._app.log(`${that._className} v${that._version} | defaultBurgerMenu() item click handler threw unexpectedly (probably user abort): ${error}`)}
                });
            });
            dbm.appendChild(btn);
        });
        return(dbm);
    }
}



/*
    headerHeight(cssHeightValStr)
*/
get headerHeight(){ return(this._headerHeight); }
set headerHeight(v){
    let that = this;
    requestAnimationFrame(() => {
        that._headerHeight = v;
        if (that.DOMElement instanceof Element){
            let el = that.DOMElement.querySelector('div.rootLayoutContainer');
            if (el instanceof Element){
                el.style.gridTemplateRows = `${that.headerHeight} auto`;
            }
        }
    });
}




/*
    showBurgerMenu(bool)
*/
get showBurgerMenu(){ return(this._showBurgerMenu == true); }
set showBurgerMenu(v){
    let that = this;
    that._showBurgerMenu = (v == true);
    requestAnimationFrame(() => {
        if (that.btnBurger instanceof Element){
            that.btnBurger.style.display = that.showBurgerMenu?'block':'none';
        }
    })
}




/*
    burgerMenu
    override this externally if you need a more elaborate burger menu
*/
get burgerMenu(){
    let that = this;

    // make one if we haven't made one already.
    if (that.isNull(that._burgerMenu)){

        that._burgerMenu = new noiceBalloonDialog({
            title: that.burgerMenuTitle,
            hdrContent: '',
            dialogContent: that.burgerMenuContainer,
            setPosition: (selfReference) => {
                let b = that.btnBurger.getBoundingClientRect();

                selfReference.x = 0;
                let d = selfReference.DOMElement.querySelector('div.dialog').getBoundingClientRect();
                selfReference.y = (b.bottom + 5);
                selfReference.x = (b.right - d.width) - ((b.right - b.left) *.5) + 31;
            },
            burgerMenuContainer: that.burgerMenuContainer
        });
        that._burgerMenu.DOMElement.dataset.arrow='topRight';
    }

    // return it
    return(this._burgerMenu);
}
set burgerMenu(v){
    that._burgerMenu = v;
}




/*
    openBurgerMenu()
    place the burgerMenu on screen.
    if openBurgerMenuCallback is specified, await it, if it returns bool false DON'T open it
    if burgerMenuOpenedCallback is specified, execute in the next animationFrame after putting it onscreen
    if it boots or toots false, take it back off screen
    toots a bool. if we opened the window it's true, if one of the callbacks aborted,  false
*/
openBurgerMenu(){
    let that = this;
    return(new Promise((toot, boot) => {
        if (that.locked){
            toot(false);
        }else{
            new Promise((_t,_b)=>{
                if (that.openBurgerMenuCallback instanceof Function){
                    that.openBurgerMenuCallback(that.burgerMenu).then((openBool)=>{ _t(openBool); }).catch((e)=>{ _b(e); });
                }else{
                    _t(true);
                }
            }).then((openBool) => {
                if (openBool){
                    // if we have useDefaultBurgerMenu set true, just render a Ui switcher menu into it
                    if (that.useDefaultBurgerMenu == true){
                        that.burgerMenuContainer.innerHTML = '';
                        that.burgerMenuContainer.appendChild(that.defaultBurgerMenu);
                    }

                    that.burgerMenu.append(that.DOMElement);
                    if (that.burgerMenuOpenedCallback instanceof Function){
                        requestAnimationFrame(() => {
                            // note burgerMenuOpenedCallback cannot abort open, if you wanna close it from here you gon have to do it yourself
                            that.burgerMenuOpenedCallback(that.burgerMenu).catch((error) => {
                                that._app.log(`${that._className} v${that._version} | [ignored] openBurgerMenu() | burgerMenuOpenedCallback() threw unexpectedly: ${error}`);
                            }).then(() => {
                                toot(true);
                            });
                        });
                    }else{
                        toot(true);
                    }
                }else{
                    if (that.debug){ that._app.log(`${that._className} v${that._version} | openBurgerMenu() | openBurgerMenuCallback() aborted menu open: ${error}`); }
                    toot(false);
                }
            }).catch((error) => {
                that._app.log(`${that._className} v${that._version} | openBurgerMenu() | openBurgermenuCallback() threw unexpectedly: ${error}`);
                boot(error);
            });
        }
    }));
}




/*
    locked
*/
get locked(){ return(this._locked == true); }
set locked(v){
    this._locked = (v == true);
    requestAnimationFrame(() => {

        // insert ui element toggles here
        if (that.btnBurger instanceof Element){ that.btnBurger.disabled = that.locked; }

    });
}




} // end mainUI class
export { mainUI };
