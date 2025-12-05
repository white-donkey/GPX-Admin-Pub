///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function GPX_Wpt (name,lat,lon,time,sym,depth_mtrs,temp_c) {
    if ((lat !== undefined)&&(lat !== null) && 
        (lon !== undefined)&&(lon !== null)) {
        this.attrs = {
            "lat": lat.toString(),
            "lon": lon.toString()
        };
    }
    else {
        this.attrs = {};
    }
    if ((name !== undefined) && (name !== null) && (name.trim() !== "")) {
        this.name = name;
    }
    if ((sym !== undefined) && (sym !== null) && (sym.trim() !== "")) {
        this.sym = sym;
    }
    if ((time !== undefined) && (time !== null) && (time.trim() !== "")) {
        this.time = time;
    }
	if ((depth_mtrs !== undefined) && (depth_mtrs !== null)) {
        this.depth_mtrs = depth_mtrs;
    }
	if ((temp_c !== undefined) && (temp_c !== null)) {
		this.temp_c = temp_c;
	}

	// TODO: Add depth and possibly temp these are used by route points and track points
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
function GPX_Rte (name) {
    this.attrs = {};
    if ((name !== undefined) && (name !== null) && (name.trim() !== "")) {
        this.name = name;
    }
    this.rtepts = [];

    let thiis = this;
    this.addRtePt = function (rtept) {
        thiis.rtepts.push (rtept);
        return rtept;
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
function GPX_Trk (name) {
    this.attrs = {};
    if ((name !== undefined) && (name !== null) && (name.trim() !== "")) {
        this.name = name;
    }
    this.trksegs = [];

    let thiis = this;
    this.addTrkSeg = function (trkseg) {
        thiis.trksegs.push (trkseg);
        return trkseg;
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
function GPX_TrkSeg () {
    this.attrs = {};
    this.trkpts = [];

    let thiis = this;
    this.addTrkPt = function (trkpt) {
        thiis.trkpts.push (trkpt);
        return trkpt;
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
function GPX_Data () {


///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Data}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function postProcessTrackSOG () {
	/*jshint validthis: true*/

	this.trks.forEach (function (trk) {
		var last_pos = null;
		trk.trksegs.forEach (function (seg) {
			var spdMetersPerSec = 0.0;
			let total_dist_mtrs = 0;
			seg.trkpts.forEach (function (trkpt) {
				// This is a navionics specific extension that we can use for speed
				let dist_mtrs = 0;
				// We need to calculate based on time and distance
				if (last_pos !== null) {
					var time_delta_sec = 0.0;
					//dist_mtrs = distBetweenWpts (DSTU.KM, last_pos, {lon: trkpt.attrs.lon, lat: trkpt.attrs.lat})*1000.00;
					if ((trkpt.extensions !== undefined)&&(trkpt.extensions.navionics_speed !== undefined)) {
						spdMetersPerSec = parseFloat (trkpt.extensions.navionics_speed);
					}
					else {
						if ((trkpt.time !== undefined)&&(last_pos.time !== undefined)) {
							var last_pos_time = new Date (last_pos.time);
							var trkpt_time = new Date (trkpt.time);
							time_delta_sec = (trkpt_time.getTime()-last_pos_time.getTime())/1000.0;
							// Use a three second average.
							if (time_delta_sec >= 3.0) {
								dist_mtrs = distBetweenWpts (DSTU.KM, last_pos, {lon: trkpt.attrs.lon, lat: trkpt.attrs.lat})*1000.00;
								total_dist_mtrs += dist_mtrs;
								spdMetersPerSec = dist_mtrs/time_delta_sec;
								last_pos.lat = trkpt.attrs.lat;
								last_pos.lon = trkpt.attrs.lon;
								last_pos.time = trkpt.time;
							}
						}
					}
				}
				else {
					if ((trkpt.extensions !== undefined)&&(trkpt.extensions.navionics_speed !== undefined)) {
						spdMetersPerSec = parseFloat (trkpt.extensions.navionics_speed);
					}
					last_pos = {lat:0,lon:0,time:0};
					last_pos.lat = trkpt.attrs.lat;
					last_pos.lon = trkpt.attrs.lon;
					last_pos.time = trkpt.time;
				}
				// Convert mtrs/sec to Knots (note: 1852 is the number of meters per nautical mile)
				var spdKnots = (spdMetersPerSec*60.0*60.0)/1852.0;
				var distNm = dist_mtrs/1852.0;
				var totalDistNm = total_dist_mtrs/1852.0;

				trkpt.sog_fmt = ""+(spdKnots.toFixed(2));
				trkpt.dist_fmt = ""+(distNm.toFixed(2));
				trkpt.dist_cumu_fmt = ""+(totalDistNm.toFixed(2));
			});
		});
	});
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Data}
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function postProcessAllRouteDistances () {
	/*jshint validthis: true*/

	this.rtes.forEach (function (rte) {
		postProcessRouteDistance (rte);
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
function postProcessRouteDistance (rte) {
	var last_pos = null;
	var total_dist = 0;
	rte.rtepts.forEach (function (rtept) {
		var dist_nm = 0;
		if (last_pos !== null) {
			dist_nm = distBetweenWpts (DSTU.NM, last_pos, {lon: rtept.attrs.lon, lat: rtept.attrs.lat});
			last_pos.lat = rtept.attrs.lat;
			last_pos.lon = rtept.attrs.lon;
		}
		else {
			last_pos = {lat:0,lon:0};
			last_pos.lat = rtept.attrs.lat;
			last_pos.lon = rtept.attrs.lon;
		}
		total_dist += dist_nm;
		rtept.dist_fmt = ""+(dist_nm.toFixed(2));
		rtept.dist_cumu_fmt = ""+(total_dist.toFixed(2));
	});
	rte.total_dist_fmt = ""+(total_dist.toFixed(2));
}

	this.attrs = {
		"xmlns": "http://www.topografix.com/GPX/1/1",
		"xmlns:gpxx": "http://www.garmin.com/xmlschemas/GpxExtensions/v3",
		"xmlns:wptx1": "http://www.garmin.com/xmlschemas/WaypointExtension/v1",
		"xmlns:gpxtpx": "http://www.garmin.com/xmlschemas/TrackPointExtension/v1",
		"xmlns:uuidx": "http://www.garmin.com/xmlschemas/IdentifierExtension/v1",
		"xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
		creator: "GPX-Admin",
		version: "1.1",
		"xsi:schemaLocation": "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www8.garmin.com/xmlschemas/WaypointExtensionv1.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.garmin.com/xmlschemas/IdentifierExtension/v1 http://www.garmin.com/xmlschemas/IdentifierExtension.xsd"
	};
	this.metadata= {
		links: [{
			text: "Marblehead Sailor",
			attrs: {
				href: "http://www.marbleheadsailor.com"
			}
		}],
		time: getCurrIso8601UTCDate(),
		attrs: {}
	};
    this.wpts = [];
	this.rtes = [];
	this.trks = [];

    let thiis = this;
    this.addWpt = function (wpt) {
        thiis.wpts.push (wpt);
        return wpt;
    };
    this.addRte = function (rte) {
        thiis.rtes.push (rte);
        return rte;
    };
    this.addTrk = function (trk) {
        thiis.trks.push (trk);
        return trk;
    };

    this.postProcessTrackSOG = function () {
		return postProcessTrackSOG.call (this);
	};
	this.postProcessAllRouteDistances = function () {
		return postProcessAllRouteDistances.call (this);
	};

}