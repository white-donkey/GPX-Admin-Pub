const MI_STATUS = {
    COLLAPSED: 0,
    EXPANDED: 1
};

function Menu_Item (menuMeta, parentMenu) {

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Menu_Item}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function addSubMenuItem (mi) {
    let newItem;

    if (this.subMenuItems.length === 0) {
        // This is the first submenu so create the DOM container for
        // the submenus
        this.menuContainer = addNodeToDOM ("div", this.parentMenu.menuContainer, null, null, "display:none;");
        this.collapseMenu();
    }
    if (mi instanceof Menu_Item) {
        newItem = mi;
    }
    else {
        newItem = new Menu_Item (mi, this);
    }
    this.subMenuItems.push (newItem);
    this.menuContainer.style.paddingLeft = (mi.level*20)+"px";

    return newItem;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Menu_Item}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function renderLabel () {
    let classList = null;
    let thiis = this;

    if (this.level === 0) {
        classList = "side-bar-menu-item side-bar-top-menu";
    }
    else {
        classList = "side-bar-menu-item";
        this.parentMenu.subMenuItems.forEach (function (mi, miIndex) {
            if (mi === thiis) {
                if ((miIndex % 2) === 0) {
                    classList += " side-bar-even-submenu";
                }
                else {
                    classList += " side-bar-odd-submenu";
                }
            }
        });
    }
    this.menuLabelContainer = addNodeToDOM ("div", parentMenu.menuContainer, /*Some id*/null, classList, /*styles*/null);
    this.menuLabelIcon = addNodeToDOM ("div", this.menuLabelContainer, null, "side-bar-submenu-icon side-bar-submenu-icon-position", null);
    // Add a dummy empty icon so that when a menu item does not have an icon it will 
    // use the same vertical space as the others
    this.menuLabelIcon.innerHTML = "<div style=\"height:24px;width:20px;\"></div>"
    this.menuLabelLabel = addNodeToDOM ("div", this.menuLabelContainer, null, null, "display:inline-block;");
    this.menuLabelLabel.innerText = this.menuMeta.label;

    if (this.menuMeta.action !== null) {
        this.menuLabelContainer.onclick = this.menuMeta.action;
    }
    else {
        // If null it is expected that you will just expand the menu
        this.menuLabelContainer.onclick = function () {
            if (thiis.status === MI_STATUS.COLLAPSED) {
                thiis.expandMenu ();
            }
            else {
                thiis.collapseMenu();
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Menu_Item}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function expandMenu () {
    this.status = MI_STATUS.EXPANDED;
    console.log ("Expanding menu for the menu labeled "+this.menuMeta.label+"...");
    this.menuContainer.style.display="block";
    this.menuLabelIcon.innerHTML = arrowUp;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Menu_Item}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function collapseMenu () {
    this.status = MI_STATUS.COLLAPSED;
    console.log ("Collapsing menu for the menu labeled "+this.menuMeta.label+"...");
    this.menuContainer.style.display="none";
    this.menuLabelIcon.innerHTML = arrowDown;
}

///////////////////////////////////////////////////////////////////////////////
/** THIS IS THE ACTUAL GUTS TO THE CONSTRUCTOR!!!!
 * This function ... 
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
    let thiis = this;
    this.parentMenu = parentMenu;
    this.menuContainer = null;
    this.menuLabelContainer = null;
    this.menuLabelIcon = null;
    this.menuLabelLabel = null;
    this.dataContainer = null;
    this.level = (parentMenu instanceof Side_Panel)?0:parentMenu.level+1;
    this.subMenuItems = [];
    // menuMeta data structure:
    // {
    //     action:<null or function>, null = expand or collapse sub menu
    //     label: <string>
    // }
    this.menuMeta = menuMeta;
    this.status = MI_STATUS.COLLAPSED;

    this.addSubMenuItem = function (mi) {
        return addSubMenuItem.call (this, mi);
    }
    this.renderLabel = function () {
        return renderLabel.call (this);
    }
    this.expandMenu = function () {
        return expandMenu.call (this);
    }
    this.collapseMenu = function () {
        return collapseMenu.call (this);
    }
}



/******************************************************************************
 *******************************  Side Panel Class **************************** 
 *****************************************************************************/

function Side_Panel (container) {

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Side_Panel}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function addMenuItem (menuMeta, parentMenu) {
    let mi = new Menu_Item (menuMeta, parentMenu?parentMenu:this);

    // Is this a top menu item?
    if ((parentMenu === undefined)||(parentMenu === null)) {
        this.menuItems.push (mi);
    }
    else {
        parentMenu.addSubMenuItem (mi);
    }

    mi.renderLabel ();

    return mi;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Side_Panel}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function expandMenu () {
    this.collapseIconDiv.style.display = "inline-block";
    this.expandIconDiv.style.display = "none";
    this.menuContainer.style.display = "block";
    this.sizeDataAreaWidth ();
    this.status = MI_STATUS.EXPANDED;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Side_Panel}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function collapseMenu () {
    this.collapseIconDiv.style.display = "none";
    this.expandIconDiv.style.display = "inline-block";
    this.menuContainer.style.display = "none";
    this.sizeDataAreaWidth ();
    this.status = MI_STATUS.COLLAPSED;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Side_Panel}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function sizeVertically () {
    let menuDims = calculateAvailableHeightAndWidth (this.menuDiv);

    this.menuDiv.style.height=menuDims.height+"px";
    let iconHeight = this.expandIconDiv.clientHeight;
    this.menuContainer.style.height = (menuDims.height-iconHeight)+"px";
    this.dataContainer.style.height = (menuDims.height)+"px";
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Side_Panel}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function sizeDataAreaWidth () {
    let dataDims = calculateAvailableHeightAndWidth (this.dataContainer);

    this.dataContainer.style.width=dataDims.width+"px";
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Side_Panel}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function addControlButton (icon, text, id, actionFunc) {
    let buttonDiv = null;

    buttonDiv = addNodeToDOM ("div", this.dataControl, id, "side-bar-button side-bar-button-enabled", "display: inline-block;padding: 5px 10px 5px 10px;");
    buttonDiv.onclick = function () {
        // See if the button is enabled, and if it isn't don't do anything
        if (this.classList.contains("side-bar-button-enabled")) {
            try {
                actionFunc();
            } catch (e) {
                displayErrorToUser ("Error; "+this.id, e.message);
            }
        }
    };
    buttonDiv.innerHTML = "<div class= \"side-bar-button-icon side-bar-button-icon-dims\">"+icon+"</div><div class=\"side-bar-button-label\">"+text+"</div>";

    return buttonDiv;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Side_Panel}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function enableControlButton (button) {
    removeClassName.call (button, "side-bar-button-disabled");
    addClassName.call (button, "side-bar-button-enabled");
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Side_Panel}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function disableControlButton (button) {
    removeClassName.call (button, "side-bar-button-enabled");
    addClassName.call (button, "side-bar-button-disabled");
}

///////////////////////////////////////////////////////////////////////////////
/** THIS IS THE ACTUAL GUTS TO THE CONSTRUCTOR!!!!
 * This function ... 
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
    let thiis = this;
    this.menuItems = [];
    this.container = container;
    this.status = MI_STATUS.COLLAPSED;
    this.dataControl = null;
    this.dataInfo = null;
    this.menuContainer = null;
    this.menuDiv = null;  // Needed for sizing menu after the fact and
                          // during resize events
    this.dataContainer = null;
    this.expandIconDiv = null;
    this.collapseIconDiv = null;

    this.addMenuItem = function (menuMeta, parentMenu) {
        return addMenuItem.call (this, menuMeta, parentMenu);
    }
    this.expandMenu = function () {
        return expandMenu.call (this);
    }
    this.collapseMenu = function () {
        return collapseMenu.call (this);
    }
    this.sizeVertically = function () {
        return sizeVertically.call (this);
    }
    this.sizeDataAreaWidth = function () {
        return sizeDataAreaWidth.call (this);
    }
    this.addControlButton = function (icon, text, id, actionFunc) {
        return addControlButton.call (this, icon, text, id, actionFunc); 
    }
    this.enableControlButton = function (button) {
        return enableControlButton.call (this, button);
    }
    this.disableControlButton = function (button) {
        return disableControlButton.call (this, button);
    }

    this.dataControl = addNodeToDOM ("div", this.container, this.container.id+"_data_area_control", "data-control-area", "display:block;");
    
    this.expandIconDiv = this.addControlButton (arrowRight, "Menu", this.container.id+"_expand_ctrl_div", function () {
        thiis.expandMenu();
    });

    this.collapseIconDiv = this.addControlButton (arrowLeft, "Menu", this.container.id+"_collapse_ctrl_div", function () {
        thiis.collapseMenu();
    });

    this.dataInfo = addNodeToDOM ("div", this.dataControl, this.container.id+"_data_area_info", null, "display:inline-block;");

    this.menuDiv = addNodeToDOM ("div", this.container, this.container.id+"_menu_div", "side-bar-menu-div", null);

    this.menuContainer = addNodeToDOM ("div", this.menuDiv, this.container.id+"_menu_container", "side-bar-menu-container", null);

    let dataDiv = addNodeToDOM ("div", this.container, this.container.id+"_data_div", "side-bar-data-div", null);

    this.dataContainer = addNodeToDOM ("div", dataDiv, this.container.id+"_data_container", "side-bar-data-container", null);

    // Default to having the menu open
    this.expandMenu ();
}