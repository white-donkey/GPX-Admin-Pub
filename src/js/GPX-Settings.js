var SETTING_TYPES = {
    GRAPH_CURSOR: {
        id: 1,
        grp_label: "Cursor Action:",
        values:[CRSRU_NAME_MAP.UNIFIED, CRSRU_NAME_MAP.INDIV],
        settingName: "unifiedCursor"
    },
    GRAPH_X_AXIS: {
        id: 2,
        grp_label: "Graph X-Axis Values:",
        values:[GRPHXAXISU_NAME_MAP.DIST, GRPHXAXISU_NAME_MAP.TIME],
        settingName: "xAxisDomain"
    },
    DIST_UNITS: {
        id: 3,
        grp_label: "Distance:",
        values:[DSTU_NAME_MAP.NM, DSTU_NAME_MAP.MILE, DSTU_NAME_MAP.KM],
        settingName: "distUnits"
    },
    DEPTH_UNITS: {
        id: 4,
        grp_label: "Depth:",
        values:[DPTU_NAME_MAP.FT, DPTU_NAME_MAP.MTR],
        settingName: "depthUnits"
    },
    TEMP_UNITS: {
        id: 5,
        grp_label: "Temperature:",
        values:[TEMPU_NAME_MAP.FAHR, TEMPU_NAME_MAP.CELS],
        settingName: "tempUnits"
    }
};

function GPX_Settings (buttonId, lclStoragePrefix, cookiesAllowed) {

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Settings}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function settingsButtonClickHandler () {
    let thiss = this;

    let graphHorizontalGroup = {
        id: 100,
        type: CT.HORIZONTAL_BLOCKS,
        label: "Graph Settings:",
        controls: []
    };
    let unitsHorizontalGroup = {
        id: 101,
        type: CT.HORIZONTAL_BLOCKS,
        label: "Units:",
        controls: []
    };

    var dlgMeta = {
        title: "GPX-Admin Settings",
        ok_cb: function () {
            thiss.saveSettings ();
        },
        type: DT.CONFIRM_OC,
        controls: [unitsHorizontalGroup, graphHorizontalGroup]
        //controls:[]
    };
    
    // Add all the controls
    for (const key in SETTING_TYPES) {
		if (SETTING_TYPES.hasOwnProperty (key)) {
            let ctrl = {};
            ctrl.id = SETTING_TYPES[key].id;
            ctrl.type = CT.RADIOBUTTON_GROUP;
            ctrl.group_label = SETTING_TYPES[key].grp_label;
            ctrl.label = [];
            SETTING_TYPES[key].values.forEach (val => {
                //ctrl.label.push (val.name+(val.abbr!==null?" ("+val.abbr+")":""));
                ctrl.label.push (val.name);
                // Determine if this is a default value
                if ((thiss.settings[SETTING_TYPES[key].settingName] !== undefined)&&
                    (thiss.settings[SETTING_TYPES[key].settingName]!==null)&&
                    (val.unit === thiss.settings[SETTING_TYPES[key].settingName])) {
                    ctrl.defVal = ctrl.label[ctrl.label.length-1];
                }
            });

            if ((key === "GRAPH_CURSOR")||(key === "GRAPH_X_AXIS")) {
                graphHorizontalGroup.controls.push(ctrl);
            }
            else if ((key === "DIST_UNITS")||(key === "DEPTH_UNITS")||(key === "TEMP_UNITS")) {
                unitsHorizontalGroup.controls.push(ctrl);
            }
            else {
                // @ts-ignore Another bullshit fake error by Intellisense
                dlgMeta.controls.push(ctrl);
            }
        }
    }

    if ((this.settingsDialog !== undefined)&&(this.settingsDialog !== null)) {
		this.settingsDialog.removeDialogFromDOM ();
		this.settingsDialog = null;
	}

	this.settingsDialog = new MHS_Dialog (dlgMeta);

	this.settingsDialog.openDialog();
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Settings}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function saveSettings () {
    let settingsDialogResp = this.settingsDialog.getResponse();

    console.log ("Settings dialog response: ",settingsDialogResp);

    // Cycle through all of the responses and grab
    // the SETTING_TYPES value for each response
    settingsDialogResp.forEach (resp => {
        let settingType = null;
        for (const key in SETTING_TYPES) {
		    if (SETTING_TYPES.hasOwnProperty (key)) {
                if (SETTING_TYPES[key].id === resp.id) {
                    settingType = SETTING_TYPES[key]
                }
            }
        }

        let settingLabel = null;
        if ((settingType !== null) &&
			(resp.value !== null)) {
			settingLabel = resp.value.value;

            settingType.values.forEach (val => {
                //if ((val.name+(val.abbr!==null?" ("+val.abbr+")":"")) === settingLabel) {
                if (val.name === settingLabel) {
                    thiss.settings[settingType.settingName] = val.unit;
                    return;
                }
            });
		}
    });

    if (this.cookiesAllowed) {
        localStorage.setItem (this.lclStoragePrefix+"settings", JSON.stringify (this.settings));
    }

    gpxAdminInstance.refreshOpenWaypointTables();
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Settings}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function getSetting (setting) {
    let val = this.settings[setting];
    let settingType = null;
    let retVal = {name: "", abbr: null, unit: 0};

    for (const key in SETTING_TYPES) {
		if (SETTING_TYPES.hasOwnProperty (key)) {
            if (SETTING_TYPES[key].settingName === setting) {
                settingType = SETTING_TYPES[key];
            }
        }
    }

    if ((val !== undefined)&&(val !== null)&&(settingType !== null)) {
        settingType.values.forEach (sval => {
            if (sval.unit === val) {
                retVal = sval;
            }
        });
    }

    if (retVal.abbr !== null) {
        let splitAbbr = retVal.abbr.split("##");
        if ((splitAbbr.length === 3)&&(splitAbbr[0] === "")&&(splitAbbr[2] === "")) {
            let dynamicAbbr = this.getSetting (splitAbbr[1]).abbr;
            retVal.dynamicAbbr = dynamicAbbr;
        }
    }

    console.log ("Retrieved setting for "+setting+": ",retVal);
    
    return retVal;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Settings}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function fetchLocalStorageSettings () {

    let defaultSettings = {
        unifiedCursor: true,
        xAxisDomain: G_X_AXIS.DIST,
        distUnits: DSTU.NM,
        depthUnits: DPTU.FT,
        tempUnits: TEMPU.FAHR
    };

    let lclSettings = localStorage.getItem (this.lclStoragePrefix+"settings");

    if (lclSettings !== null) {
        let obj = null;
        try {
            obj=JSON.parse(lclSettings);
        }
        catch (e) {
            console.log ("Failed to parse stored settings, using defaults");
        }
        // Make sure this has all the same keys as our default
        if (obj !== null) {
            let defaultMissingProperties = [];
            let lclStrMissingProperties = [];
            // First make sure all the properties in local storage are in the default
            for (const key in obj) {
                if ((obj.hasOwnProperty(key)) && (defaultSettings[key] === undefined)) {
                    defaultMissingProperties.push(key);
                    console.log ("The stored settings has a property named "+key+" that is not in the default.");
                } 
            }
            // Now make sure all the properties in default are in local storage 
            for (const key in defaultSettings) {
                if (defaultSettings.hasOwnProperty(key)) {
                    if (obj[key] === undefined) {
                        lclStrMissingProperties.push(key);
                        console.log ("The default has a property named "+key+" that is not in the stored settings");
                    }
                    else {
                        defaultSettings[key] = obj[key];
                    }
                } 
            }
            if ((defaultMissingProperties.length === 0)&&(lclStrMissingProperties.length === 0)) {
                this.settings = obj;
                return true;
            }
            else {
                console.log ("Updating what is in local storage because the default has changed.");
            }
        }
    }
    
    // Set defaults
    this.settings = defaultSettings;

    // Check if this was just due to being a first run or if we
    // are blocked.
    localStorage.setItem (this.lclStoragePrefix+"settings", JSON.stringify (this.settings));
    // Now try to read it back
    lclSettings = localStorage.getItem (this.lclStoragePrefix+"settings");
    console.log ("Checking local storage");
    if (lclSettings === JSON.stringify (this.settings)) {
        return true;
    }
    else {
        return false;
    }
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
    let thiss = this;
    this.settingsDialog = null;
    this.settings = null;
    this.cookiesAllowed = cookiesAllowed;
    this.settingsButton = document.getElementById(buttonId);
    this.lclStoragePrefix = lclStoragePrefix;

    this.settingsButtonClickHandler = function () {
        return settingsButtonClickHandler.call (this);
    };

    this.saveSettings = function () {
        return saveSettings.call (this);
    }

    this.fetchLocalStorageSettings = function () {
        return fetchLocalStorageSettings.call (this);
    }

    this.getSetting = function (setting) {
        return getSetting.call (this, setting);
    }

    this.settingsButton.addEventListener("click", function (e) {
        thiss.settingsButtonClickHandler ();
    });

    if (cookiesAllowed) {
        if (this.fetchLocalStorageSettings() === false) {
            // Unable to use local storage
            console.log ("Local Storage failed");
            this.cookiesAllowed = false;
        }
    }
}