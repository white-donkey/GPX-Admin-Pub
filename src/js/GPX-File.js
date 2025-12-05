"use strict";

const INDENT_SPACING = 4;
const GPX_IGNORE_NODES = [
	"dist_fmt",
	"dist_cumu_fmt",
	"sog_fmt",
	"total_dist_fmt",
	"sog_rpt",
	"depth_mtrs",
	"temp_c",
	"postProcessTrackSOG",
	"postProcessAllRouteDistances",
	"postProcessRouteDistance",
	"addWpt",
	"addRte",
	"addTrk",
	"addTrkSeg",
	"addTrkPt",
	"addRtePt"
];
const GPX_IGNORE_ATTRS = ["creator"];
const INTERNAL_IGNORE_NODES = [
	"postProcessTrackSOG",
	"postProcessAllRouteDistances",
	"postProcessRouteDistance",
	"addWpt",
	"addRte",
	"addTrk"
];

var static_GPX_File = (function () {

// To add a new supported file type refer to the document
// AddingNewFileType-Support.txt located in GPX-Admin/docs
var FT = {
	GPX: "gpx",
	MT_TRK: "json",
	G_ADM: "adm",
	UNSUPPORTED: "unsupported",
	UNDEFINED: "undefined"
};

var FM = {
	WRITE: 0,
	READ: 1,
	MERGE: 2
};

var MMCID = {
	GPX_FILE_CHECKBOX_GROUP: 0,
	SAVE_FILE_TYPE_RADIOBUTTON_GROUP: 1
};

///////////////////////////////////////////////////////////////////////////////
/**
 * This function ... 
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getFileExtension (fn) {
	let retVal = FT.UNDEFINED;
	if ((fn === undefined)||(fn === null)||(fn.trim().length === 0)) {
		// Short circuit
		return retVal;
	}
	let filenameParts = fn.split(".");
	
	if (filenameParts.length > 0) {
		switch (filenameParts[filenameParts.length-1].toLowerCase()) {
		case FT.GPX:
		case FT.G_ADM:
		case FT.MT_TRK:
			retVal = filenameParts[filenameParts.length-1].toLowerCase();
			break;
		default:
			retVal = FT.UNSUPPORTED;
			break;
		}
	}

	return retVal;
}
	return {
		getFileExtension: function (fn) {
			return getFileExtension (fn);
		},
		FT: FT,
		FM: FM,
		MMCID: MMCID
	};
}());

///////////////////////////////////////////////////////////////////////////////
/**
 * This function ... 
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function GPX_File (file, tab_ctrl) {

///////////////////////////////////////////////////////////////////////////////
/**
 * This function ... 
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function readInBinaryFile (in_file, successCb, failCb) {
	/*jshint validthis: true*/
	var thiis = this;
	var stream = in_file.stream();
	var reader = stream.getReader();
	var bytesReceived = 0;
	var uint8Array = null;

	reader.read().then(function processFile(results) {
		// Result objects contain two properties:
		// done  - true if the stream has already given you all its data.
		// value - some data. Always undefined when done is true.
		if (results.done) {
			console.log("Stream complete; Received "+bytesReceived+" bytes");
			if (in_file.size !== bytesReceived) {
				throw new Error ("Size mismatch between size reported in File object ("+in_file.size+" bytes) and the size received in the stream ("+bytesReceived+" bytes) for the file "+in_file.filename);
			}
			else {
				thiis.gpx_meta.rawContents = uint8Array;
				
				thiis.handleFileRead ();

				// All seems ok with this file and we have finished reading it, so lets put it on the screen now.
				
				successCb ("Successfully opened "+thiis.gpx_meta.filename);
			}
			return;
		}
		// value for fetch streams is a Uint8Array
		bytesReceived += results.value.length;
		//console.log ("Read "+bytesReceived+" bytes out of "+thiis.gpx_meta.fileSize)
		if (uint8Array === null) {
			uint8Array = new Uint8Array(results.value);
		}
		else {
			uint8Array = concatTypedArrays(uint8Array, results.value);
		}
		// Read some more, and call this function again
		return reader.read().then(processFile);
	}).catch(e => {
		failCb (e.message);
	});
}

///////////////////////////////////////////////////////////////////////////////
/**
 * This function ... 
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function readInTextFile (in_file, successCb, failCb) {
	/*jshint validthis: true*/
	var thiis = this;
	var stream = in_file.stream();
	var reader = stream.getReader();
	var contents = "";
	var charsReceived = 0;

	reader.read().then(function processText(results) {
		// Result objects contain two properties:
		// done  - true if the stream has already given you all its data.
		// value - some data. Always undefined when done is true.
		if (results.done) {
			console.log("Stream complete; Received "+charsReceived+" characters");
			if (thiis.gpx_meta.fileSize !== charsReceived) {
				throw new Error ("Size mismatch between size reported in File object ("+thiis.gpx_meta.fileSize+" chars) and the size received in the stream ("+charsReceived+" chars) for the file "+thiis.gpx_meta.filename);
			}
			else {
				thiis.gpx_meta.rawContents = contents;
				console.log ("File data for "+in_file.name+": gpx_meta=",thiis.gpx_meta);
				
				thiis.handleFileRead();

				// All seems ok with this file and we have finished reading it, so lets put it on the screen now.
				
				successCb ("Successfully opened "+thiis.gpx_meta.filename);
			}
			return;
		}
		// value for fetch streams is a Uint8Array
		charsReceived += results.value.length;
		var uint8Array = new Uint8Array(results.value);
		contents += new TextDecoder().decode(uint8Array);

		// Read some more, and call this function again
		return reader.read().then(processText);
	}).catch(e => {
		failCb (e.message);
	});
}

///////////////////////////////////////////////////////////////////////////////
/**
 * This function ... 
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function readInFile (in_file, successCb, failCb) {
	if (this.gpx_meta.fileMode === static_GPX_File.FM.MERGE) {
		try {
			this.gpx_meta.gpx.wpts = deepObjectCopy (this.mergeData.gpx_meta.gpx.wpts, GPX_IGNORE_NODES);
		} catch (e) {
			failCb ("Failed to copy merged waypoints - "+e.message);
		}

		try {
			this.gpx_meta.gpx.rtes = deepObjectCopy (this.mergeData.gpx_meta.gpx.rtes, GPX_IGNORE_NODES);
		} catch (e) {
			failCb ("Failed to copy merged routes - "+e.message);
		}

		try {
			this.gpx_meta.gpx.trks = deepObjectCopy (this.mergeData.gpx_meta.gpx.trks, GPX_IGNORE_NODES);
		} catch (e) {
			failCb ("Failed to copy merged trackes - "+e.message);
		}

		try {
			this.gpx_meta.gpx.postProcessTrackSOG ();
		} catch (e) {
			failCb ("Failed to post process merged track SOG - "+e.message);
		}

		try {
			this.gpx_meta.gpx.postProcessAllRouteDistances ();
		} catch (e) {
			failCb ("Failed to post process merged route distances - "+e.message);
		}
		successCb ("Successfully merged "+this.mergeData.merge_gpx_meta.files[0].filename+" and "+this.mergeData.merge_gpx_meta.files[1].filename+" into "+this.filename);
	}
	else {
		switch (this.gpx_meta.fileType) {
		case static_GPX_File.FT.G_ADM:
			this.readInBinaryFile (in_file, successCb, failCb);
			break;
		case static_GPX_File.FT.GPX:
			// Fall through 
		case static_GPX_File.FT.MT_TRK:
			this.readInTextFile (in_file, successCb, failCb);
			break;
		default:
			console.error ("Unknown file type ("+this.gpx_meta.fileType+") in GPX_File.readInFile");
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_File}
 * This function ... 
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function handleFileRead () {
	this.file.handleFileRead ();

	this.gpx_meta.gpx.postProcessTrackSOG ();
	this.gpx_meta.gpx.postProcessAllRouteDistances ();
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_File}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function queryFileSaveType () {
	/*jshint validthis: true*/
	var thiis = this;

	this.save_meta = {
		title: "Select the export type",
		ok_cb: function () {
			thiis.saveFile ();
		},
		type: DT.CONFIRM_OC,
		controls: [ {
			id: static_GPX_File.MMCID.SAVE_FILE_TYPE_RADIOBUTTON_GROUP,
			type: CT.RADIOBUTTON_GROUP,
			group_label: "File Types:",
			label:[static_GPX_File.FT.GPX.toUpperCase(), static_GPX_File.FT.G_ADM.toUpperCase()]
		}]
	};
	
	if ((this.saveTypeDialog !== undefined)&&(this.saveTypeDialog !== null)) {
		this.saveTypeDialog.removeDialogFromDOM ();
		this.saveTypeDialog = null;
	}

	this.saveTypeDialog = new MHS_Dialog (this.save_meta);

	this.saveTypeDialog.openDialog();
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_File}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function saveFile () {
	/*jshint validthis: true*/
	let fileTypeToSave = static_GPX_File.FT.UNSUPPORTED;
	let fileTypeDialogResp = this.saveTypeDialog.getResponse();

	console.log ("Dialog response is: ", fileTypeDialogResp);

	fileTypeDialogResp.forEach (function (resp) {
		if ((resp.id === static_GPX_File.MMCID.SAVE_FILE_TYPE_RADIOBUTTON_GROUP) &&
			(resp.value !== null)) {
			fileTypeToSave = resp.value.value;
		}
	});
	console.log ("Saving the file in "+fileTypeToSave.toLowerCase()+" format");

	let newFile = {};
	newFile.gpx = deepObjectCopy (this.gpx_meta.gpx, GPX_IGNORE_NODES);
	newFile.rteNameMaxLen = this.gpx_meta.rteNameMaxLen;
	newFile.trkNameMaxLen = this.gpx_meta.trkNameMaxLen;
	newFile.wptNameMaxLen = this.gpx_meta.wptNameMaxLen;
	newFile.rteptNameMaxLen = this.gpx_meta.rteptNameMaxLen;
	newFile.mode = static_GPX_File.FM.WRITE;
	let noExtensionFileName = this.gpx_meta.filename.split(".")[0];
	newFile.name = "exported-"+noExtensionFileName+"."+fileTypeToSave.toLowerCase();
	gpxAdminInstance.openFile (newFile);
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_File}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function downloadFile () {
	var dlFileA = document.createElement("a");
	var dlFileUrl = URL.createObjectURL(this.gpx_meta.fileToBeSaved);
	dlFileA.href = dlFileUrl;
	dlFileA.download = this.gpx_meta.filename;
	document.body.appendChild(dlFileA);
	dlFileA.click();
	setTimeout(function() {
		document.body.removeChild(dlFileA);
		window.URL.revokeObjectURL(dlFileUrl);  
	}, 0);
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
	if ((file === undefined) || (file === null)) {
		// This is an error...
		// We always need to call this with either a name, in which case this
		// is being used in "new file" mode or with a File, in which case it
		// is opening an existing file.
		throw new Error ("The GPX_File constructor was called without an argument.");
	}
	
	this.file = null; // This will contain the specific class for the file type
	this.gpx_meta = {};
	this.gpx_meta.gpx = null;
	this.gpx_meta.fileType = static_GPX_File.FT.UNDEFINED;
	this.gpx_meta.filename = null;
	this.gpx_meta.fileSize = 0;
	this.gpx_meta.fileId = "file_";
	this.gpx_meta.tab = null;
	this.gpx_meta.fileMode = static_GPX_File.FM.READ;
	this.gpx_meta.rawContents = null;
	this.gpx_meta.fileToBeSaved = null;
	this.gpx_meta.rteNameMaxLen = 0;
	this.gpx_meta.trkNameMaxLen = 0;
	this.gpx_meta.wptNameMaxLen = 0;
	this.gpx_meta.rteptNameMaxLen = 0;
	this.tabIndex = -1;
	this.tab_ctrl = null;
	this.tab = null;
	this.setTabIndex = null;
	this.mergeData = null;
	
	let thiis = this;
	
	this.save_meta = null;
	this.saveTypeDialog = null;

	this.readInBinaryFile = function (file, successCb, failCb) {
		return readInBinaryFile.call (this, file, successCb, failCb);
	};

	this.readInTextFile = function (file, successCb, failCb) {
		return readInTextFile.call (this, file, successCb, failCb);
	};

	this.readInFile = function (file, successCb, failCb) {
		return readInFile.call (this, file, successCb, failCb);
	};

	this.handleFileRead = function () {
		return handleFileRead.call (this);
	};

	this.queryFileSaveType = function () {
		return queryFileSaveType.call (this);
	};

	this.saveFile = function () {
		return saveFile.call (this);
	};
	this.downloadFile = function () {
		return downloadFile.call (this);
	};

	this.gpx_meta.fileType = static_GPX_File.getFileExtension (file.name);
	this.gpx_meta.filename = file.name;
	this.gpx_meta.fileSize = file.size;
	this.gpx_meta.fileMode = file.mode;
	
	if (file.mode === static_GPX_File.FM.WRITE) {
		this.gpx_meta.gpx = file.gpx;
		this.gpx_meta.rteNameMaxLen = file.rteNameMaxLen;
		this.gpx_meta.trkNameMaxLen = file.trkNameMaxLen;
		this.gpx_meta.wptNameMaxLen = file.wptNameMaxLen;
		this.gpx_meta.rteptNameMaxLen = file.rteptNameMaxLen;
		// Do not setup the tab stuff because we are writing the
		// file out, not displaying it.
	}
	else {
		if ((file.mode === static_GPX_File.FM.READ)||
			(file.mode === static_GPX_File.FM.MERGE)) {
			this.gpx_meta.gpx = new GPX_Data();

			// Setup the tab stuff for display
			this.tab_ctrl = tab_ctrl;
			this.tab = new GPX_Tab (this);

			this.setTabIndex = function (index) {
				thiis.tabIndex = index;
				if (this.tabIndex >= 0) {
					thiis.gpx_meta.fileId += (index+"_");
					thiis.gpx_meta.tab_container = thiis.tab_ctrl.addTab (index, this.gpx_meta.filename);
				}
			}

			if (file.mode === static_GPX_File.FM.MERGE) {
				this.mergeData = file.mergeData;
			}
		}
		else {
			throw new Error ("The argument passed to the GPX_File constructor has an unsupported mode.");
		}
	}

	// Some more filename error checking...
	if (this.gpx_meta.fileType === static_GPX_File.FT.UNDEFINED) {
		throw new Error ("The file or filename passed into the GPX_File constructor was empty or is undefined.");
	}
	if (this.gpx_meta.fileType === static_GPX_File.FT.UNSUPPORTED) {
		throw new Error ("The file "+this.gpx_meta.filename+" is an unsupported file type.");
	}

	switch (this.gpx_meta.fileType) {
	case static_GPX_File.FT.GPX:
		this.file = new GPX_GPX_File (this);
		break;
	case static_GPX_File.FT.G_ADM:
		this.file = new GPX_G_Adm(this);
		break;
	case static_GPX_File.FT.MT_TRK:
		this.file = new GPX_MT_Trk(this);
		break;
	default:
		throw new Error ("The file type "+this.gpx_meta.fileType+" is defined as a valid type but does not have a corresponding class to call.");
		break;
	}

	if (file.mode === static_GPX_File.FM.WRITE) {
		if (this.file.saveFile ()) {
			this.downloadFile ();
		}
	}
}