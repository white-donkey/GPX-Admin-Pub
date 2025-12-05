var aisTrk21Keys= {
    "long" : "attrs.lon",
    "lat" : "attrs.lat",
    "speed_kts_X10" : "sog_rpt",
    "heading1" : "NA",
    "heading2" : "NA",
    "converted_timestamp_utc" : "NA",
    "timestamp": "time",
    "rx_src" : "src",
    "unknown1" : "NA",
    "unknown2" : "NA",
    "unknown3" : "NA",
    "unknown4" : "NA",
    "unknown5" : "NA",
    "unknown6" : "NA",
    "unknown7" : "NA",
    "unknown8" : "NA",
    "unknown9" : "NA",
    "unknown10" : "NA",
    "unknown11" : "NA",
    "unknown12" : "NA",
    "unknown13" : "NA"
};

var aisTrk24Keys= {
    "long" : "attrs.lon",
    "lat" : "attrs.lat",
    "speed_kts_X10" : "sog_rpt",
    "heading1" : "NA",
    "heading2" : "NA",
    "converted_timestamp_utc" : "NA",
    "timestamp": "time",
    "rx_src" : "src",
    "unknown1" : "NA",
    "unknown2" : "NA",
    "unknown3" : "NA",
    "unknown4" : "NA",
    "unknown5" : "NA",
    "unknown6" : "NA",
    "unknown7" : "NA",
    "unknown8" : "NA",
    "unknown9" : "NA",
    "unknown10" : "NA",
    "unknown11" : "NA",
    "unknown12" : "NA",
    "unknown13" : "NA",
    "unknown14" : "NA",
    "unknown15" : "NA",
	"unknown16" : "NA"
};

/*
With example vals
var aisTrk24Keys= {
    "long" : "-70.601067",
    "lat" : "41.744686",
    "speed_kts_X10" : "79",
    "heading1" : "76",
    "heading2" : "76",
    "converted_timestamp_utc" : "2025-07-21 16:43:37",
    "timestamp": 1753116217,
    "rx_src" : "Roaming",
    "unknown1" : "-1",
    "unknown2" : "",
    "unknown3" : "",
    "unknown4" : "",
    "unknown5" : "",
    "unknown6" : "",
    "unknown7" : "",
    "unknown8" : "",
    "unknown9" : "",
    "unknown10" : "",
    "unknown11" : "",
	"unknown12" : "",
    "unknown13" : "",
    "unknown14" : "",
    "unknown15" : "",
	"unknown16" : ""
};
*/

var supportedAisTrkKeys=[aisTrk24Keys, aisTrk21Keys];
var numSupportedKeys = [];

supportedAisTrkKeys.forEach (function (k, i) {
	numSupportedKeys[i] = Object.keys(k).length;
});
