var G_Y_AXIS = {
    SPEED: 0,
    DEPTH: 1,
    TEMP: 2
};

var G_X_AXIS = {
    TIME: 0,
    DIST: 1
}

// Settings configs
var DSTU = {
	KM: 0,
	MILE: 1,
	NM: 2
};

var DSTU_NAME_MAP = {
	KM : {name:"Kilometer", abbr: "km", unit:DSTU.KM, speedUnit:"kph"},
	MILE : {name:"Statue Mile", abbr: "sm", unit:DSTU.MILE, speedUnit:"mph"},
	NM : {name:"Nautical Mile", abbr: "nm", unit:DSTU.NM, speedUnit:"knots"}
};

var DPTU = {
	FT: 0,
	MTR: 1
};

var DPTU_NAME_MAP = {
	FT: {name: "Feet", abbr: "ft", unit:DPTU.FT},
	MTR: {name: "Meter", abbr: "mtr", unit:DPTU.MTR}
};

var TEMPU = {
	FAHR: 0,
	CELS: 1
};

var TEMPU_NAME_MAP = {
	FAHR: {name: "Fahrenheit", abbr: "F", unit:TEMPU.FAHR},
	CELS: {name: "Celsius", abbr: "C", unit:TEMPU.CELS}
};

var CRSRU = {
	UNIFIED: true,
	INDIV: false
};

var CRSRU_NAME_MAP = {
	UNIFIED: {name: "Unified", abbr: null, unit:CRSRU.UNIFIED},
	INDIV: {name: "Individual", abbr: null, unit:CRSRU.INDIV}
};


var GRPHXAXISU_NAME_MAP = {
	DIST: {name: "Distance", abbr: "##distUnits##", unit:G_X_AXIS.DIST},
	TIME: {name: "Time", abbr: null, unit:G_X_AXIS.TIME}
};

// End Settings configs

const D_TYPE = {
	UINT8: 1,
	UINT16: 2,
	UINT32: 4,
	INT8: 11,
	INT16: 12,
	INT32: 14,
	STRING: 21
};

const RECORD_TYPE = {
	MAIN: 0,
	CHKSM: 1,
	DATA: 2
};

const SUB_FILE_TYPE = {
	WPT: 0,
	PRX: 1,  // Not used in ADM files
	RTE: 2,
	TRK: 3
};

const RTE_DESC_FIELD_TYPES = {
	NAME: 200,
	RTEPT_CNT: 201,
	RTEPT_POINTER: 202
};

// Note that this is used for both Route point and waypoint descriptors.  On
// some systems they are the same.  However track point descriptors are
// different.
const WPT_DESC_FIELD_TYPES = {
	TYPE: 0,
	LAT: 1,
	LONG: 2,
	NAME: 20,
	NOTES: 21,
	SYM: 22,
	DISP_MODE: 23,
	DEPTH_MTRS: 24,
	TEMP_C: 25,
	TIMESTAMP: 26,
	NAME_CPY: 40,
	STREET_ADDR: 41,
	CITY: 42,
	UNKNWN1: 43,
	UNKWNN2: 44,
	UNKWNN3: 45,
	UNKWNN4: 60,
	UNKWNN5: 61,
	UNKWNN6: 62,
	NOT_IN_WPT_FILE: 63,
	UNKWNN7: 80,
	UNKWNN8: 81,
	UNKWNN9: 82,
	UNKWNN10: 83
};

const TRK_DESC_FIELD_TYPES = {
	NAME: 300,
	TRKPT_CNT: 301,
	TRK_UNKNOWN: 302,
	TRK_COLOR: 303,
	TRKPT_POINTER: 304
};

const TRK_PT_DESC_FIELD_TYPES = {
	LAT: 500,
	LONG: 501,
	TIMESTAMP: 502,
	DEPTH_MTRS: 503,
	TRK_FIRST_PT: 504,  // This might also be intended for start of a new track segment
	TEMP_C: 505
};

const PT_DISP_MODE = {
	SYM_ONLY: 1,
	SYM_AND_NAME: 3,
	SYM_AND_COMMENT: 5
};

const TRK_COLOR = {
	BLACK: 0,
	DARK_RED: 1,
	DARK_GREEN: 2,
	DARK_YELLOW: 3,
	DARK_BLUE: 4,
	DARK_MAGENTA: 5,
	DARK_CYAN: 6,
	LIGHT_GREY: 7,
	DARK_GREY: 8,
	RED: 9,
	GREEN: 10,
	YELLOW: 11,
	BLUE: 12,
	MAGENTA: 13,
	CYAN: 14,
	WHITE: 15,
	TRANSPARENT: 16
};

const NUM_FILE_ENTRY_CLUSTERS = 240;
const ADM_FILE_TYPES = {
	CTRL: 0,
	RTE: 1,
	TRK: 2,
	WPT: 3,
	NUM_ADM_FILE_TYPES: 4
};

const NUM_ADM_SUB_FILES = ADM_FILE_TYPES.NUM_ADM_FILE_TYPES;

const WPT_DESCRIPTORS = [
	{desc: WPT_DESC_FIELD_TYPES.TYPE, size: 1},
	{desc: WPT_DESC_FIELD_TYPES.LAT, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.LONG, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.NAME, size: function (arg) {return arg.wptNameMaxLen;}},
	{desc: WPT_DESC_FIELD_TYPES.NOTES, size: 0},  // TODO: If I ever support notes I will need to stop hardwiring this to 0
	{desc: WPT_DESC_FIELD_TYPES.SYM, size: 2},
	{desc: WPT_DESC_FIELD_TYPES.DISP_MODE, size: 1},
	{desc: WPT_DESC_FIELD_TYPES.DEPTH_MTRS, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.TEMP_C, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.TIMESTAMP, size: 4}
];

const RTE_DESCRIPTORS = [
	{desc: RTE_DESC_FIELD_TYPES.NAME, size: function (arg) {return arg.rteNameMaxLen;}},
	{desc: RTE_DESC_FIELD_TYPES.RTEPT_CNT, size: 4},
	{desc: RTE_DESC_FIELD_TYPES.RTEPT_POINTER, size: 4}
];

const RTEPT_DESCRIPTORS = [
	{desc: WPT_DESC_FIELD_TYPES.TYPE, size: 1},
	{desc: WPT_DESC_FIELD_TYPES.LAT, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.LONG, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.NAME, size: function (arg) {return arg.rteptNameMaxLen;}},
	{desc: WPT_DESC_FIELD_TYPES.NOTES, size: 0},  // TODO: If I ever support notes I will need to stop hardwiring this to 0
	{desc: WPT_DESC_FIELD_TYPES.SYM, size: 2},
	{desc: WPT_DESC_FIELD_TYPES.DISP_MODE, size: 1},
	{desc: WPT_DESC_FIELD_TYPES.DEPTH_MTRS, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.NAME_CPY, size: function (arg) {return arg.rteptNameMaxLen;}},
	{desc: WPT_DESC_FIELD_TYPES.STREET_ADDR, size: 0},   // TODO: If I ever support street addr I will need to stop hardwiring this to 0
	{desc: WPT_DESC_FIELD_TYPES.CITY, size: 0},   // TODO: If I ever support city I will need to stop hardwiring this to 0
	{desc: WPT_DESC_FIELD_TYPES.UNKNWN1, size: 2},
	{desc: WPT_DESC_FIELD_TYPES.UNKWNN2, size: 1},
	{desc: WPT_DESC_FIELD_TYPES.UNKWNN4, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.UNKWNN5, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.UNKWNN6, size: 8},
	{desc: WPT_DESC_FIELD_TYPES.NOT_IN_WPT_FILE, size: 1},
	{desc: WPT_DESC_FIELD_TYPES.TEMP_C, size: 4},
	{desc: WPT_DESC_FIELD_TYPES.TIMESTAMP, size: 4}
];

const TRK_DESCRIPTORS = [
	{desc: TRK_DESC_FIELD_TYPES.NAME, size: function (arg) {return arg.trkNameMaxLen;}},
	{desc: TRK_DESC_FIELD_TYPES.TRKPT_CNT, size: 2},
	{desc: TRK_DESC_FIELD_TYPES.TRK_UNKNOWN, size: 1},
	{desc: TRK_DESC_FIELD_TYPES.TRK_COLOR, size: 1},
	{desc: TRK_DESC_FIELD_TYPES.TRKPT_POINTER, size: 4}
];

const TRKPT_DESCRIPTORS = [
	{desc: TRK_PT_DESC_FIELD_TYPES.LAT, size: 4},
	{desc: TRK_PT_DESC_FIELD_TYPES.LONG, size: 4},
	{desc: TRK_PT_DESC_FIELD_TYPES.TIMESTAMP, size: 4},
	{desc: TRK_PT_DESC_FIELD_TYPES.DEPTH_MTRS, size: 4},
	{desc: TRK_PT_DESC_FIELD_TYPES.TRK_FIRST_PT, size: 1},  // This might also be intended for start of a new track segment
	{desc: TRK_PT_DESC_FIELD_TYPES.TEMP_C, size: 4}
];

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access static public
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function distBetweenWpts (units, point1_orig, point2_orig) {
	var point1 = {lat: point1_orig.lat, lon: point1_orig.lon};
	var point2 = {lat: point2_orig.lat, lon: point2_orig.lon};

	// If the lat lon of the two points match then dont bother
	// doing the calculations.  Just return 0.  Also, to avoid
	// the oddities that happen when comparing two floats for
	// equality, first make them a string then do the
	// comparison.
	var lat1_str = point1.lat+"";
	var lat2_str = point2.lat+"";
	var lon1_str = point1.lon+"";
	var lon2_str = point2.lon+"";
	if ((lat1_str === lat2_str)&&(lon1_str === lon2_str)) {
		return 0.0;
	}

	// The math module contains a function
	// named toRadians which converts from
	// degrees to radians.
	point1.lon = point1.lon * Math.PI / 180;
	point2.lon = point2.lon * Math.PI / 180;
	point1.lat = point1.lat * Math.PI / 180;
	point2.lat = point2.lat * Math.PI / 180;

	// Haversine formula
	var dlon = point2.lon - point1.lon;
	var dlat = point2.lat - point1.lat;
	var a = Math.pow(Math.sin(dlat / 2), 2) +
			Math.cos(point1.lat) *
			Math.cos(point2.lat) *
			Math.pow(Math.sin(dlon / 2),2);
	var c = 2 * Math.asin(Math.sqrt(a));

	// Default the radius of earth to kilometers.
	var r = 6371.0000;
	if (units === DSTU.MILE) {
		r = 3958.7560;
	}
	if (units === DSTU.NM) {
		r = 3440.065;
	}

	// calculate the result
	return(c * r);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getADMSymNumFromName (name) {
	var sym_meta=icon_meta[name];
	var admSymNum = 18; // Default to Waypoint

	if ((sym_meta !== undefined)&&(sym_meta !== null)&&
		(name !== undefined)&&(name !== null)) {
		admSymNum = sym_meta.admNum;
	}

	return admSymNum;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getSymNameFromADMSymNum (num) {
	var symName = "Waypoint";  // Default to Waypoint

	for (const key in icon_meta) {
		if (icon_meta[key].admNum === num) {
			symName = key;
			break;
		}
	}

	return symName;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function getKeyNameForVal (obj, val) {
	var keyName = null;

	for (const key in obj) {
		if (obj[key] === val) {
			keyName = key;
			break;
		}
	}
	
	return keyName;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function mapUnitToLatLong (map_unit) {
	return map_unit * (360.0/Math.pow(2, 32));
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function uint32ToFloat (val) {
	const floatView = new DataView(val.buffer);
	var float_val = floatView.getFloat32(0, true);

	// Garmin views 1.0e25 as "No value given".  Due to float inaccuracy
	// I compare against 1e24 instead
	if (float_val > 1e+24) {
		float_val = null;
	}

	return float_val;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function latLongToMapUnit (lat_long) {
	return lat_long * (Math.pow(2, 32)/360.0);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function floatToUint32 (val) {
	const buffer = new ArrayBuffer(4);
	const uint32View = new DataView(buffer);

	if ((val === undefined) || (val === null)) {
		uint32View.setFloat32 (0, 1e+25, true);
	}
	else {
		uint32View.setFloat32 (0, val, true);
	}

	return uint32View.getUint32(0, true);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function timestampToUint32 (val) {
	// Garmin uses a Unix type timestamp but with the epoch time set
	// to 31-Dec-1989
	var epochTime = new Date ("1989-12-31T00:00:00Z");
	var convTime = null;
	// If val is undefined or null use "now"
	if ((val === undefined)||(val===null)) {
		convTime = new Date ();
	}
	else {
		convTime = new Date (val);
	}
	var buffer = new ArrayBuffer(4);
	var uint32View = new Uint32Array(buffer);

	uint32View[0] = (convTime.getTime()-epochTime.getTime())/1000;

	return uint32View[0];
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function uint32ToTimestamp (val) {
	// Garmin uses a Unix type timestamp but with the epoch time set
	// to 31-Dec-1989
	var epochTime = new Date ("1989-12-31T00:00:00Z");
	var convTime = new Date ();
	convTime.setTime(epochTime.getTime()+(val*1000));
	return getIso8601UTCDate (convTime); 
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function numToArrayOfBytes (type, num) {
	// TODO: This function is broken and needs to be reworked but 
	// at this time (28-Oct-2025) this function is not used anywhere 
	// so I haven't bothered doing anything about it.
	var bytesInData = type<10?type:type-10;
	var byteArray = new Array (bytesInData);

	// Tell jshint to ignore bytewise operators
	// jshint -W016
    for (var index=0; index<bytesInData; index++) {
        var byte = num & 0xff;
        byteArray[index] = byte;
        num = num >> 8 ; // shift right 8 bits
    }
	// jshint +W016

    return byteArray;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function setOutputArrayByType (type, data, data_cnt, padVal) {
	var bytesPerData = type<10?type:(type<20?type-10:type-20);
	var bytes = data_cnt*bytesPerData;
	var returnByteArray = new Uint8Array(bytes);
	var returnArrayView = null; // Only used for non-uint8 views
	var isDataAnArray = Array.isArray(data);

	if ((padVal === undefined)||(padVal === null)) {
		padVal = 0x00;
	}
	returnByteArray.fill (padVal);

	// data_cnt means something different for strings.  It is the reserved
	// space for the string and not the length of the string.  For example
	// each waypoint name is alotted 10 bytes and uses those 10 bytes 
	// regardless of the length of the waypoint name.  The unused slots
	// are filled with the padVal
	var numData = data_cnt;
	if ((typeof data === "string")||(isDataAnArray)) {
		numData = data.length;
	}

	switch (type) {
	case D_TYPE.UINT8:
		returnArrayView = returnByteArray;
		break;
	case D_TYPE.UINT16:
		returnArrayView = new Uint16Array (returnByteArray.buffer);
		break;
	case D_TYPE.UINT32:
		returnArrayView = new Uint32Array (returnByteArray.buffer);
		break;
	case D_TYPE.INT8:
		returnArrayView = new Int8Array (returnByteArray.buffer);
		break;
	case D_TYPE.INT16:
		returnArrayView = new Int16Array (returnByteArray.buffer);
		break;
	case D_TYPE.INT32:
		returnArrayView = new Int32Array (returnByteArray.buffer);
		break;
		/*if (isDataAnArray) {
			dataArray = numToArrayOfBytes (type, data[i]);
		}
		else {
			dataArray = numToArrayOfBytes (type, data);
		}
		let dataArrayIndex=0;
		for (let returnArrayIndex=i*bytesPerData; returnArrayIndex<(i*bytesPerData)+bytesPerData; returnArrayIndex++) {
			returnArray[returnArrayIndex] = dataArray[dataArrayIndex];
			dataArrayIndex++;
		}
		break;*/
	case D_TYPE.STRING:
		returnArrayView = returnByteArray;
		break;
	}
	for (var i=0; i<numData; i++) {
		if (type === D_TYPE.STRING) {
			returnArrayView[i] = data.charCodeAt(i);
		}
		else {
			if (isDataAnArray) {
				returnArrayView[i] = data[i];
			}
			else {
				returnArrayView[i] = data;
			}
		}
	}

	return {size: bytes, buff: returnByteArray};
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * @returns {any}
 */
///////////////////////////////////////////////////////////////////////////////
function viewTypedArray (type, buffer, byteOffset, data_cnt, return_1_as_array) {
	var bytes = data_cnt*(type<10?type:type-10);
	let deRefBuffer = null;
	if (buffer instanceof ArrayBuffer) {
		deRefBuffer = buffer;
	}
	else {
		deRefBuffer = buffer.buffer;
	}
	const viewBuff = new Uint8Array (deRefBuffer, byteOffset, bytes);
	const trimmedViewBuff = new Uint8Array (viewBuff);
	var retBuffer = null;

	switch (type) {
	case D_TYPE.UINT8:
		retBuffer = new Uint8Array (trimmedViewBuff.buffer);
		break;
	case D_TYPE.UINT16:
		retBuffer = new Uint16Array (trimmedViewBuff.buffer);
		break;
	case D_TYPE.UINT32:
		retBuffer = new Uint32Array (trimmedViewBuff.buffer);
		break;
	case D_TYPE.INT8:
		retBuffer = new Int8Array (trimmedViewBuff.buffer);
		break;
	case D_TYPE.INT16:
		retBuffer = new Int16Array (trimmedViewBuff.buffer);
		break;
	case D_TYPE.INT32:
		retBuffer = new Int32Array (trimmedViewBuff.buffer);
		break;
	}
	if ((data_cnt === 1)&&
		((return_1_as_array === undefined)||(return_1_as_array === null)||(return_1_as_array === false))) { 
		return retBuffer[0];
	}
	else {
		return retBuffer;
	}
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function viewTypedArrayToStr (buffer, byteOffset, data_cnt) {
	var unTrimmedChars = viewTypedArray (D_TYPE.UINT8, buffer, byteOffset, data_cnt);
	var trimmedChars = null;
	var trimCnt=0;

	for (trimCnt=0; trimCnt<unTrimmedChars.length; trimCnt++) {
		// Even though I trim all non-printable chars, the ADM file usually uses
		// 0x00 for the pad bytes.  For example; waypoint names are 10 bytes
		// long and if a waypoint had a name AABBCCDD it would be represented in
		// the ADM file as a 10 byte array containing:
		// 0x41, 0x41, 0x42, 0x42, 0x43, 0x43, 0x44, 0x44, 0x00, 0x00
		if ((unTrimmedChars[trimCnt] <= ' ')||(unTrimmedChars[trimCnt] >= '~')) {
			break;
		}
	}

	if (trimCnt === unTrimmedChars.length) {
		trimmedChars = unTrimmedChars;
	}
	else {
		trimmedChars = viewTypedArray (D_TYPE.UINT8, unTrimmedChars.buffer, 0, trimCnt);
	}

	return new TextDecoder().decode(trimmedChars);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function convertNmForDistanceUnits (val, setting) {
	let retVal;

	switch (setting.unit) {
	case DSTU.KM:
		retVal = val*1.852;
		break;
	case DSTU.MILE:
		retVal = val*1.15078;
		break;
	case DSTU.NM:
	default:
		// Do nothing as the val should already be nautical miles
		retVal = val;
		break;
	}

	return retVal;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function convertCForTempUnits (val, setting) {
	let retVal;

	switch (setting.unit) {
	case TEMPU.FAHR:
		retVal = (val*9.0/5.0)+32;
		break;
	case TEMPU.CELS:
	default:
		// Do nothing as the val should already be celsius
		retVal = val;
		break;
	}

	return retVal;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function convertMtrForDepthUnits (val, setting) {
	let retVal;

	switch (setting.unit) {
	case DPTU.FT:
		retVal = val*3.2808;
		break;
	case DPTU.MTR:
	default:
		// Do nothing as the val should already be meters
		retVal = val;
		break;
	}

	return retVal;
}

