///////////////////////////////////////////////////////////////////////////////
/**
 * @param {GPX_G_Adm} parent
 */
///////////////////////////////////////////////////////////////////////////////
function GPX_G_Adm_Write (parent) {
    "use strict"

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function insertDataIntoBuffer (tos, buffer, offsetStart, offsetArg, defValArg) {
    let offset = tos.offset;
    let defVal = 0;
    let padData = 0;

    if (typeof tos.offset == "function") {
        if ((offsetArg !== undefined) && (offsetArg !== null)) {
            offset = tos.offset(offsetArg);
        }
        else {
            offset = tos.offset();
        }
    }
    else {
        offset = tos.offset+offsetStart;
    }

    if (typeof tos.defVal == "function") {
        if ((defValArg !== undefined) && (defValArg !== null)) {
            defVal = tos.defVal(defValArg);
        }
        else {
            defVal = tos.defVal();
        }
       // console.log ("Def val from function: ",defVal);
    }
    else {
        defVal = tos.defVal;
    }

    if ((tos.padData !== undefined)&&(tos.padData !== null)) {
        padData = tos.padData;
    }

    let buffSeg = setOutputArrayByType (tos.type, defVal, tos.size, padData);

    // @ts-ignore this.currentFileSize will not be undefined as IntelliSense seems to think
    if ((offset+buffSeg.size) > this.currentFileSize) {
        let resizedArray = new Uint8Array(offset+buffSeg.size);
        if ((buffer !== undefined) && (buffer !== null)) {
            resizedArray.set (buffer, 0);
        }
        buffer = resizedArray;
    }

    buffer.set (buffSeg.buff, offset);

    this.currentFileSize = buffer.byteLength;
    
    return buffer;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeAdmObject (meta, buffer, offsetStart, offsetArg, defValArg) {
    if ((offsetStart === undefined)||(offsetStart === null)) {
        offsetStart = 0;
    }

    for (const key in meta) {
		if (meta.hasOwnProperty (key)) {
            let tos = meta[key];
            buffer = this.insertDataIntoBuffer (tos, buffer, offsetStart, offsetArg, defValArg);        
		}
	}

    return buffer;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeBootSector () {
    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.bootSector.header, this.grandparent.gpx_meta.rawContents, 0);

    // Write out bootsector unused1
    let tos = garminAdmMeta.bootSector.unused1;
    this.grandparent.gpx_meta.rawContents = this.insertDataIntoBuffer (tos, this.grandparent.gpx_meta.rawContents, 0);
    
    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.bootSector.partionTable1, this.grandparent.gpx_meta.rawContents, 0);

    // Write out bootsector unused2
    tos = garminAdmMeta.bootSector.unused2;
    this.grandparent.gpx_meta.rawContents = this.insertDataIntoBuffer (tos, this.grandparent.gpx_meta.rawContents, 0);
    
    // Write out bootsector master boot record signature
    // @ts-ignore This is not typescript and the object type can change
    tos = garminAdmMeta.bootSector.mbr_sig;
    this.grandparent.gpx_meta.rawContents = this.insertDataIntoBuffer (tos, this.grandparent.gpx_meta.rawContents, 0);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeFileTableEntries () {
    let thiis = this;
    let fileMetaMap = {};
    let offsetOfFirstEmptySectorInCluster0 = 0;
    for (let fmIndex=0; fmIndex < this.fileMeta.length; fmIndex++) {
        let startOffset = this.parent.fileTableStartOffset + (fmIndex * this.parent.sectorSize);
        offsetOfFirstEmptySectorInCluster0 = startOffset + this.parent.sectorSize;
        this.fileMeta[fmIndex].metaStartOffset = startOffset;
        fileMetaMap[this.fileMeta[fmIndex].ext.trim()===""?"CTL":this.fileMeta[fmIndex].ext] = this.fileMeta[fmIndex];
        this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.fileTable, this.grandparent.gpx_meta.rawContents, startOffset, null, this.fileMeta[fmIndex]);
    }

    // Add the cluster numbers that each file's data are in.  I am hardwiring
    // this to locate the file data as follows; control file first (required),
    // waypoint file, route file and track file, which doesn't match the order
    // in the file table we just wrote.  The reason I am doing this is to match
    // the order that HomePort puts them in which allows me to easily do a
    // binary comparison so that I can chekc for errors in my code.  I
    // seriously doubt that this order is required, other than the control file
    // occupying the first two clusters.
    let fileExt = ["CTL","WPT","RTE","TRK"];
    let tos = deepObjectCopy (garminAdmMeta.fileTable.clusterList, []); //{type: D_TYPE.UINT16, offset: 0x020, size: 0, defVal: []};
    tos.size = 0;
    tos.defVal = [];
    let currCluster = 0;
    fileExt.forEach (function (ext) {
        tos.size = fileMetaMap[ext].clusterCnt;
        let clusterArray = [];
        for (let i=0; i<tos.size; i++) {
            clusterArray.push (currCluster);
            currCluster++;
        }
        tos.defVal = clusterArray;
        fileMetaMap[ext].dataStartCluster = clusterArray[0];
        thiis.grandparent.gpx_meta.rawContents = thiis.insertDataIntoBuffer (tos, thiis.grandparent.gpx_meta.rawContents, fileMetaMap[ext].metaStartOffset);
    });

    // currCluster now represents the count of clusters for the whole file
    // lets fill the whole thing with the "empty sector" pattern and then 
    // overwrite as needed with the file data.  We do this to ensure all
    // gaps have an expected set of values that follow HomePort's pattern
    // of a 0x00 followed by 511 0xff's to fill in all the control file's
    // empty sectors and a all 0xff in all other sectors
    //
    // First we need to fill the remaining unused sectors in the Control
    // file, which is clusters 0 and 1.  Cluster 0 is the only one that
    // has information in it so we can't fill that whole cluster.
    for (let startOffset=offsetOfFirstEmptySectorInCluster0; startOffset<(this.parent.secsPerCluster*this.parent.sectorSize); startOffset+=this.parent.sectorSize) {
        this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.emptyControlFileSector, this.grandparent.gpx_meta.rawContents, startOffset);
    }

    for (let cluster=1; cluster<currCluster; cluster++) {
        this.fillEmptyCluster (cluster);
    }
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeSingleWaypoint (wpt, type, descArray, startOffset) {
    let thiis = this;
    let tos = {};

    descArray.forEach (function (desc) {
        let val = null;
        tos = {};
        switch (desc.desc) {
        // Write one of the data type (the data type and descriptor length are one to one for these.)
        case WPT_DESC_FIELD_TYPES.TYPE:
            tos = {type: desc.size, offset: 0, size: 1, defVal: type};
            break;
        case WPT_DESC_FIELD_TYPES.SYM:
            tos = {type: desc.size, offset: 0, size: 1, defVal: getADMSymNumFromName (wpt.sym)};
            break;
        case WPT_DESC_FIELD_TYPES.DISP_MODE:
            tos = {type: desc.size, offset: 0, size: 1, defVal: type===0?3:1};
            break;
        case WPT_DESC_FIELD_TYPES.NOT_IN_WPT_FILE:
            // TODO: Need to actually look to see if the routepoint is in the
            // waypoint file or not.  Here it is currently hardwired to saying
            // it is not.
            tos = {type: desc.size, offset: 0, size: 1, defVal: 1};
            break;
        case WPT_DESC_FIELD_TYPES.UNKNWN1:
        case WPT_DESC_FIELD_TYPES.UNKWNN2:
        case WPT_DESC_FIELD_TYPES.UNKWNN4:
            tos = {type: desc.size, offset: 0, size: 1, defVal: 0x0};
            break;
        case WPT_DESC_FIELD_TYPES.UNKWNN5:
            tos = {type: desc.size, offset: 0, size: 1, defVal: 0xffffffff};
            break;

        // latLongToMapUnit
        case WPT_DESC_FIELD_TYPES.LAT:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: latLongToMapUnit (wpt.attrs.lat)};
            break;
        case WPT_DESC_FIELD_TYPES.LONG:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: latLongToMapUnit (wpt.attrs.lon)};
            break;

        // String
        case WPT_DESC_FIELD_TYPES.NAME:
            tos = {type: D_TYPE.STRING, offset: 0, size: desc.size, defVal: wpt.name?wpt.name:"", padData: 0x00};
            break;
        case WPT_DESC_FIELD_TYPES.NOTES:
            tos = {type: D_TYPE.STRING, offset: 0, size: desc.size, defVal: wpt.notes?wpt.notes:"", padData: 0x00};
            break;
        case WPT_DESC_FIELD_TYPES.NAME_CPY:
            tos = {type: D_TYPE.STRING, offset: 0, size: desc.size, defVal: wpt.name?wpt.name:"", padData: 0x00};
            break;
        case WPT_DESC_FIELD_TYPES.STREET_ADDR:
            tos = {type: D_TYPE.STRING, offset: 0, size: desc.size, defVal: wpt.street_addr?wpt.street_addr:"", padData: 0x00};
            break;
        case WPT_DESC_FIELD_TYPES.CITY:
            tos = {type: D_TYPE.STRING, offset: 0, size: desc.size, defVal: wpt.city?wpt.city:"", padData: 0x00};
            break;

        // floatToUint32
        case WPT_DESC_FIELD_TYPES.DEPTH_MTRS:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: floatToUint32 (wpt.depth)};
            break;
        case WPT_DESC_FIELD_TYPES.TEMP_C:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: floatToUint32 (wpt.temp)};
            break;

        // timestampToUint32
        case WPT_DESC_FIELD_TYPES.TIMESTAMP:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: timestampToUint32 (wpt.time)};
            break;

        // Write two UINT32's
        case WPT_DESC_FIELD_TYPES.UNKWNN6:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 2, defVal: 0xFFFFFFFF};
            break;        
        default:
            break;
        }
        thiis.grandparent.gpx_meta.rawContents = thiis.insertDataIntoBuffer (tos, thiis.grandparent.gpx_meta.rawContents, startOffset, null, null);
        startOffset += (tos.size * (tos.type<10?tos.type:(tos.type<20?tos.type-10:tos.type-20)));
    });

    // Return the start offset for the next waypoint to be written
    return startOffset;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeSingleTrackpoint (trkpt, isFirstPt, descArray, startOffset) {
    let thiis = this;
    let tos = {};

    descArray.forEach (function (desc) {
        let val = null;
        tos = {};
        switch (desc.desc) {
        case TRK_PT_DESC_FIELD_TYPES.LAT:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: latLongToMapUnit (trkpt.attrs.lat)};
            break;
	    case TRK_PT_DESC_FIELD_TYPES.LONG:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: latLongToMapUnit (trkpt.attrs.lon)};
            break;
        case TRK_PT_DESC_FIELD_TYPES.TIMESTAMP:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: timestampToUint32 (trkpt.time)};
            break;
	    case TRK_PT_DESC_FIELD_TYPES.DEPTH_MTRS:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: floatToUint32 (trkpt.depth)};
            break;
	    case TRK_PT_DESC_FIELD_TYPES.TRK_FIRST_PT:
            tos = {type: desc.size, offset: 0, size: 1, defVal: isFirstPt};
            break;
	    case TRK_PT_DESC_FIELD_TYPES.TEMP_C:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: floatToUint32 (trkpt.temp)};
            break;
        default:
            break;
        }
        thiis.grandparent.gpx_meta.rawContents = thiis.insertDataIntoBuffer (tos, thiis.grandparent.gpx_meta.rawContents, startOffset, null, null);
        startOffset += (tos.size * (tos.type<10?tos.type:(tos.type<20?tos.type-10:tos.type-20)));
    });

    // Return the start offset for the next waypoint to be written
    return startOffset;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeSingleRoute (rte, pttype, descArrayRte, descArrayRtePt, startOffset, rteFileStartOffset) {
    let thiis = this;
    let tos = {};
    let rteStartOffset = startOffset;

    descArrayRte.forEach (function (desc) {
        let val = null;
        tos = {};
        switch (desc.desc) {
        case RTE_DESC_FIELD_TYPES.NAME:
            tos = {type: D_TYPE.STRING, offset: 0, size: desc.size, defVal: rte.name?rte.name:"", padData: 0x00};
            break;
	    case RTE_DESC_FIELD_TYPES.RTEPT_CNT:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: rte.rtepts?rte.rtepts.length:0, padData: 0xffffffff};
            break;
	    case RTE_DESC_FIELD_TYPES.RTEPT_POINTER:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: (rteStartOffset - rteFileStartOffset) + 8 + thiis.grandparent.gpx_meta.rteNameMaxLen, padData: 0xff};
            break;
        default:
            break;
        }
        thiis.grandparent.gpx_meta.rawContents = thiis.insertDataIntoBuffer (tos, thiis.grandparent.gpx_meta.rawContents, startOffset, null, null);
        startOffset += (tos.size * (tos.type<10?tos.type:(tos.type<20?tos.type-10:tos.type-20)));
    });

    rte.rtepts.forEach (function (rtept) {
        startOffset = thiis.writeSingleWaypoint (rtept, pttype, descArrayRtePt, startOffset);
    });

    return startOffset;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeSingleTrack (trk, descArrayTrk, descArrayTrkPt, startOffset, trkFileStartOffset) {
    let thiis = this;
    let tos = {};
    let trkStartOffset = startOffset;

    descArrayTrk.forEach (function (desc) {
        let val = null;
        tos = {};
        switch (desc.desc) {
        case TRK_DESC_FIELD_TYPES.NAME:
            tos = {type: D_TYPE.STRING, offset: 0, size: desc.size, defVal: trk.name?trk.name:"", padData: 0x00};
            break;
	    case TRK_DESC_FIELD_TYPES.TRKPT_CNT:
            let trkptCnt = 0;
            if (trk.trksegs) {
                trk.trksegs.forEach (function (seg) {
                    trkptCnt += (seg.trkpts?seg.trkpts.length:0);
                });
            }
            tos = {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: trkptCnt, padData: 0xffff};
            break;
        case TRK_DESC_FIELD_TYPES.TRK_UNKNOWN:
            tos = {type: D_TYPE.UINT8, offset: 0, size: 1, defVal: 2, padData: 0xff};
            break;
	    case TRK_DESC_FIELD_TYPES.TRK_COLOR:
            tos = {type: D_TYPE.UINT8, offset: 0, size: 1, defVal: TRK_COLOR.GREEN, padData: 0xff};
            break;
	    case TRK_DESC_FIELD_TYPES.TRKPT_POINTER:
            tos = {type: D_TYPE.UINT32, offset: 0, size: 1, defVal: (trkStartOffset - trkFileStartOffset) + 8 + thiis.grandparent.gpx_meta.trkNameMaxLen, padData: 0xff};
            break;
        default:
            break;
        }
        thiis.grandparent.gpx_meta.rawContents = thiis.insertDataIntoBuffer (tos, thiis.grandparent.gpx_meta.rawContents, startOffset, null, null);
        startOffset += (tos.size * (tos.type<10?tos.type:(tos.type<20?tos.type-10:tos.type-20)));
    });

    trk.trksegs.forEach (function (seg) {
        seg.trkpts.forEach (function (trkpt, index) {
            startOffset = thiis.writeSingleTrackpoint (trkpt, index===0?1:0, descArrayTrkPt, startOffset);
        });
    });
    

    return startOffset;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeWaypointFile (fm) {
    let thiis = this;
    let startOffset = fm.dataStartCluster * this.parent.secsPerCluster * this.parent.sectorSize;
    let tableStartOffset = startOffset;
    let defValArg = {size: fm.size, gpx_meta: this.grandparent.gpx_meta};
    // Write out the pt_desc table
    // For each waypoint, loop through all of the waypoint pt_desc
    // types (see WPT_DESC_FIELD_TYPES)

    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.fileData.dataRecordWpt.mainRecord, this.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValArg);
    
    tableStartOffset += 0xf;
    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.fileData.dataRecordWpt.dataRecord, this.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValArg);
    
    tableStartOffset = startOffset + readAdmValue (garminAdmMeta.fileData.dataRecordWpt.dataRecord.pointerWptDesc, this.grandparent.gpx_meta.rawContents, tableStartOffset);
    let calculatedDescriptors = [];
    WPT_DESCRIPTORS.forEach (function (d) {
        // Make a copy so that we don't replace the size with the calculated
        // size in the array that is used by all files.
        let defValDesc = {desc: d.desc, size: d.size};
        if (typeof defValDesc.size === "function") {
            // @ts-ignore Since I am checking if this is a function the
            // error that was given by intellisense was wrong.
            defValDesc.size = defValDesc.size(thiis.grandparent.gpx_meta);
        }
        calculatedDescriptors.push (defValDesc);
        thiis.grandparent.gpx_meta.rawContents = thiis.writeAdmObject (garminAdmMeta.fileData.dataRecordWpt.wptDescriptorTable, thiis.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValDesc);
        tableStartOffset += 4;
    });

    // Now write out the waypoints
    this.grandparent.gpx_meta.gpx.wpts.forEach (function (wpt) {
        tableStartOffset = thiis.writeSingleWaypoint (wpt, 0, calculatedDescriptors, tableStartOffset);
    });

    return tableStartOffset;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeRouteFile (fm) {
    let thiis = this;
    let startOffset = fm.dataStartCluster * this.parent.secsPerCluster * this.parent.sectorSize;
    let tableStartOffset = startOffset;
    let defValArg = {size: fm.size, gpx_meta: this.grandparent.gpx_meta};
    // Write out the pt_desc table
    // For each waypoint, loop through all of the waypoint pt_desc
    // types (see WPT_DESC_FIELD_TYPES)
    
    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.fileData.dataRecordRte.mainRecord, this.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValArg);
    
    let dataFileStartOffset = startOffset + readAdmValue (garminAdmMeta.fileData.dataRecordRte.mainRecord.data_record_offset, this.grandparent.gpx_meta.rawContents, tableStartOffset);
    tableStartOffset = dataFileStartOffset;

    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.fileData.dataRecordRte.dataRecord, this.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValArg);

    tableStartOffset = startOffset + readAdmValue (garminAdmMeta.fileData.dataRecordRte.dataRecord.pointerRteDesc, this.grandparent.gpx_meta.rawContents, tableStartOffset);
    let calculatedRteDescriptors = [];
    RTE_DESCRIPTORS.forEach (function (d) {
        // Make a copy so that we don't replace the size with the calculated
        // size in the array that is used by all files.
        let defValDesc = {desc: d.desc, size: d.size};
        if (typeof defValDesc.size === "function") {
            // @ts-ignore Since I am checking if this is a function the
            // error that was given by intellisense was wrong.
            defValDesc.size = defValDesc.size(thiis.grandparent.gpx_meta);
        }
        calculatedRteDescriptors.push (defValDesc);
        thiis.grandparent.gpx_meta.rawContents = thiis.writeAdmObject (garminAdmMeta.fileData.dataRecordRte.rteDescriptorTable, thiis.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValDesc);
        tableStartOffset += 4;
    });

    tableStartOffset = dataFileStartOffset;
    tableStartOffset = startOffset + readAdmValue (garminAdmMeta.fileData.dataRecordRte.dataRecord.pointerRtePtDesc, this.grandparent.gpx_meta.rawContents, tableStartOffset);
    let calculatedRtePtDescriptors = [];
    RTEPT_DESCRIPTORS.forEach (function (d) {
        // Make a copy so that we don't replace the size with the calculated
        // size in the array that is used by all files.
        let defValDesc = {desc: d.desc, size: d.size};
        if (typeof defValDesc.size === "function") {
            // @ts-ignore Since I am checking if this is a function the
            // error that was given by intellisense was wrong.
            defValDesc.size = defValDesc.size(thiis.grandparent.gpx_meta);
        }
        calculatedRtePtDescriptors.push (defValDesc);
        thiis.grandparent.gpx_meta.rawContents = thiis.writeAdmObject (garminAdmMeta.fileData.dataRecordRte.rtePtDescriptorTable, thiis.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValDesc);
        tableStartOffset += 4;
    });

    // Now write out the routes
    this.grandparent.gpx_meta.gpx.rtes.forEach (function (rte) {
        tableStartOffset = thiis.writeSingleRoute (rte, 2, calculatedRteDescriptors, calculatedRtePtDescriptors, tableStartOffset, startOffset);
    });

    return tableStartOffset;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeTrackFile (fm) {
    let thiis = this;
    let startOffset = fm.dataStartCluster * this.parent.secsPerCluster * this.parent.sectorSize;
    let tableStartOffset = startOffset;
    let defValArg = {size: fm.size, gpx_meta: this.grandparent.gpx_meta};
    // Write out the pt_desc table
    // For each waypoint, loop through all of the waypoint pt_desc
    // types (see WPT_DESC_FIELD_TYPES)
    
    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.fileData.dataRecordTrk.mainRecord, this.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValArg);
    
    let dataFileStartOffset = startOffset + readAdmValue (garminAdmMeta.fileData.dataRecordTrk.mainRecord.data_record_offset, this.grandparent.gpx_meta.rawContents, tableStartOffset);
    tableStartOffset = dataFileStartOffset;

    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (garminAdmMeta.fileData.dataRecordTrk.dataRecord, this.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValArg);

    tableStartOffset = startOffset + readAdmValue (garminAdmMeta.fileData.dataRecordTrk.dataRecord.pointerTrkDesc, this.grandparent.gpx_meta.rawContents, tableStartOffset);
    let calculatedTrkDescriptors = [];
    TRK_DESCRIPTORS.forEach (function (d) {
        // Make a copy so that we don't replace the size with the calculated
        // size in the array that is used by all files.
        let defValDesc = {desc: d.desc, size: d.size};
        if (typeof defValDesc.size === "function") {
            // @ts-ignore Since I am checking if this is a function the
            // error that was given by intellisense was wrong.
            defValDesc.size = defValDesc.size(thiis.grandparent.gpx_meta);
        }
        calculatedTrkDescriptors.push (defValDesc);
        thiis.grandparent.gpx_meta.rawContents = thiis.writeAdmObject (garminAdmMeta.fileData.dataRecordTrk.trkDescriptorTable, thiis.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValDesc);
        tableStartOffset += 4;
    });

    tableStartOffset = dataFileStartOffset;
    tableStartOffset = startOffset + readAdmValue (garminAdmMeta.fileData.dataRecordTrk.dataRecord.pointerTrkPtDesc, this.grandparent.gpx_meta.rawContents, tableStartOffset);
    let calculatedTrkPtDescriptors = [];
    TRKPT_DESCRIPTORS.forEach (function (d) {
        // Make a copy so that we don't replace the size with the calculated
        // size in the array that is used by all files.
        let defValDesc = {desc: d.desc, size: d.size};
        if (typeof defValDesc.size === "function") {
            // @ts-ignore Since I am checking if this is a function the
            // error that was given by intellisense was wrong.
            defValDesc.size = defValDesc.size(thiis.grandparent.gpx_meta);
        }
        calculatedTrkPtDescriptors.push (defValDesc);
        thiis.grandparent.gpx_meta.rawContents = thiis.writeAdmObject (garminAdmMeta.fileData.dataRecordTrk.trkPtDescriptorTable, thiis.grandparent.gpx_meta.rawContents, tableStartOffset, null, defValDesc);
        tableStartOffset += 4;
    });

    // Now write out the routes
    this.grandparent.gpx_meta.gpx.trks.forEach (function (trk) {
        tableStartOffset = thiis.writeSingleTrack (trk, calculatedTrkDescriptors, calculatedTrkPtDescriptors, tableStartOffset, startOffset);
    });

    return tableStartOffset;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeFileData () {
    let thiis = this;
    let checksumStartOffset = 0;
    let meta = null;
    console.log ("Writing file data...");

    this.fileMeta.forEach (function (fm) {
        switch (fm.ext.trim()) {
        case "WPT":
            console.log ("Writing out the Waypoint file...");
            meta = garminAdmMeta.fileData.dataRecordWpt;
            checksumStartOffset = thiis.writeWaypointFile (fm);
            break;
        case "RTE":
            console.log ("Writing out the Route file...");
            meta = garminAdmMeta.fileData.dataRecordRte;
            checksumStartOffset = thiis.writeRouteFile (fm);
            break;
        case "TRK":
            console.log ("Writing out the Track file...");
            meta = garminAdmMeta.fileData.dataRecordTrk;
            checksumStartOffset = thiis.writeTrackFile (fm);
            break;
        case "":
            console.log ("The Control file data has already been written, so skipping the file.");
            return;
        default:
            console.error ("An unknown file with an extension of "+fm.ext.trim()+" can not be written.");
            break;
        }

        thiis.writeChecksumEntry (meta, fm, checksumStartOffset);
    });
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function writeChecksumEntry (meta, fm, startOffset) {
    let fileStartOffset = fm.dataStartCluster * this.parent.secsPerCluster * this.parent.sectorSize;

    // TODO: Should do some dummy checking on these offsets.
    let fileData = viewTypedArray (D_TYPE.UINT8, this.grandparent.gpx_meta.rawContents, fileStartOffset, startOffset-fileStartOffset);
    let chksum = 0x0;
    for (let i=0; i<(startOffset-fileStartOffset); i++) {
        chksum += fileData[i];
    }

    // Mask to ensure we only use 32 bits
    chksum = chksum & 0xffffffff;

    this.grandparent.gpx_meta.rawContents = this.writeAdmObject (meta.checkSumRecord, this.grandparent.gpx_meta.rawContents, startOffset, null, chksum);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function gpxToAdm () {
	/*jshint validthis: true*/
	var thiis = this;

    this.writeBootSector ();

    this.parent.sectorSize = readAdmValue (garminAdmMeta.bootSector.header.sectorSize, this.grandparent.gpx_meta.rawContents, 0);
    console.log ("Using a sector size of "+this.parent.sectorSize+" while writing the ADM file.");

	this.parent.secsPerCluster = Math.pow(2, readAdmValue (garminAdmMeta.bootSector.header.sectPerClusterExp, this.grandparent.gpx_meta.rawContents, 0));
    console.log ("The number of sectors per cluster is "+this.parent.secsPerCluster);

    this.parent.fileTableStartOffset = readAdmValue (garminAdmMeta.bootSector.header.fileTableStartSect, this.grandparent.gpx_meta.rawContents, 0);
    this.parent.fileTableStartOffset = this.parent.fileTableStartOffset * this.parent.sectorSize;
    console.log ("The file table starts at offset "+this.parent.fileTableStartOffset);

    this.setFileMeta ();

    this.writeFileTableEntries ();

    console.log ("The fileMeta=",this.fileMeta);

    this.writeFileData ();

	return this.grandparent.gpx_meta.rawContents;

	// The order of the files will be control file, route
	// file, track file and waypoint file
	// Determine the needed file size in bytes is shown in setFileMeta()
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function setFileMeta () {
    //console.log ("Calculating size and using the following for max lengths:");
    //console.log ("     rteNameMaxLen = "+this.grandparent.gpx_meta.rteNameMaxLen);
    //console.log ("     rteptNameMaxLen = "+this.grandparent.gpx_meta.rteptNameMaxLen);
    //console.log ("     wptNameMaxLen = "+this.grandparent.gpx_meta.wptNameMaxLen);
    //console.log ("     trkNameMaxLen = "+this.grandparent.gpx_meta.trkNameMaxLen);
    let filename = readAdmValue (garminAdmMeta.bootSector.header.description, this.grandparent.gpx_meta.rawContents, 0);
    for (let i=0; i<NUM_ADM_SUB_FILES; i++) {
        let fileExt = (i!==0)?getKeyNameForVal(ADM_FILE_TYPES, i): "   ";
        let fm = {
            name: (i!==0)?filename:"        ", // Blank for the control file
            ext: fileExt, // Blank for the control file
            size: 0, // Filled in below
            type: 0,  // Filled in below, 1 for control file, 0 for all others
            clusterCnt: 0,
            metaStartOffset: 0,
            dataStartCluster: 0
        };
        switch (fileExt) {
        // Number of bytes for Route file:
        //       main record: 15 bytes (record type, length of record, sub file type
        //                    pointer to data record, format version)
        //       data record: 6 bytes (record type, length)
        //       point descriptor: 8 bytes
        //       route descriptor: 8 bytes
        //       routes info: 8 bytes
        //       point descriptor entries: 4 bytes by 19 entries (76 bytes) (based
        //                                 on the boiler plate for the point
        //                                 descriptor)
        //       route descriptor entries: 4 bytes by 3 entries (12 bytes) (based
        //                                 on the boiler plate for the route
        //                                 descriptor)
        //       per route: 8 bytes (num points and pointer to points) plus the
        //                  length of the longest route name in the file
        //                  route points: 44 bytes per (based on the boiler plate
        //                                for the point descriptor) plus two times
        //                                the length of the longest route point
        //                                name in the file
        //       checksum record: 10 bytes (record type, length, checksum)
        case "RTE":
            let rtessize = 0;
            for (let rteindex = 0; rteindex < this.grandparent.gpx_meta.gpx.rtes.length; rteindex++) {
                rtessize += (8 + this.grandparent.gpx_meta.rteNameMaxLen);
                rtessize += ((44 + (2 * this.grandparent.gpx_meta.rteptNameMaxLen)) * this.grandparent.gpx_meta.gpx.rtes[rteindex].rtepts.length);
            }
            fm.size = 15+6+8+8+8+(4*19)+(4*3)+rtessize+10;
            fm.type = 0;
            break;
        // Number of bytes needed for Track file:
        //       main record: 15 bytes (record type, length of record, sub file type
        //                    pointer to data record, format version)
        //       data record: 6 bytes (record type, length)
        //       point descriptor: 8 bytes
        //       tracker descriptor: 8 bytes
        //       track info: 8 bytes
        //       point descriptor entries: 4 bytes by 6 entries (24 bytes) (based
        //                                 on the boiler plate for the point
        //                                 descriptor)
        //       track descriptor entries: 4 bytes by 5 entries (20 bytes) (based
        //                                 on the boiler plate for the route
        //                                 descriptor)
        //       per track: 10 bytes (num points, unknown, color and pointer
        //                  to points) plus the length of the longest track name
        //                  in the file
        //                  track points: 21 bytes per (based on the boiler plate
        //                                for the point descriptor)
        //       checksum record: 10 bytes (record type, length, checksum)
        case "TRK":
            let trkssize = 0;
            for (let trkindex = 0; trkindex < this.grandparent.gpx_meta.gpx.trks.length; trkindex++) {
                trkssize += (8+this.grandparent.gpx_meta.trkNameMaxLen);
                for (let trksegindex = 0; trksegindex < this.grandparent.gpx_meta.gpx.trks[trkindex].trksegs.length; trksegindex++) {
                    trkssize += (21 * this.grandparent.gpx_meta.gpx.trks[trkindex].trksegs[trksegindex].trkpts.length);
                }
            }
            fm.size = 15+6+8+8+8+(4*6)+(4*5)+trkssize+10;
            fm.type = 0;
            break;
        // Number of clusters (65536 per) needed for Waypoint file:
        //       main record: 15 bytes (record type, length of record, sub file type
        //                    pointer to data record, format version)
        //       data record: 6 bytes (record type, length)
        //       point descriptor: 8 bytes
        //       waypoints info: 8 bytes
        //       point descriptor entries: 4 bytes by 10 entries (40 bytes) (based
        //                                 on the boiler plate for the point
        //                                 descriptor)
        //       waypoints: 24 bytes for fixed len items plus the length of the longest
        //                  waypoint name in the file per wpt
        //       checksum record: 10 bytes (record type, length, checksum)
        case "WPT":
            fm.size = 15+6+8+8+(4*10)+((24 + this.grandparent.gpx_meta.wptNameMaxLen) * this.grandparent.gpx_meta.gpx.wpts.length)+10;
            fm.type = 0;
            break;
        // Control file; fixed size: 131072 (2 clusters containing bootsector,
	    //                           gapsectors, filetable)
        default: // Control File
            fm.size = this.parent.sectorSize*this.parent.secsPerCluster*2; // Control file is always 2 clusters in size
            fm.type = 1;
        }
        fm.clusterCnt = Math.floor ((fm.size-1)/(this.parent.sectorSize*this.parent.secsPerCluster)) + 1;
        this.fileMeta.push(fm);
    }
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm_Write}
 * memberof
 * access public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function fillEmptyCluster (clusterNum) {
    let tos = null;
    if ((clusterNum === 0) || (clusterNum === 1)) {
        tos = garminAdmMeta.emptyControlFileSector;
    }
    else {
        tos = garminAdmMeta.emptySector;
    }
    for (let i=0; i<this.parent.secsPerCluster; i++) {
        let startOffset = (clusterNum*this.parent.sectorSize*this.parent.secsPerCluster) + (i * this.parent.sectorSize);
        this.grandparent.gpx_meta.rawContents = this.writeAdmObject (tos, this.grandparent.gpx_meta.rawContents, startOffset);
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
    this.currentFileSize = 0;
    this.fileMeta = [];

    this.writeBootSector = function () {
        return writeBootSector.call (this);
    };
    this.writeFileTableEntries = function () {
        return writeFileTableEntries.call (this);
    };
    this.insertDataIntoBuffer = function (tos, buffer, offsetStart, offsetArg, defValArg) {
        return insertDataIntoBuffer.call (this, tos, buffer, offsetStart, offsetArg, defValArg);
    };
    this.writeAdmObject = function (meta, buffer, offsetStart, offsetArg, defValArg) {
        return writeAdmObject.call (this, meta, buffer, offsetStart, offsetArg, defValArg);
    };
    this.writeFileData = function () {
        return writeFileData.call (this);
    };
    this.writeSingleWaypoint = function (wpt, type, descArray, startOffset) {
        return writeSingleWaypoint.call (this, wpt, type, descArray, startOffset);
    };
    this.writeSingleTrackpoint = function (trkpt, isFirstPt, descArray, startOffset) {
        return writeSingleTrackpoint.call (this, trkpt, isFirstPt, descArray, startOffset);
    };
    this.writeSingleRoute = function (rte, pttype, descArrayRte, descArrayRtePt, startOffset, rteFileStartOffset) {
        return writeSingleRoute.call (this, rte, pttype, descArrayRte, descArrayRtePt, startOffset, rteFileStartOffset);
    };
    this.writeSingleTrack = function (trk, descArrayTrk, descArrayTrkPt, startOffset, trkFileStartOffset) {
        return writeSingleTrack.call (this, trk, descArrayTrk, descArrayTrkPt, startOffset, trkFileStartOffset);
    };
    this.writeWaypointFile = function (fm) {
        return writeWaypointFile.call (this, fm);
    };
    this.writeRouteFile = function (fm) {
        return writeRouteFile.call (this, fm);
    };
    this.writeTrackFile = function (fm) {
        return writeTrackFile.call (this, fm);
    };
    this.writeChecksumEntry = function (meta, fm, startOffset) {
        return writeChecksumEntry.call (this, meta, fm, startOffset);
    };
    this.gpxToAdm = function (gpx_meta) {
		return gpxToAdm.call (this, gpx_meta);
	};
    this.setFileMeta = function () {
        return setFileMeta.call (this);
    };
    this.fillEmptyCluster = function (clusterNum) {
        return fillEmptyCluster.call (this, clusterNum);
    }
}