/* global MHS_Dialog */
/* global DT */
/* global CT */
/* global getIso8601UTCDate */
/* global supportedAisTrkKeys */
/* global numSupportedKeys */
/* global gpxAdminInstance */
/* global gpx_admin */
/* global icon_meta */

/* exported GPX_MT_Trk */
function GPX_MT_Trk (parent) {
    "use strict";

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_MT_Trk}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function aisTrkToGpxObjs (trkKey) {
	/*jshint validthis: true*/
	let trkseg = this.parent.gpx_meta.gpx.addTrk(new GPX_Trk(this.parent.gpx_meta.filename)).addTrkSeg(new GPX_TrkSeg());

	this.aisTrk.forEach (function (aisTrkPt) {
		var trkpt = new GPX_Wpt();
		for (const key in aisTrkPt) {
			if (aisTrkPt.hasOwnProperty(key)) {
				let gpx_key = trkKey[key];
				if ((gpx_key !== undefined)&&(gpx_key !== null)) {
					if (gpx_key !== "NA") {
						let keys = gpx_key.split (".");
						if (keys.length === 2) {
							if ((trkpt[keys[0]] === undefined)||(trkpt[keys[0]] === null)) {
								trkpt[keys[0]] = {};
							}
							trkpt[keys[0]][keys[1]] = aisTrkPt[key];
						}
						else if (keys.length === 1) {
							trkpt[keys[0]] = aisTrkPt[key];
						}
						else {
							// Not yet supporting more than two deep
							console.error ("Can't create track property.  The depth is nto supported");
						}
					}
				}
				else {
					console.error ("Unable to find a key named "+key+" in the Track Key.");
				}

			}
		}
		trkseg.addTrkPt (trkpt);
	});

	console.log ("GPX meta: ",this.parent.gpx_meta);

	return this.parent.gpx_meta;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_MT_Trk}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function convertAisTrkText (file) {
	/*jshint validthis: true*/
	var thiis = this;
	let rawAisTrk = JSON.parse (this.parent.gpx_meta.rawContents);
	let trkPnt = {};
	let rawIdx = 0;
	let aisTrkKeys = null;

	var keySupportIdx = numSupportedKeys.indexOf (rawAisTrk[0].length);
	if (keySupportIdx < 0) {
		let errorStr = "The nodes of the AIS Track file contain "+rawAisTrk[0].length+" data objects but the supported number of data objects are "+numSupportedKeys+".";
		displayErrorToUser ("Missing Data", errorStr);
		throw new Error (errorStr);
	}
	else {
		aisTrkKeys = supportedAisTrkKeys[keySupportIdx];
	}

	this.aisTrk = [];
	rawAisTrk.forEach (function (pnt) {
		rawIdx = 0;
		trkPnt = {};
		
		for (const key in aisTrkKeys) {
			if (aisTrkKeys.hasOwnProperty(key)) {
				if (key === "timestamp") {
					let convTime = new Date (pnt[rawIdx]*1000);
					trkPnt[key] = getIso8601UTCDate(convTime);
				}
				else {
					trkPnt[key] = pnt[rawIdx];
				}
				rawIdx++;
			}
		}
		thiis.aisTrk.push(trkPnt);
	});

	// Because the AIS data is newest first we need to reverse the array
	this.aisTrk.reverse();
	console.log("The converted AIS Track file is: ",this.aisTrk);
	this.aisTrkToGpxObjs (aisTrkKeys);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function handleFileRead () {
	/*jshint validthis: true*/
	
	this.convertAisTrkText();
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_MT_Trk}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function saveFile () {
	let errStr ="Saving a MarineTraffic AIS Track file is not supported";

	console.error (errStr);
	displayErrorToUser ("Failed to save file", errStr);

	return false;
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
	//this.aisTrkFileTxt = null;
	this.aisTrk = null;
	this.parent = parent;

	this.handleFileRead = function () {
		return handleFileRead.call (this);
	};
	this.convertAisTrkText = function () {
		return convertAisTrkText.call (this);
	};
	this.aisTrkToGpxObjs = function (trkKey) {
		return aisTrkToGpxObjs.call (this, trkKey);
	};	
	this.saveFile = function () {
		return saveFile.call (this);
	};
}