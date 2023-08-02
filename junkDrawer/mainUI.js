/*
    mainUI.js
    this is the main screen
*/
import { noiceCoreUIScreen } from '../noice/noiceCoreUI.js';
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
            _locked: false,
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
            <span class="title" data-templatename="title" data-templateattribute="true">${this.title}</span>
            <div class="btnContainer" style="
                display: flex;
                flex-direction: row-reverse;
            ">
                <button class="btnBurger"></button>
            </div>
        </div>
        <div class="main" style="overflow-y:auto;">
            <!-- insert shenanigans here
            <p>I'm baby hexagon ascot ramps mustache, prism tumeric flexitarian.</p>
            <p>Butcher cred readymade twee, selfies kale chips put a bird on it sustainable vaporware. Hexagon chia pabst, cred before they sold out pitchfork banh mi sartorial PBR&B paleo church-key gastropub neutral milk hotel adaptogen. Slow-carb fanny pack tote bag chia yuccie. Polaroid tumeric edison bulb pork belly enamel pin, tote bag cray readymade austin YOLO fashion axe flexitarian poke small batch.</p>
            <p>Readymade skateboard hoodie keytar blog forage you probably haven't heard of them irony beard church-key. Next level tilde you probably haven't heard of them unicorn tbh biodiesel affogato bitters vice lumbersexual DIY. Knausgaard kickstarter salvia taiyaki tumeric, la croix pok pok raclette snackwave gorpcore. Distillery leggings poutine helvetica adaptogen kombucha etsy kale chips air plant affogato artisan bespoke. JOMO biodiesel stumptown, craft beer try-hard pickled typewriter vegan kickstarter readymade asymmetrical marxism hexagon. Umami iceland tousled vinyl crucifix pabst taxidermy celiac kale chips hashtag authentic. Wolf gentrify echo park bitters beard.</p>
            <p>Health goth helvetica messenger bag, deep v banh mi vegan JOMO. Gentrify plaid blog 90's williamsburg yr direct trade stumptown flexitarian chartreuse kale chips authentic crucifix. Food truck lo-fi cliche, ugh gastropub keytar copper mug sriracha tbh. Stumptown bitters post-ironic, cornhole craft beer woke fit knausgaard cold-pressed palo santo big mood enamel pin messenger bag swag master cleanse. Praxis man bun cliche, lo-fi hella vegan umami mumblecore four dollar toast sustainable before they sold out tofu yes plz 3 wolf moon. PBR&B migas scenester edison bulb biodiesel kombucha. Heirloom snackwave palo santo, man bun umami microdosing fanny pack bicycle rights.</p>
            <p>Disrupt iceland forage raclette. Vinyl kickstarter ennui raw denim scenester fanny pack Brooklyn leggings poke man braid keffiyeh 8-bit succulents crucifix. 90's distillery pabst street art, single-origin coffee subway tile crucifix. Tofu fanny pack offal, lyft small batch tousled yr.</p>
            <p>Readymade skateboard hoodie keytar blog forage you probably haven't heard of them irony beard church-key. Next level tilde you probably haven't heard of them unicorn tbh biodiesel affogato bitters vice lumbersexual DIY. Knausgaard kickstarter salvia taiyaki tumeric, la croix pok pok raclette snackwave gorpcore. Distillery leggings poutine helvetica adaptogen kombucha etsy kale chips air plant affogato artisan bespoke. JOMO biodiesel stumptown, craft beer try-hard pickled typewriter vegan kickstarter readymade asymmetrical marxism hexagon. Umami iceland tousled vinyl crucifix pabst taxidermy celiac kale chips hashtag authentic. Wolf gentrify echo park bitters beard.</p>
            <p>Craft beer schlitz offal, cliche beard viral sus adaptogen irony gatekeep pug. Viral cloud bread chia, hoodie narwhal bitters activated charcoal celiac bruh kinfolk. 8-bit kogi distillery master cleanse activated charcoal. Marxism hammock squid single-origin coffee fam blackbird spyplane beard fanny pack banjo vape before they sold out gentrify glossier biodiesel.</p>
            <p>Dummy text? More like dummy thicc text, amirite?</p>
             -->
        </div>
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

    // clickHandler for the burgerMenu
    that.btnBurger.addEventListener('click', (evt) => {
        that.btnBurger.disabled = true;
        requestAnimationFrame(() => {
            that.openBurgerMenu().catch((error) => {
                // loose end: do we wanna pop up or something here?
                that._app.log(`${that._className} v${that.version} | btnBurger.clickHandler() | openBurgerMenu() threw unexpectedly: ${error}`);
            }).then(() =>{
                that.btnBurger.disabled = false;
            });
        });
    });
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
        that.burgerMenuContainer = document.createElement('div');
        that.burgerMenuContainer.className = 'burgerMenu';
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
                    if (that.debug){ that._app.log(`${that._className} v${that._version} | openBurgerMenu() | openBurgerUICallback() aborted menu open: ${error}`); }
                    toot(false);
                }
            }).catch((error) => {
                that._app.log(`${that._className} v${that._version} | openBurgerMenu() | openBurgerUICallback() threw unexpectedly: ${error}`);
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
