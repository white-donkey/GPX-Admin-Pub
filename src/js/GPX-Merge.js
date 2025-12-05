/*
** The following comment is to tell jshint that these items are 
** defined in another file and are globals.
*/

/* global deepObjectCopy */
/* global getCurrIso8601UTCDate */
/* global gpx_admin */

/* exported gpx_merge */

var gpx_merge = (function() {
	"use strict";

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function mergeByName () {
	/*jshint validthis: true*/
	var thiis = this;
	/* Find all of the names that have no duplicates in other files */
	var copied_wpts = [];
	var copied_rtes = [];
	this.merge_gpx_meta.files.forEach (function (file) {
		var idx = 0;
		// Waypoints first
		for (idx=0; idx<file.gpx_meta.gpx.wpts.length; idx++) {
			if (thiis.merge_gpx_meta.matchingNames.wpts.indexOf(file.gpx_meta.gpx.wpts[idx].name) < 0) {
				copied_wpts.push (deepObjectCopy (file.gpx_meta.gpx.wpts[idx], GPX_IGNORE_NODES)); 
			}
		}
		// Routes second
		for (idx=0; idx<file.gpx_meta.gpx.rtes.length; idx++) {
			if (thiis.merge_gpx_meta.matchingNames.rtes.indexOf(file.gpx_meta.gpx.rtes[idx].name) < 0) {
				copied_rtes.push (deepObjectCopy (file.gpx_meta.gpx.rtes[idx], GPX_IGNORE_NODES)); 
			}
		}
	});

	if (copied_wpts.length > 0) {
		this.gpx_meta.gpx.wpts = this.gpx_meta.gpx.wpts.concat (copied_wpts);
	}
	if (copied_rtes.length > 0) {
		this.gpx_meta.gpx.rtes = this.gpx_meta.gpx.rtes.concat (copied_rtes);
	}

	//return gpx_meta;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function mergeSameNameByPosition () {
	/*jshint validthis: true*/
	var thiis = this;
	var copied_wpts = [];
	this.merge_gpx_meta.matchingNames.wpts.forEach (function (wpt_name) {
		// Find the named waypoint in each file
		var wpt_match_idx = [];
		for (var file_idx=0; file_idx<thiis.merge_gpx_meta.files.length; file_idx++) {
			wpt_match_idx.push(-1);
			for (var idx=0; idx<thiis.merge_gpx_meta.files[file_idx].gpx_meta.gpx.wpts.length; idx++) {
				if (thiis.merge_gpx_meta.files[file_idx].gpx_meta.gpx.wpts[idx].name === wpt_name) {
					wpt_match_idx[file_idx] = idx;
					break;
				}
			}
		}
		// Right now this only works when merging two files
		for (var match_idx=0; match_idx<wpt_match_idx.length-1; match_idx++) {
			if ((wpt_match_idx[match_idx] >= 0)&&
				(match_idx+1<wpt_match_idx.length)&&
				(wpt_match_idx[match_idx+1] >= 0)) {
				var wpt1 = thiis.merge_gpx_meta.files[0].gpx_meta.gpx.wpts[wpt_match_idx[match_idx]];
				var wpt2 = thiis.merge_gpx_meta.files[1].gpx_meta.gpx.wpts[wpt_match_idx[match_idx+1]];
				var dist_mtrs = distBetweenWpts (DSTU.KM, {lon: wpt1.attrs.lon, lat: wpt1.attrs.lat}, {lon: wpt2.attrs.lon, lat: wpt2.attrs.lat})*1000.00;
				console.log ("Distance between matched waypoints named: "+wpt1.name+" is "+dist_mtrs+" meters");
				if (dist_mtrs > 10.00) {
					console.log ("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Distance greater than 10 meters !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
				}
				else {
					// Choose the waypoint that has a symbol associated with it.
					if ((wpt1.sym !== undefined)&&(wpt1.sym !== null)&&(wpt1.sym.trim() !== "")) {
						copied_wpts.push (deepObjectCopy (wpt1, GPX_IGNORE_NODES)); 
					}
					else {
						copied_wpts.push (deepObjectCopy (wpt2, GPX_IGNORE_NODES)); 
					}
					
				}
			}
		}
	});

	if (copied_wpts.length > 0) {
		this.gpx_meta.gpx.wpts = this.gpx_meta.gpx.wpts.concat (copied_wpts);
	}

	//return gpx_meta;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function findAllMatchingNames () {
	/*jshint validthis: true*/

	this.merge_gpx_meta.matchingNames = {
		wpts:[],
		rtes:[],
		trks:[]
	};

	for (var file_idx=0; file_idx<this.merge_gpx_meta.files.length-1; file_idx++) {
		var file = this.merge_gpx_meta.files[file_idx];
		for (var cmp_file_idx=file_idx+1; cmp_file_idx<this.merge_gpx_meta.files.length; cmp_file_idx++) {
			var cmp_file = this.merge_gpx_meta.files[cmp_file_idx];
			// Compare waypoints first
			for (var wpt_idx=0; wpt_idx<file.gpx_meta.gpx.wpts.length; wpt_idx++) {
				for (var cmp_wpt_idx=0; cmp_wpt_idx<cmp_file.gpx_meta.gpx.wpts.length; cmp_wpt_idx++) {
					if ((file.gpx_meta.gpx.wpts[wpt_idx].name === cmp_file.gpx_meta.gpx.wpts[cmp_wpt_idx].name)&&
						(this.merge_gpx_meta.matchingNames.wpts.indexOf (file.gpx_meta.gpx.wpts[wpt_idx].name) < 0)) {
						this.merge_gpx_meta.matchingNames.wpts.push (file.gpx_meta.gpx.wpts[wpt_idx].name);
					}
				}
			}
			// Now compare Routes
			for (var rte_idx=0; rte_idx<file.gpx_meta.gpx.rtes.length; rte_idx++) {
				for (var cmp_rte_idx=0; cmp_rte_idx<cmp_file.gpx_meta.gpx.rtes.length; cmp_rte_idx++) {
					if ((file.gpx_meta.gpx.rtes[rte_idx].name === cmp_file.gpx_meta.gpx.rtes[cmp_rte_idx].name)&&
						(this.merge_gpx_meta.matchingNames.rtes.indexOf (file.gpx_meta.gpx.rtes[rte_idx].name) < 0)) {
						this.merge_gpx_meta.matchingNames.rtes.push (file.gpx_meta.gpx.rtes[rte_idx].name);
					}
				}
			}
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function sortGpxFileByName () {
	/*jshint validthis: true*/

	this.gpx_meta.gpx.wpts.sort (function (a, b) {
		if (a.name < b.name) {
			return -1;
		}
		else if (a.name === b.name) {
			return 0;
		}
		else {
			return 1;
		}
	});
	this.gpx_meta.gpx.rtes.sort (function (a, b) {
		if (a.name < b.name) {
			return -1;
		}
		else if (a.name === b.name) {
			return 0;
		}
		else {
			return 1;
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function garminizeMergedItems () {
	/*jshint validthis: true*/
	//var thiis = this;

	// Waypoints first
	this.gpx_meta.gpx.wpts.forEach (function (wpt) {
		if ((wpt.cmt === undefined)||(wpt.cmt === null)) {
			wpt.cmt = {"attrs": {}};
		}
		if ((wpt.sym === undefined)||(wpt.sym === null)) {
			wpt.sym = "Flag, Blue";
		}
		if ((wpt.extensions === undefined)||(wpt.extensions === null)) {
			wpt.extensions = {
				"attrs":{},
				"gpxx:WaypointExtension": {
					"attrs":{},
					"gpxx:DisplayMode": "SymbolAndName"
				}
			};
		}
	});

	// Now Routes
	this.gpx_meta.gpx.rtes.forEach (function (rte) {
		if ((rte.extensions === undefined)||(rte.extensions === null)) {
			rte.extensions = {
				"attrs":{},
				"gpxx:RouteExtension": {
					"attrs":{},
					"gpxx:IsAutoNamed": "false"
				}
			};
		}

		rte.rtepts.forEach (function (rtept) {
			if ((rtept.sym === undefined)||(rtept.sym === null)) {
				rtept.sym = "Flag, Blue";
			}
		});
		
	});
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function matchWaypointsWithin10Meters (wptToFind, wptFile) {
	/*jshint validthis: true*/
	var match = null;

	for (var i=0; i<wptFile.length; i++) {
		var dist_mtrs = distBetweenWpts (DSTU.KM, {lon: wptToFind.attrs.lon, lat: wptToFind.attrs.lat}, {lon: wptFile[i].attrs.lon, lat: wptFile[i].attrs.lat})*1000.00;
		//console.log ("Distance between matched route point named: "+wptToFind.name+" is "+dist_mtrs+" meters");
		if (dist_mtrs <= 10.00) {
			match = wptFile[i];
			break;
		}
	}

	return match;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function mergeFiles () {
	/*jshint validthis: true*/

	// Do all the actual merging
	this.findAllMatchingNames ();
	console.log ("merge_gpx_meta: ", this.merge_gpx_meta);
	this.mergeByName ();
	this.mergeSameNameByPosition ();
	this.garminizeMergedItems ();
	this.sortGpxFileByName ();
	console.log ("merged_gpx", this.gpx_meta);
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function setFileInfo (name, id) {
	/*jshint validthis: true*/
	this.gpx_meta.filename = name;
	this.gpx_meta.file_id = id;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function getGpxMeta () {
	/*jshint validthis: true*/
	return this.gpx_meta;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function GPX_Merge (merge_gpx_meta) {
	this.merge_gpx_meta = merge_gpx_meta;
	this.gpx_meta = {
		filename: "tmpFileName",
		size: "?",
		container: null,
		file_id: "tmpFileId",
		gpx: {
			/*attrs: {
				"xmlns": "http://www.topografix.com/GPX/1/1",
				"xmlns:gpxx": "http://www.garmin.com/xmlschemas/GpxExtensions/v3",
				"xmlns:wptx1": "http://www.garmin.com/xmlschemas/WaypointExtension/v1",
				"xmlns:gpxtpx": "http://www.garmin.com/xmlschemas/TrackPointExtension/v1",
				"xmlns:uuidx": "http://www.garmin.com/xmlschemas/IdentifierExtension/v1",
				"xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
				creator: "GPX-Admin",
				version: "1.1",
				"xsi:schemaLocation": "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www8.garmin.com/xmlschemas/WaypointExtensionv1.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/IdentifierExtension/v1 http://www.garmin.com/xmlschemas/IdentifierExtension.xsd"
			},
			metadata: {
				links: [{
					text: "Marblehead Sailor",
					attrs: {
						href: "http://www.marbleheadsailor.com"
					}
				}],
				time: getCurrIso8601UTCDate(),
				attrs: {}
			},*/
			wpts:[],
			trks:[],
			rtes:[]
		}
	};

	this.mergeFiles = function () {
		return mergeFiles.call (this);
	};
	this.findAllMatchingNames = function () {
		return findAllMatchingNames.call (this);
	};
	this.mergeByName = function () {
		return mergeByName.call (this);
	};
	this.mergeSameNameByPosition = function () {
		return mergeSameNameByPosition.call (this);
	};
	this.sortGpxFileByName = function () {
		return sortGpxFileByName.call (this);
	};
	this.setFileInfo = function (name, id) {
		return setFileInfo.call (this, name, id);
	};
	this.getGpxMeta = function () {
		return getGpxMeta.call (this);
	};
	this.garminizeMergedItems = function () {
		return garminizeMergedItems.call (this);
	};
	this.matchWaypointsWithin10Meters = function (wptToFind, wptFile) {
		return matchWaypointsWithin10Meters.call (this, wptToFind, wptFile);
	};
}

///////////////////////////////////////////////////////////////////////////////
//  Expose our public data and methods to the outside world
///////////////////////////////////////////////////////////////////////////////
	return {
		mergeFiles : function (merge_gpx_meta) {
			if (Array.isArray(merge_gpx_meta.files)) {
				var new_instance = new GPX_Merge (merge_gpx_meta);
				new_instance.mergeFiles ();

				return new_instance;
			}
			else {
				console.error ("The value for file_list in GPX-Merge is NOT an array.  It must be in order to merge files.");

				return null;
			}
		},
		getGpxMeta: function (filename, file_id) {
			var tmp_instance = new GPX_Merge (null);
			tmp_instance.setFileInfo (filename, file_id);
			return tmp_instance.getGpxMeta();
		}
	};
}());
