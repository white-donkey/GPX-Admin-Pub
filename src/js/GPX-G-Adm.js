/* global concatTypedArrays */
/* global MHS_Dialog */
/* global DT */
/* global CT */
/* global getIso8601UTCDate */
/* global icon_meta */

var garminAdmMeta = {
	bootSector: {
		header: {
			xorByte: {type: D_TYPE.UINT8, offset: 0x000, size: 1, defVal: 0x00},
			unused1: {type: D_TYPE.UINT8, offset: 0x001, size: 7, defVal: 0x00},
			verMajor: {type: D_TYPE.UINT8, offset: 0x008, size: 1, defVal: 0x00},
			verMinor: {type: D_TYPE.UINT8, offset: 0x009, size: 1, defVal: 0x00},
			updateMonth: {type: D_TYPE.UINT8, offset: 0x00a, size: 1, defVal: function () {return new Date().getMonth()+1;}},
			updateYear: {type: D_TYPE.UINT8, offset: 0x00b, size: 1, defVal: function () {return new Date().getFullYear()-1900;}},
			unused2: {type: D_TYPE.UINT16, offset: 0x00c, size: 1, defVal: 0x00},
			updateSrc: {type: D_TYPE.UINT8, offset: 0x00e, size: 1, defVal: 0x01},
			checksum: {type: D_TYPE.UINT8, offset: 0x00f, size: 1, defVal: 0x00},
			signature1: {type: D_TYPE.STRING, offset: 0x010, size: 6, defVal: "DSKIMG"},
			sectorSize: {type: D_TYPE.UINT16, offset: 0x016, size: 1, defVal: 512},
			sector1: {type: D_TYPE.UINT16, offset: 0x018, size: 1, defVal: 32},
			head1: {type: D_TYPE.UINT16, offset: 0x01a, size: 1, defVal: 256},
			cylinder1: {type: D_TYPE.UINT16, offset: 0x01c, size: 1, defVal: 1020},
			unused3: {type: D_TYPE.UINT16, offset: 0x01e, size: 3, defVal: 0x00},
			checksum32: {type: D_TYPE.UINT32, offset: 0x024, size: 1, defVal: 0x00},
			unused4: {type: D_TYPE.UINT32, offset: 0x028, size: 2, defVal: 0x00},
			compressedPN: {type: D_TYPE.UINT8, offset: 0x030, size: 9, defVal: [16,212,64,16,4,65,13,4,65]},
			creationYear: {type: D_TYPE.UINT16, offset: 0x039, size: 1, defVal: function (arg) {return new Date().getFullYear();}},
			creationMonth: {type: D_TYPE.UINT8, offset: 0x03b, size: 1, defVal: function (arg) {return new Date().getMonth()+1;}},
			creationDay: {type: D_TYPE.UINT8, offset: 0x03c, size: 1, defVal: function (arg) {return new Date().getDate();}},
			creationHour: {type: D_TYPE.UINT8, offset: 0x03d, size: 1, defVal: function (arg) {return new Date().getHours();}},
			creationMinute: {type: D_TYPE.UINT8, offset: 0x03e, size: 1, defVal: function (arg) {return new Date().getMinutes();}},
			creationSecond: {type: D_TYPE.UINT8, offset: 0x03f, size: 1, defVal: function (arg) {return new Date().getSeconds();}},
			fileTableStartSect: {type: D_TYPE.UINT8, offset: 0x040, size: 1, defVal: 8},
			signature2: {type: D_TYPE.STRING, offset: 0x041, size: 6, defVal: "GARMIN"},
			unused5: {type: D_TYPE.UINT16, offset: 0x047, size: 1, defVal: 0x00},
			description: {type: D_TYPE.STRING, offset: 0x049, size: 20, defVal: "USERDATA", padData: 0x20},
			head2: {type: D_TYPE.UINT16, offset: 0x05d, size: 1, defVal: 256},
			sector2: {type: D_TYPE.UINT16, offset: 0x05f, size: 1, defVal: 32},
			bytesPerSectExp: {type: D_TYPE.UINT8, offset: 0x061, size: 1, defVal: 9},
			sectPerClusterExp: {type: D_TYPE.UINT8, offset: 0x062, size: 1, defVal: 7},
			// While this should be based on file size it looks like Homeport hardwires it
			// to 0xFF00, which would be a file size of 4.2G!
			totalNumClusters: {type: D_TYPE.UINT16, offset: 0x063, size: 1, defVal: 0xFF00, calcAtEnd: true},  // When writing the file, this must be filled in at the end
			unused6: {type: D_TYPE.UINT8, offset: 0x065, size: 30, defVal: 0x20},
			magicValue: {type: D_TYPE.UINT16, offset: 0x083, size: 1, defVal: 0x00},
			sftwrMajorVer: {type: D_TYPE.UINT8, offset: 0x085, size: 1, defVal: 0x00},
			sftwrMinorVer: {type: D_TYPE.UINT8, offset: 0x086, size: 1, defVal: 0x00},
			releaseNum: {type: D_TYPE.UINT16, offset: 0x087, size: 1, defVal: 0x00}
		},
		unused1: {type: D_TYPE.UINT8, offset: 0x089, size: 309, defVal: 0x00},
		partionTable1: {
			status: {type: D_TYPE.UINT8, offset: 0x1be, size: 1, defVal: 0x00},
			firstSect: {type: D_TYPE.UINT8, offset: 0x1bf, size: 3, defVal: [0,1,0]},
			type: {type: D_TYPE.UINT8, offset: 0x1c2, size: 1, defVal: 0x00},
			lastSect: {type: D_TYPE.UINT8, offset: 0x1c3, size: 3, defVal: [255,224,251]},
			lbaFirstSect: {type: D_TYPE.UINT32, offset: 0x1c6, size: 1, defVal: 0x00},
			// This is based on totalNumClusters.  It equals totalNumClusters * 2 ^ sectPerClusterExp
			// See the comment at totalNumClusters to see why I am hardwiring this for now.
			numSects: {type: D_TYPE.UINT32, offset: 0x1ca, size: 1, defVal: 0x007f8000, calcAtEnd: true}    // When writing the file, this must be filled in at the end
		},
		unused2: {type: D_TYPE.UINT8, offset: 0x1CE, size: 48, defVal: 0x00},
		mbr_sig: {type: D_TYPE.UINT8, offset: 0x1FE, size: 2, defVal: [0x55,0xAA]}
	},
	fileTable: {
		entryValid: {type: D_TYPE.UINT8, offset: 0x000, size: 1, defVal: 1, padData: 0xff},
		fileName: {type: D_TYPE.STRING, offset: 0x001, size: 8, defVal: function (arg) {
			if ((arg !== undefined) && (arg !== null)) {
				return arg.name;
			}
		}, padData: 0x00},
		fileExt: {type: D_TYPE.STRING, offset: 0x009, size: 3, defVal: function (arg) {
			if ((arg !== undefined) && (arg !== null)) {
				return arg.ext;
			}
		}, padData: 0x00},
		fileSize: {type: D_TYPE.UINT32, offset: 0x00c, size: 1, defVal: function (arg) {
			if ((arg !== undefined) && (arg !== null)) {
				return arg.size;
			}
		}, padData: 0xffffffff},
		fileType: {type: D_TYPE.UINT8, offset: 0x010, size: 1, defVal: function (arg) {
			if ((arg !== undefined) && (arg !== null)) {
				return arg.type;
			}
		}, padData: 0xff},
		extentNum: {type: D_TYPE.UINT8, offset: 0x011, size: 1, defVal: 0}, // This assumes we have no files greater than 240 clusters
		                                                                    // which would be 15.7 Meg in size.  If we do this default
																			// needs to deal with multiple "extents" in the file table
		unused1: {type: D_TYPE.UINT8, offset: 0x012, size: 14, defVal: 0xFF, padData: 0xff},
		clusterList: {type: D_TYPE.UINT16, offset: 0x020, size: NUM_FILE_ENTRY_CLUSTERS, defVal: 0xFFFF, padData: 0xffff} // This will need to be manually populated in the
		                                                                                              					  // code but set the whole thing to 0xFF for now.
	},
	fileData: {
		// This record is only used for reading
		dataRecordGeneric: {
			mainRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1},
				file_type: {type: D_TYPE.UINT8, offset: 6, size: 1},
				data_record_offset: {type: D_TYPE.UINT32, offset: 7, size: 1},
				format_ver: {type: D_TYPE.UINT32, offset: 11, size: 1}
			},
			dataRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1},
			},
			checkSumRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1},
			}
		},
		// These are used for writing
		dataRecordWpt: {
			mainRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.MAIN},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: function (arg) {
					if ((arg !== undefined) && (arg !== null)) {
						return arg.size - 10; // Calc file size minus 10 (checksum record)
					}
				}},
				file_type: {type: D_TYPE.UINT8, offset: 6, size: 1, defVal: SUB_FILE_TYPE.WPT},
				data_record_offset: {type: D_TYPE.UINT32, offset: 7, size: 1, defVal: 0xf},
				format_ver: {type: D_TYPE.UINT32, offset: 11, size: 1, defVal: 100},
			},
			dataRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.DATA},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: function (arg) {
					if ((arg !== undefined) && (arg !== null)) {
						return arg.size - 25; // Calc file size minus 10 (checksum record) minus 15 (main record)
					}
				}},
				// Waypoint descriptor meta
				pointerWptDesc: {type: D_TYPE.UINT32, offset: 6, size: 1, defVal: 37},
				numDesc: {type: D_TYPE.UINT32, offset: 10, size: 1, defVal: WPT_DESCRIPTORS.length},
				// Waypoint file meta
				pointerWpts: {type: D_TYPE.UINT32, offset: 14, size: 1, defVal: function () {
					let ptr = garminAdmMeta.fileData.dataRecordWpt.dataRecord.pointerWptDesc.defVal;
					ptr += WPT_DESCRIPTORS.length * 4;
					return ptr; 
				}},
				numWpts: {type: D_TYPE.UINT32, offset: 18, size: 1, defVal: function (arg) {
					return arg.gpx_meta.gpx.wpts.length;
				}}
			},
			// There will be one of these for each descriptor.
			// i.e. the length will equal descriptorMeta.numDesc
			wptDescriptorTable: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: function (arg) {return arg.desc}},
				length: {type: D_TYPE.UINT16, offset: 2, size: 1, defVal: function (arg) {return arg.size}}
			},
			wptTable: {
				// This all depends on the descriptorMeta.  They
				// will be a fixed length.  There will also be
				// one for each waypoint.  i.e. the length will
				// equal wptMeta.numWpts
			},
			checkSumRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.CHKSM},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: 10},
				chksum: {type: D_TYPE.UINT32, offset: 6, size: 1, defVal: function (arg) {return arg;}}
			}
		},
		dataRecordRte: {
			mainRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.MAIN},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: function (arg) {
					if ((arg !== undefined) && (arg !== null)) {
						return arg.size - 10; // Calc file size minus 10 (checksum record)
					}
				}},
				file_type: {type: D_TYPE.UINT8, offset: 6, size: 1, defVal: SUB_FILE_TYPE.RTE},
				data_record_offset: {type: D_TYPE.UINT32, offset: 7, size: 1, defVal: 0xf},
				format_ver: {type: D_TYPE.UINT32, offset: 11, size: 1, defVal: 100}
			},
			dataRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.DATA},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: function (arg) {
					if ((arg !== undefined) && (arg !== null)) {
						return arg.size - 25; // Calc file size minus 10 (checksum record) minus 15 (main record)
					}
				}},
				// Route descriptor meta
				pointerRteDesc: {type: D_TYPE.UINT32, offset: 6, size: 1, defVal: 45},
				numRteDesc: {type: D_TYPE.UINT32, offset: 10, size: 1, defVal: RTE_DESCRIPTORS.length},
				// Route point descriptor meta
				pointerRtePtDesc: {type: D_TYPE.UINT32, offset: 14, size: 1, defVal: function () {
					let ptr = garminAdmMeta.fileData.dataRecordRte.dataRecord.pointerRteDesc.defVal;
					ptr += RTE_DESCRIPTORS.length * 4;
					return ptr;
				}},
				numRtePtDesc: {type: D_TYPE.UINT32, offset: 18, size: 1, defVal: RTEPT_DESCRIPTORS.length},
				// Route file meta
				pointerRtes: {type: D_TYPE.UINT32, offset: 22, size: 1, defVal: function () {
					let ptr = garminAdmMeta.fileData.dataRecordRte.dataRecord.pointerRteDesc.defVal;
					ptr += RTE_DESCRIPTORS.length * 4;
					ptr += RTEPT_DESCRIPTORS.length * 4;
					return ptr;
				}},
				numRtes: {type: D_TYPE.UINT32, offset: 26, size: 1, defVal: function (arg) {
					return arg.gpx_meta.gpx.rtes.length;
				}}
			},
			// There will be one of these for each route descriptor.
			// i.e. the length will equal rteDescriptorMeta.numDesc
			rteDescriptorTable: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: function (arg) {return arg.desc}},
				length: {type: D_TYPE.UINT16, offset: 2, size: 1, defVal: function (arg) {return arg.size}}
			},
			// There will be one of these for each route point descriptor.
			// i.e. the length will equal rtePtDescriptorMeta.numDesc
			rtePtDescriptorTable: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: function (arg) {return arg.desc}},
				length: {type: D_TYPE.UINT16, offset: 2, size: 1, defVal: function (arg) {return arg.size}}
			},
			rteTable: {
				// This all depends on the descriptorMeta.  They
				// will be a fixed length.  There will also be
				// one for each waypoint.  i.e. the length will
				// equal rteMeta.numRtes
			},
			checkSumRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.CHKSM},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: 10},
				chksum: {type: D_TYPE.UINT32, offset: 6, size: 1, defVal: function (arg) {return arg;}}
			}
		},
		dataRecordTrk: {
			mainRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.MAIN},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: function (arg) {
					if ((arg !== undefined) && (arg !== null)) {
						return arg.size - 10; // Calc file size minus 10 (checksum record)
					}
				}},
				file_type: {type: D_TYPE.UINT8, offset: 6, size: 1, defVal: SUB_FILE_TYPE.TRK},
				data_record_offset: {type: D_TYPE.UINT32, offset: 7, size: 1, defVal: 0xf},
				format_ver: {type: D_TYPE.UINT32, offset: 11, size: 1, defVal: 100},
			},
			dataRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.DATA},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: function (arg) {
					if ((arg !== undefined) && (arg !== null)) {
						return arg.size - 25; // Calc file size minus 10 (checksum record) minus 15 (main record)
					}
				}},
				// Track descriptor meta
				pointerTrkDesc: {type: D_TYPE.UINT32, offset: 6, size: 1, defVal: 45},
				numTrkDesc: {type: D_TYPE.UINT32, offset: 10, size: 1, defVal: TRK_DESCRIPTORS.length},
				// Track point descriptor meta
				pointerTrkPtDesc: {type: D_TYPE.UINT32, offset: 14, size: 1, defVal: function () {
					let ptr = garminAdmMeta.fileData.dataRecordTrk.dataRecord.pointerTrkDesc.defVal;
					ptr += TRK_DESCRIPTORS.length * 4;
					return ptr;
				}},
				numTrkPtDesc: {type: D_TYPE.UINT32, offset: 18, size: 1, defVal: TRKPT_DESCRIPTORS.length},
				// Track file meta
				pointerTrks: {type: D_TYPE.UINT32, offset: 22, size: 1, defVal: function () {
					let ptr = garminAdmMeta.fileData.dataRecordTrk.dataRecord.pointerTrkDesc.defVal;
					ptr += TRK_DESCRIPTORS.length * 4;
					ptr += TRKPT_DESCRIPTORS.length * 4;
					return ptr;
				}},
				numTrks: {type: D_TYPE.UINT32, offset: 26, size: 1, defVal: function (arg) {
					return arg.gpx_meta.gpx.trks.length;
				}}
			},
			// There will be one of these for each tracke descriptor.
			// i.e. the length will equal trkDescriptorMeta.numDesc
			trkDescriptorTable: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: function (arg) {return arg.desc}},
				length: {type: D_TYPE.UINT16, offset: 2, size: 1, defVal: function (arg) {return arg.size}}
			},
			// There will be one of these for each track point descriptor.
			// i.e. the length will equal trkPtDescriptorMeta.numDesc
			trkPtDescriptorTable: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: function (arg) {return arg.desc}},
				length: {type: D_TYPE.UINT16, offset: 2, size: 1, defVal: function (arg) {return arg.size}}
			},
			trkTable: {
				// This all depends on the descriptorMeta.  They
				// will be a fixed length.  There will also be
				// one for each waypoint.  i.e. the length will
				// equal trkMeta.numTrks
			},
			checkSumRecord: {
				type: {type: D_TYPE.UINT16, offset: 0, size: 1, defVal: RECORD_TYPE.CHKSM},
				size: {type: D_TYPE.UINT32, offset: 2, size: 1, defVal: 10},
				chksum: {type: D_TYPE.UINT32, offset: 6, size: 1, defVal: function (arg) {return arg;}}
			}
		}		
	},
	emptyControlFileSector: {
		unused1: {type: D_TYPE.UINT8, offset: 0x00, size: 1, defVal: 0x00, padVal: 0x00},
		unused2: {type: D_TYPE.UINT8, offset: 0x01, size: 511, defVal: 0xFF, padVal: 0xFF}
	},
	emptySector: {
		unused: {type: D_TYPE.UINT8, offset: 0x00, size: 512, defVal: 0xFF, padVal: 0xFF}
	}
};
/* exported GPX_G_Adm */
///////////////////////////////////////////////////////////////////////////////
/**
 * @param {GPX_File} parent
 */
///////////////////////////////////////////////////////////////////////////////
function GPX_G_Adm (parent) {
    "use strict";

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function handleFileRead () {
	/*jshint validthis: true*/
	this.readChild.parseAdm ();
	console.log ("ADM File: ", this.ctrlFile);

	this.readChild.admToGpx ();
}

///////////////////////////////////////////////////////////////////////////////
/**
 * @this {GPX_G_Adm}
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function saveFile () {
	this.parent.gpx_meta.fileToBeSaved = new Blob([this.writeChild.gpxToAdm()], {type: "application/octet-stream"});

	return true;
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
	//this.gpx_data = gpx_data;

	this.parent = parent;

	this.ctrlFile = null;
	this.sectorSize = 0;
	this.secsPerCluster = 0;
	this.fileTableStartOffset = 0;
	this.parent.gpx_meta.rawContents = null;
	this.writeChild = new GPX_G_Adm_Write (this);
	this.readChild = new GPX_G_Adm_Read (this);

    this.handleFileRead = function (file) {
		return handleFileRead.call (this, file);
	};
	this.saveFile = function () {
		return saveFile.call (this);
	};
}