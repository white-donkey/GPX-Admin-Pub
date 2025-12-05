/*
** The following comment is to tell jshint that these items are 
** defined in another file and are globals.
*/
/* global addNodeToDOM */
/* global dom_to_json */
/* global tab_ctrl */
/* global collapsible_panel */
/* global gpx_merge */
/* global deepObjectCopy */
/* global removeAllChildElements */
/* global MHS_Dialog */
/* global DT */
/* global CT */
/* global admInstance */
/* global GPX_G_Adm */

/* exported gpx_admin */

var gpx_admin = (function() {
	"use strict";

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function queryMergeContents () {
	/*jshint validthis: true*/

	this.initMergeMeta();

	// If needed remove previously opened dialogs from the DOM
	if (this.mergeDialog !== null) {
		this.mergeDialog.removeDialogFromDOM ();
		this.mergeDialog = null;
	}

	this.mergeDialog = new MHS_Dialog (this.merge_meta);

	this.mergeDialog.openDialog();
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function startMerge () {
	/*jshint validthis: true*/
	var thiss = this;

	var mergeDialogResp = this.mergeDialog.getResponse();
	console.log ("Dialog response is: ", mergeDialogResp);
	var merge_files = {files:[]};
	mergeDialogResp.forEach (function (resp) {
		if (resp.id === static_GPX_File.MMCID.GPX_FILE_CHECKBOX_GROUP) {
			if (resp.value.length < 2) {
				throw new Error (""+resp.value.length+" files were selected to merge. You must select two files to merge.");
			}
			else if (resp.value.length > 2) {
				throw new Error (""+resp.value.length+" files were selected to merge. You must select only two files to merge.");
			}
			else {
				for (var i=0; i<resp.value.length; i++) {
					for (var j=0; j<thiss.gpx_file_list.length; j++) {
						if (thiss.gpx_file_list[j].gpx_meta.filename === resp.value[i]) {
							merge_files.files.push (thiss.gpx_file_list[j]);
						}
					}
				}
			}
		}
	});

	if (merge_files.files.length === 2) {
		var gpxMerge = gpx_merge.mergeFiles (merge_files);
		this.openFile ({
			mode: static_GPX_File.FM.MERGE,
			name: "merged-"+"SPACE-KEEPER"+"."+"gpx",
			size: 0, // TBD Later
			mergeData: gpxMerge
		});
	}
	else {
		// TODO: Add the file names to this message
		throw new Error ("Unable to find the files requested for merging.");
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function initMergeMeta () {
	/*jshint validthis: true*/
	var thiis = this;

	this.merge_meta = {
		title: "Select Two Files to Merge",
		ok_cb: function () {
			try {
				thiis.startMerge ();
			} catch (e) {
				displayErrorToUser ("Failed to Merge", e.message);
			}
		},
		type: DT.CONFIRM_OC,
		controls: [ {
			id: static_GPX_File.MMCID.GPX_FILE_CHECKBOX_GROUP,
			type: CT.CHECKBOX_GROUP,
			group_label: "Loaded GPX Files:",
			label:[] /* This gets populated below */
		}]
	};
	// Used to populate the label while reading in the GPX files.  If
	// the merge_meta changes so that the checkboxes are no longer in
	// index 0 this line should be updated accordingly.
	var merge_meta_checkbox_ctrl = this.merge_meta.controls[0];

	// @ts-ignore
	this.gpx_file_list.forEach (function (file) {
		merge_meta_checkbox_ctrl.label.push (file.gpx_meta.filename);
	});
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function fileOpenSuccessCallback (file, msg) {
	if ((file.gpx_meta.fileMode === static_GPX_File.FM.READ)||
		(file.gpx_meta.fileMode === static_GPX_File.FM.MERGE)) {
		// Display file
		console.log ("It is time to display: ",file.gpx_meta);
		let fileIndex = this.gpx_file_list.indexOf (file);
		if (fileIndex >= 0) {
			// Show the file in its tab
			file.tab.displayGPX();
			// Now activate the tab
			file.tab_ctrl.activateTab (this.gpx_file_list.length-1);
		}
		else {
			throw new Error ("Unable to get the index of the file when attempting to open the new display tab.");
		}

	}
	else {
		// Do something with a write here
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function fileOpenFailCallback (file, msg) {
		this.removeFileFromList (file);
		displayErrorToUser ("Failed to Open File", msg);
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function openFile (file) {
	/*jshint validthis: true*/
	let fileSuccessfullyOpened = false;
	try {
		// Construct the GPX_File and push it onto our list
		let theFile = new GPX_File (file, this.tab_ctrl);
		
		if ((theFile.gpx_meta.fileMode === static_GPX_File.FM.READ)||
			(theFile.gpx_meta.fileMode === static_GPX_File.FM.MERGE)) {
			this.gpx_file_list.push (theFile);
			theFile.setTabIndex (this.gpx_file_list.length-1);
			let thiis = this;
			theFile.readInFile (
				file,
				function (msg) {thiis.fileOpenSuccessCallback (theFile, msg)},
				function (msg) {thiis.fileOpenFailCallback (theFile, msg)});
		}
		else if (theFile.gpx_meta.fileMode !== static_GPX_File.FM.WRITE) {
			throw new Error ("Wrong file mode ("+theFile.gpx_meta.fileMode+") for the file.");
		}
		fileSuccessfullyOpened = true;
	} catch (e) {
		fileSuccessfullyOpened = false;
		displayErrorToUser ("Failed to Open File", e.message);
	}
	if ((fileSuccessfullyOpened) && (file.mode === static_GPX_File.FM.READ)) {
		this.updateFileCountIndicator ();
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function removeFileFromList (file) {
	/*jshint validthis: true*/
	let fileIndex = this.gpx_file_list.indexOf (file);
	if (fileIndex >= 0) {
		this.tab_ctrl.closeTab(fileIndex);
		//this.gpx_file_list.splice(fileIndex, 1);
		//this.updateFileCountIndicator ();
	}
	else {
		console.info ("Unable to find the file to remove from the list.");
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function updateFileCountIndicator () {
	/*jshint validthis: true*/
	document.getElementById("file_cnt_indicator").innerText = this.gpx_file_list.length+" file"+(this.gpx_file_list.length!==1?"s are":" is")+" open";
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function tabCloseCallback (index) {
	/*jshint validthis: true*/

	console.log ("Tab index "+index+" was closed");

	// use splice to remove the object from this.gpx_file_list
	this.gpx_file_list.splice (index, 1);
	this.updateFileCountIndicator ();
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function tabActivateCallback (index) {
	/*jshint validthis: true*/

	console.log ("Tab index "+index+" was activated");

	// Make sure the side menu is the proper size.
	if ((this.gpx_file_list.length > index)&&
		(this.gpx_file_list[index].tab !== undefined)&&
		(this.gpx_file_list[index].tab !== null)&&
		(this.gpx_file_list[index].tab.sideMenu !== undefined)&&
		(this.gpx_file_list[index].tab.sideMenu !== null)&&
		(this.gpx_file_list[index].tab.sideMenu.sizeVertically !== undefined)&&
		(this.gpx_file_list[index].tab.sideMenu.sizeVertically !== null)&&
		(this.gpx_file_list[index].tab.sideMenu.sizeDataAreaWidth !== undefined)&&
		(this.gpx_file_list[index].tab.sideMenu.sizeDataAreaWidth !== null)) {
		this.gpx_file_list[index].tab.sideMenu.sizeVertically ();
		this.gpx_file_list[index].tab.sideMenu.sizeDataAreaWidth ();
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Admin}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function GPX_Admin (display_units) {
	var thiis = this;

	this.domParser = new DOMParser();
	this.settings = new GPX_Settings ("gpx_settings_button", "gpx_admin_", true);
	this.displayUnits = display_units;
	this.gpx_file_list = [];

	this.merge_meta = null;
	this.mergeDialog = null;

	this.tabCloseCallback = function (index) {
		return tabCloseCallback.call (this, index);
	};
	this.tabActivateCallback = function (index) {
		return tabActivateCallback.call (this, index);
	};

	this.tab_ctrl = tab_ctrl.createTabCtrl (document.getElementById("GPX_Tab_Containers"), function (index) {
		thiis.tabCloseCallback(index);
	},
	function (index) {
		thiis.tabActivateCallback (index);
	});
	
	this.queryMergeContents = function () {
		return queryMergeContents.call (this);
	};
	this.startMerge = function () {
		return startMerge.call (this);
	};
	this.initMergeMeta = function () {
		return initMergeMeta.call (this);
	};
	this.fileOpenSuccessCallback = function (file, msg) {
		return fileOpenSuccessCallback.call (this, file, msg);
	};
	this.fileOpenFailCallback = function (file, msg) {
		return fileOpenFailCallback.call (this, file, msg);
	};
	this.openFile = function (file) {
		return openFile.call (this, file);
	};
	this.removeFileFromList = function (file) {
		return removeFileFromList.call (this, file);
	}
	this.updateFileCountIndicator = function () {
		return updateFileCountIndicator.call (this);
	};

	// Hook up the resize event
	window.addEventListener('resize', function () {
		for (let index=0; index<thiis.gpx_file_list.length; index++) {
			thiis.gpx_file_list[index].tab.sideMenu.sizeVertically();
			thiis.gpx_file_list[index].tab.sideMenu.sizeDataAreaWidth ();
			thiis.gpx_file_list[index].tab.resizeWaypointTable();
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
//  Expose our public data and methods to the outside world
///////////////////////////////////////////////////////////////////////////////
	return {
		startAdmin : function (display_units) {
			var new_instance = new GPX_Admin (display_units);

			return new_instance;
		}
	};
}());

