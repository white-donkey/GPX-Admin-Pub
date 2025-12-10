///////////////////////////////////////////////////////////////////////////////
/** This function MUST remain outside of the class becuase it is used by
 *  other classes.
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function readAdmObject (meta, buffer, offsetStart) {
    let retObj = {};
	// The viewTypedArray functions expect (and must) to be working on an
	// ArrayBuffer and not a TypedArray.  Do the following to determine which
	// is being passed in and use the TypedArray's buffer if need be.
	let lclBuffer = (buffer instanceof ArrayBuffer)?buffer:buffer.buffer;

    if ((offsetStart === undefined)||(offsetStart === null)) {
        offsetStart = 0;
    }

    for (const key in meta) {
		if (meta.hasOwnProperty (key)) {
            let tos = meta[key];
            let offset = tos.offset;
            if (typeof tos.offset == "function") {
                offset = tos.offset(offsetStart);
            }
            else {
                offset = tos.offset+offsetStart;
            }

            if (tos.type === D_TYPE.STRING) {
                retObj[key] = viewTypedArrayToStr (lclBuffer, offset, tos.size);
            }
            else {
			    retObj[key] = viewTypedArray (tos.type, lclBuffer, offset, tos.size);
            }
		}
	}

    return retObj;
}

///////////////////////////////////////////////////////////////////////////////
/** This function MUST remain outside of the class becuase it is used by
 *  other classes.
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function readAdmValue (meta, buffer, offsetStart) {
    let retVal = null;
	// The viewTypedArray functions expect (and must) to be working on an
	// ArrayBuffer and not a TypedArray.  Do the following to determine which
	// is being passed in and use the TypedArray's buffer if need be.
	let lclBuffer = (buffer instanceof ArrayBuffer)?buffer:buffer.buffer;

    if ((offsetStart === undefined)||(offsetStart === null)) {
        offsetStart = 0;
    }

	let offset = meta.offset;
    if (typeof meta.offset == "function") {
        offset = meta.offset(offsetStart);
    }
	else {
        offset = meta.offset+offsetStart;
    }

    if (meta.type === D_TYPE.STRING) {
        retVal = viewTypedArrayToStr (lclBuffer, offset, meta.size);
    }
    else {
	    retVal = viewTypedArray (meta.type, lclBuffer, offset, meta.size);
    }

    return retVal;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @param {GPX_G_Adm} parent
 */
///////////////////////////////////////////////////////////////////////////////
function GPX_G_Adm_Read (parent) {
    "use strict"

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Read}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getFileTable () {
	/*jshint validthis: true*/
	var fileTable = [];
	var fileEntry = {};

	// There are only ever four files in an ADM.  They are the CTRL file,
	// the routes file, the track file and the waypoints file.  So just
	// read in those four.
	for (var i=0; i<NUM_ADM_SUB_FILES; i++) {
		var startOffset = this.parent.ctrlFile.bootSector.header.fileTableStartSect*this.parent.sectorSize+(this.parent.sectorSize*i);
		fileEntry = readAdmObject (garminAdmMeta.fileTable, this.grandparent.gpx_meta.rawContents.buffer, startOffset);

		console.log ("Reading in file named: "+fileEntry.fileName+"."+fileEntry.fileExt+" with a size of "+fileEntry.fileSize+" bytes.");
		var clusterList = "";
		for (var j=0; j<NUM_FILE_ENTRY_CLUSTERS; j++) {
			if (fileEntry.clusterList[j] === 0xffff) {
				break;
			}
			else {
				if (j !== 0) {
					clusterList += ", ";
				}
				clusterList += fileEntry.clusterList[j];
				clusterList += ("(byte offset: "+(fileEntry.clusterList[j]*this.parent.secsPerCluster*this.parent.sectorSize)+")");
			}
		}
		console.log ("The cluster list is: "+clusterList);
		fileTable.push(fileEntry);
	}

	return fileTable;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Read}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function parseAdm () {
	/*jshint validthis: true*/
	this.parent.ctrlFile = {
		bootSector: {
			header: readAdmObject (garminAdmMeta.bootSector.header, this.grandparent.gpx_meta.rawContents.buffer),
			unused1: null,
			partionTable1: readAdmObject (garminAdmMeta.bootSector.partionTable1, this.grandparent.gpx_meta.rawContents.buffer),
			unused2: null
		},
		gapSectors: null,
		fileTable: null
	};

	this.parent.sectorSize = this.parent.ctrlFile.bootSector.header.sectorSize;
	this.parent.secsPerCluster = Math.pow(2, this.parent.ctrlFile.bootSector.header.sectPerClusterExp);

	this.parent.ctrlFile.fileTable = this.getFileTable();

	for (var i=0; i<NUM_ADM_SUB_FILES; i++) {
		var fileEntry = this.parent.ctrlFile.fileTable[i];
		if (fileEntry.fileName === this.parent.ctrlFile.bootSector.header.description.trim()) {
			var beg_off = 0;
			var end_off = 0;
			for (var j=0; j<NUM_FILE_ENTRY_CLUSTERS; j++) {
				if (fileEntry.clusterList[j] === 0xffff) {
					break;
				}
				else {
					if (j === 0) {
						beg_off = fileEntry.clusterList[j]*this.parent.secsPerCluster*this.parent.sectorSize;
					}
					end_off = (fileEntry.clusterList[j]*this.parent.secsPerCluster*this.parent.sectorSize)+((this.parent.secsPerCluster*this.parent.sectorSize)-1);
				}
			}

			// While HomePort will always fill the last file to a cluster
			// boundary, a chartplotter does NOT.  Instead it ends at the last
			// data point.  The following lines are to ensure that we do not
			// attempt to read off the end of the buffer. 
			if (end_off >= this.grandparent.gpx_meta.fileSize) {
				end_off = this.grandparent.gpx_meta.fileSize-1;
			}

			switch (fileEntry.fileExt) {
			case "RTE":
				fileEntry.file_content = this.getRTEFile (beg_off, end_off);
				break;
			case "WPT":
				fileEntry.file_content = this.getWPTFile (beg_off, end_off);
				break;
			case "TRK":
				fileEntry.file_content = this.getTRKFile (beg_off, end_off);
				break;
			default:
				displayErrorToUser("ADM Subfile Error", "Unknown ADM subfile: "+fileEntry.fileExt+".");
				break;
			}
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Read}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getSubFileRecords (beginning_offset, ending_offset) {
	/*jshint validthis: true*/
	var sub_file = {
		main_record: {},
		data_record: {},
		chksm_record: {}
	};

	sub_file.raw_data = viewTypedArray (D_TYPE.UINT8, this.grandparent.gpx_meta.rawContents.buffer, beginning_offset, ending_offset-beginning_offset+1);
    sub_file.main_record = readAdmObject (garminAdmMeta.fileData.dataRecordGeneric.mainRecord, sub_file.raw_data.buffer);
    sub_file.main_record.raw_data = viewTypedArray (D_TYPE.UINT8, sub_file.raw_data.buffer, 6, sub_file.main_record.size);

    sub_file.data_record = readAdmObject (garminAdmMeta.fileData.dataRecordGeneric.dataRecord, sub_file.raw_data.buffer, sub_file.main_record.data_record_offset);
    sub_file.data_record.raw_data = viewTypedArray (D_TYPE.UINT8, sub_file.raw_data.buffer, sub_file.main_record.data_record_offset+6, sub_file.data_record.size);

    sub_file.chksm_record = readAdmObject (garminAdmMeta.fileData.dataRecordGeneric.checkSumRecord, sub_file.raw_data.buffer, sub_file.main_record.size);
    sub_file.chksm_record.raw_data = viewTypedArray (D_TYPE.UINT8, sub_file.raw_data.buffer, sub_file.main_record.size+6, sub_file.chksm_record.size);

	// Do a couple of dummy checks
	if ((sub_file.main_record.type !== RECORD_TYPE.MAIN)||
		(sub_file.data_record.type !== RECORD_TYPE.DATA)||
		(sub_file.chksm_record.type !== RECORD_TYPE.CHKSM)) {
		console.error ("One or more of the record types doesn't match what it should be! Main record type="+sub_file.main_record.type+" Data record type="+sub_file.data_record.type+" Checksum record type="+sub_file.chksm_record.type);
	}

	return sub_file;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getFileDescTable (data, pointer, num_entries) {
	var entries = [];
	for (var i=0; i<num_entries; i++) {
		var desc_offset = i*4;
		var desc_entry = {
			type: viewTypedArray (D_TYPE.UINT16, data.buffer, pointer+desc_offset, 1),
			length: viewTypedArray (D_TYPE.UINT16, data.buffer, pointer+desc_offset+2, 1)
		};
		entries.push (desc_entry);
	}

	return entries;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getPoints (data, file, pt_cnt, pt_base_offset) {
	var pts = [];
	var pt_offset = 0;

	for (var i=0; i<pt_cnt; i++) {
		var point = {};
		var desc_offset = 0;
		for (var j=0; j<file.pt_desc.entries.length; j++) {
			var desc = file.pt_desc.entries[j];
			var keyName = getKeyNameForVal(WPT_DESC_FIELD_TYPES, desc.type);
			if ((keyName === undefined)||(keyName === null)) {
				displayErrorToUser("Point Descriptor Error", "Unknown point descriptor type: "+desc.type+".");
				return null;
			}
			switch (keyName) {
			case "TYPE":
			case "SYM":
			case "DISP_MODE":
			case "NOT_IN_WPT_FILE":
				point[keyName] = viewTypedArray (desc.length, data.buffer, pt_base_offset+pt_offset+desc_offset, 1);
				break;
			case "TIMESTAMP":
				point[keyName] = uint32ToTimestamp (viewTypedArray (desc.length, data.buffer, pt_base_offset+pt_offset+desc_offset, 1));
				break;
			case "LAT":
			case "LONG":
				point[keyName] = mapUnitToLatLong (viewTypedArray (D_TYPE.INT32, data.buffer, pt_base_offset+pt_offset+desc_offset, 1));
				break;
			case "DEPTH_MTRS":
			case "TEMP_C":
				point[keyName] = uint32ToFloat (viewTypedArray (desc.length, data.buffer, pt_base_offset+pt_offset+desc_offset, 1, true));
				break;
			case "NAME":
			case "NAME_CPY":
			case "NOTES":
			case "STREET_ADDR":
			case "CITY":
				point[keyName] = viewTypedArrayToStr (data.buffer, pt_base_offset+pt_offset+desc_offset, desc.length);
				break;
			default:
				point[keyName] = viewTypedArray (D_TYPE.UINT8, data.buffer, pt_base_offset+pt_offset+desc_offset, desc.length);
				break;
			}

			desc_offset += desc.length;
		}
		pts.push (point);
		pt_offset += file.pt_desc.len_per_pt;
	}

	return pts;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getRoutes (data, rte_file) {
	var routes = [];
	var rte_offset = 0;

	for (var i=0; i<rte_file.rtes_info.num_routes; i++) {
		var route = {};
		var desc_offset = 0;
		for (var j=0; j<rte_file.rte_desc.entries.length; j++) {
			var desc = rte_file.rte_desc.entries[j];
			var keyName = getKeyNameForVal(RTE_DESC_FIELD_TYPES, desc.type);
			if ((keyName === undefined)||(keyName === null)) {
				displayErrorToUser("Route Point Descriptor Error", "Unknown route descriptor type: "+desc.type+".");
				return null;
			}
			if (keyName === "NAME") {
				route[keyName] = viewTypedArrayToStr (data.buffer, rte_file.rtes_info.pointer+rte_offset+desc_offset, desc.length);
			}
			else {
				route[keyName] = viewTypedArray (desc.length, data.buffer, rte_file.rtes_info.pointer+rte_offset+desc_offset, 1);
			}
			desc_offset += desc.length;
		}
		route.rtepts = getPoints (data, rte_file, route.RTEPT_CNT, route.RTEPT_POINTER);
		routes.push (route);
		rte_offset += (rte_file.rte_desc.len_per_rte + (rte_file.pt_desc.len_per_pt*route.RTEPT_CNT));
	}

	return routes;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Read}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getRTEFile (beginning_offset, ending_offset) {
	/*jshint validthis: true*/
	var rte_file = null;
	var sub_file = this.getSubFileRecords (beginning_offset, ending_offset);
	if (sub_file.main_record.file_type !== SUB_FILE_TYPE.RTE) {
		console.error ("Unexpected file type for a RTE subfile: "+sub_file.main_record.file_type);
	}
	else {
		rte_file = {
			rte_desc:{},
			pt_desc:{},
			rtes_info:{},
			rtes: []
		};
		rte_file.rte_desc.pointer = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 0, 1);
		rte_file.rte_desc.num_entries = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 4, 1);
		rte_file.rte_desc.entries = getFileDescTable(sub_file.raw_data, rte_file.rte_desc.pointer, rte_file.rte_desc.num_entries);
		rte_file.rte_desc.len_per_rte = 0;
		rte_file.rte_desc.entries.forEach (function (desc) {
			rte_file.rte_desc.len_per_rte += desc.length;
		});
		
		rte_file.pt_desc.pointer = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 8, 1);
		rte_file.pt_desc.num_entries = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 12, 1);
		rte_file.pt_desc.entries = getFileDescTable(sub_file.raw_data, rte_file.pt_desc.pointer, rte_file.pt_desc.num_entries);
		rte_file.pt_desc.len_per_pt = 0;
		rte_file.pt_desc.entries.forEach (function (desc) {
			rte_file.pt_desc.len_per_pt += desc.length;
		});
		
		rte_file.rtes_info.pointer = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 16, 1);
		rte_file.rtes_info.num_routes = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 20, 1);

		rte_file.rtes = getRoutes (sub_file.raw_data, rte_file);
	}

	return rte_file;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Read}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getWPTFile (beginning_offset, ending_offset) {
	/*jshint validthis: true*/
	var wpt_file = null;
	var sub_file = this.getSubFileRecords (beginning_offset, ending_offset);
	if (sub_file.main_record.file_type !== SUB_FILE_TYPE.WPT) {
		console.error ("Unexpected file type for a WPT subfile: "+sub_file.main_record.file_type);
	}
	else {
		wpt_file = {
			pt_desc:{},
			wpts_info: {},
			wpts:[]
		};
		
		wpt_file.pt_desc.pointer = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 0, 1);
		wpt_file.pt_desc.num_entries = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 4, 1);
		wpt_file.pt_desc.entries = getFileDescTable(sub_file.raw_data, wpt_file.pt_desc.pointer, wpt_file.pt_desc.num_entries);
		wpt_file.pt_desc.len_per_pt = 0;
		wpt_file.pt_desc.entries.forEach (function (desc) {
			wpt_file.pt_desc.len_per_pt += desc.length;
		});

		wpt_file.wpts_info.pointer = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 8, 1);
		wpt_file.wpts_info.num_wpts = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 12, 1);

		wpt_file.wpts = getPoints (sub_file.raw_data, wpt_file, wpt_file.wpts_info.num_wpts, wpt_file.wpts_info.pointer);
	}

	return wpt_file;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getTrackPoints (data, file, pt_cnt, pt_base_offset) {
	var pts = [];
	var pt_offset = 0;

	for (var i=0; i<pt_cnt; i++) {
		var point = {};
		var desc_offset = 0;
		for (var j=0; j<file.pt_desc.entries.length; j++) {
			var desc = file.pt_desc.entries[j];
			var keyName = getKeyNameForVal(TRK_PT_DESC_FIELD_TYPES, desc.type);
			if ((keyName === undefined)||(keyName === null)) {
				displayErrorToUser("Track Point Descriptor Error", "Unknown point descriptor type: "+desc.type+".");
				return null;
			}
			switch (keyName) {
			case "TIMESTAMP":
				point[keyName] = uint32ToTimestamp (viewTypedArray (desc.length, data.buffer, pt_base_offset+pt_offset+desc_offset, 1));
				break;
			case "LAT":
			case "LONG":
				point[keyName] = mapUnitToLatLong (viewTypedArray (D_TYPE.INT32, data.buffer, pt_base_offset+pt_offset+desc_offset, 1));
				break;
			case "DEPTH_MTRS":
			case "TEMP_C":
				point[keyName] = uint32ToFloat (viewTypedArray (desc.length, data.buffer, pt_base_offset+pt_offset+desc_offset, 1, true));
				break;
			default:
				point[keyName] = viewTypedArray (D_TYPE.UINT8, data.buffer, pt_base_offset+pt_offset+desc_offset, desc.length);
				break;
			}

			desc_offset += desc.length;
		}
		pts.push (point);
		pt_offset += file.pt_desc.len_per_pt;
	}

	return pts;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getTracks (data, trk_file) {
	var tracks = [];
	var trk_offset = 0;

	for (var i=0; i<trk_file.trks_info.num_tracks; i++) {
		var track = {};
		var desc_offset = 0;
		for (var j=0; j<trk_file.trk_desc.entries.length; j++) {
			var desc = trk_file.trk_desc.entries[j];
			var keyName = getKeyNameForVal(TRK_DESC_FIELD_TYPES, desc.type);
			if ((keyName === undefined)||(keyName === null)) {
				displayErrorToUser("Track Descriptor Error", "Unknown track descriptor type: "+desc.type+".");
				return null;
			}
			if (keyName === "NAME") {
				track[keyName] = viewTypedArrayToStr (data.buffer, trk_file.trks_info.pointer+trk_offset+desc_offset, desc.length);
			}
			else {
				track[keyName] = viewTypedArray (desc.length, data.buffer, trk_file.trks_info.pointer+trk_offset+desc_offset, 1);
			}
			desc_offset += desc.length;
		}
		track.trkpts = getTrackPoints (data, trk_file, track.TRKPT_CNT, track.TRKPT_POINTER);
		tracks.push (track);
		trk_offset += (trk_file.trk_desc.len_per_trk + (trk_file.pt_desc.len_per_pt*track.TRKPT_CNT));
	}

	return tracks;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Read}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getTRKFile (beginning_offset, ending_offset) {
	/*jshint validthis: true*/
	var trk_file = null;
	var sub_file = this.getSubFileRecords (beginning_offset, ending_offset);
	if (sub_file.main_record.file_type !== SUB_FILE_TYPE.TRK) {
		console.error ("Unexpected file type for a TRK subfile: "+sub_file.main_record.file_type);
	}
	else {
		trk_file = {
			trk_desc:{},
			pt_desc:{},
			trks_info:{},
			trks: []
		};
		trk_file.trk_desc.pointer = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 0, 1);
		trk_file.trk_desc.num_entries = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 4, 1);
		trk_file.trk_desc.entries = getFileDescTable(sub_file.raw_data, trk_file.trk_desc.pointer, trk_file.trk_desc.num_entries);
		trk_file.trk_desc.len_per_trk = 0;
		trk_file.trk_desc.entries.forEach (function (desc) {
			trk_file.trk_desc.len_per_trk += desc.length;
		});
		
		trk_file.pt_desc.pointer = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 8, 1);
		trk_file.pt_desc.num_entries = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 12, 1);
		trk_file.pt_desc.entries = getFileDescTable(sub_file.raw_data, trk_file.pt_desc.pointer, trk_file.pt_desc.num_entries);
		trk_file.pt_desc.len_per_pt = 0;
		trk_file.pt_desc.entries.forEach (function (desc) {
			trk_file.pt_desc.len_per_pt += desc.length;
		});
		
		trk_file.trks_info.pointer = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 16, 1);
		trk_file.trks_info.num_tracks = viewTypedArray (D_TYPE.UINT32, sub_file.data_record.raw_data.buffer, 20, 1);

		trk_file.trks = getTracks (sub_file.raw_data, trk_file);
	}

	return trk_file;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Read}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function findFileInCtrlFile (name, ext) {
	let foundFile = null;

	for (let i=0; i<this.parent.ctrlFile.fileTable.length; i++) {
		if ((this.parent.ctrlFile.fileTable[i].entryValid === 1) &&
			(this.parent.ctrlFile.fileTable[i].fileName.toLowerCase() === name.toLowerCase()) &&
			(this.parent.ctrlFile.fileTable[i].fileExt.toLowerCase() === ext.toLowerCase())) {
			foundFile = this.parent.ctrlFile.fileTable[i].file_content[ext.toLowerCase()+"s"];
			break;
		}
	}

	return foundFile;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function addTrkDateToBaseName (bn, d) {
	if ((d === undefined) || (d === null)) {
		return bn;
	}

	let split_d = d.split ('T');

	return bn + "-" + split_d[0];
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Read}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function admToGpx () {
	/*jshint validthis: true*/
	let thiis = this;

	let wptsFile = this.findFileInCtrlFile ("USERDATA", "WPT");
	if (wptsFile !== null) {
		wptsFile.forEach (function (wpt) {
			thiis.grandparent.gpx_meta.gpx.addWpt (new GPX_Wpt (wpt.NAME, wpt.LAT, wpt.LONG, wpt.TIMESTAMP, getSymNameFromADMSymNum (wpt.SYM), null, null));
			if ((wpt.NAME !== undefined) && (wpt.NAME !== null) &&
				(wpt.NAME.length > thiis.grandparent.gpx_meta.wptNameMaxLen)) {
				thiis.grandparent.gpx_meta.wptNameMaxLen = wpt.NAME.length;
			}
		});
	}

	let rtesFile = this.findFileInCtrlFile ("USERDATA", "RTE");
	if (rtesFile !== null) {
		rtesFile.forEach (function (rte) {
			let r = thiis.grandparent.gpx_meta.gpx.addRte (new GPX_Rte (rte.NAME));
			if ((rte.NAME !== undefined) && (rte.NAME !== null) &&
				(rte.NAME.length > thiis.grandparent.gpx_meta.rteNameMaxLen)) {
				thiis.grandparent.gpx_meta.rteNameMaxLen = rte.NAME.length;
			}
			rte.rtepts.forEach (function (rtept) {
				r.addRtePt (new GPX_Wpt (rtept.NAME, rtept.LAT, rtept.LONG, rtept.TIMESTAMP, getSymNameFromADMSymNum (rtept.SYM), rtept.DEPTH_MTRS, rtept.TEMP_C));
				if ((rtept.NAME !== undefined) && (rtept.NAME !== null) &&
					(rtept.NAME.length > thiis.grandparent.gpx_meta.rteptNameMaxLen)) {
					thiis.grandparent.gpx_meta.rteptNameMaxLen = rtept.NAME.length;
				}
			});
		});
	}

	let trksFile = this.findFileInCtrlFile ("USERDATA", "TRK");
	if (trksFile !== null) {
		trksFile.forEach (function (trk) {
			let baseName = "";
			if ((trk.NAME !== undefined)&&(trk.NAME !== null)) {
				baseName = trk.NAME.replace (/ /g, "-"); 
			}
			// TODO: Figure out name length and a better naming scheme
			baseName = "Trk";
			let t = null;
			let t_seg = null;
			let trkName = null;
			if ((trk.trkpts !== undefined) && (trk.trkpts !== null) &&
				(trk.trkpts[0] !== undefined) && (trk.trkpts[0] !== null)) {
				trkName = addTrkDateToBaseName (baseName, trk.trkpts[0].TIMESTAMP);
			}
			else {
				trkName = baseName;
			}
			t = thiis.grandparent.gpx_meta.gpx.addTrk (new GPX_Trk (trkName));
			if (trkName.length > thiis.grandparent.gpx_meta.trkNameMaxLen) {
				thiis.grandparent.gpx_meta.trkNameMaxLen = trkName.length;
			}
			t_seg = t.addTrkSeg (new GPX_TrkSeg());
			trk.trkpts.forEach (function (trkpt, ptNum) {
				if ((trkpt.TRK_FIRST_PT === 1) && (ptNum !== 0)) {
					trkName = addTrkDateToBaseName (baseName, trkpt.TIMESTAMP);
					t = thiis.grandparent.gpx_meta.gpx.addTrk (new GPX_Trk (trkName));
					t_seg = t.addTrkSeg (new GPX_TrkSeg());
					if (trkName.length > thiis.grandparent.gpx_meta.trkNameMaxLen) {
						thiis.grandparent.gpx_meta.trkNameMaxLen = trkName.length;
					}
				}
				t_seg.addTrkPt (new GPX_Wpt (null, trkpt.LAT, trkpt.LONG, trkpt.TIMESTAMP, null, trkpt.DEPTH_MTRS, trkpt.TEMP_C));
			});
		});
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
    this.parent = parent;  // The GPX_G_Adm instance
    this.grandparent = parent.parent; // The GPX_File instance

	this.parseAdm = function () {
		return parseAdm.call (this);
	};
	this.getFileTable = function () {
		return getFileTable.call (this);
	};
	this.getSubFileRecords = function (beginning_offset, ending_offset) {
		return getSubFileRecords.call (this, beginning_offset, ending_offset);
	};
	this.getRTEFile = function (beginning_offset, ending_offset) {
		return getRTEFile.call (this, beginning_offset, ending_offset);
	};
	this.getWPTFile = function (beginning_offset, ending_offset) {
		return getWPTFile.call (this, beginning_offset, ending_offset);
	};
	this.getTRKFile = function (beginning_offset, ending_offset) {
		return getTRKFile.call (this, beginning_offset, ending_offset);
	};
	this.findFileInCtrlFile = function (name, ext) {
		return findFileInCtrlFile.call (this, name, ext);
	};
	this.admToGpx = function () {
		return admToGpx.call (this);
	};
}