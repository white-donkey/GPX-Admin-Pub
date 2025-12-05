function GPX_Tab (file) {
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
function renderDegMin (val) {
	var ret_val = "";
	var deg;
	var min;

	var split_val = val.split(".");
	deg = split_val[0];
	// @ts-ignore The left side of the arithmetic operation IS of type 'any'
	min = ("0."+split_val[1])*60;
	ret_val = deg+"\u00B0 "+min.toFixed(2)+"\'";

	return ret_val;
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
function renderWaypointSym (sym, icon_meta) {
	/*jshint multistr: true */
	var ret_val;
	
	if ((sym === undefined)||(sym === null)||(sym.trim() === "")) {
		ret_val = "&lt;none&gt;";
	}
	else {
		if ((icon_meta !== undefined)&&(icon_meta !== null)) {
			var split_fn = icon_meta.file.split("_");
			split_fn = split_fn[1].split ("-");
			var first_icon_num_in_file = parseInt(split_fn[0]);
			var icon_top = (Math.trunc((icon_meta.num-first_icon_num_in_file)/8))*35;
			var icon_left = ((icon_meta.num-first_icon_num_in_file)%8)*35;
			ret_val = " <div style='width: 32px;height: 32px;overflow:hidden;position:relative;'> \
						<img style='position:absolute;top: -"+icon_top+"px;left: -"+icon_left+"px;margin: auto;background-color: hsl(0, 0%, 90%);transition: background-color 300ms;' src='./resources/"+icon_meta.file+"'> \
						</div>";
		}
		else {
			ret_val = sym;
		}
	}

	return ret_val;
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
function renderTimestamp (ts) {
	var ts_date = new Date (ts);
	var MONTH_STR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var DAY_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var ret_val = "";

	ret_val += (DAY_OF_WEEK[ts_date.getDay()]+", ");
	ret_val += (ts_date.getDate()+"-"+MONTH_STR[ts_date.getMonth()]+"-"+ts_date.getFullYear()+"; ");
	var hour = ts_date.getHours();
	var ampm = "AM";
	if (hour === 0) {
		hour = 12;
	}
	else if (hour > 12) {
		ampm = "PM";
		hour = hour - 12;
	}
	ret_val += (("0"+hour).slice(-2)+":"+("0"+ts_date.getMinutes()).slice(-2)+":"+("0"+ts_date.getSeconds()).slice(-2)+" "+ampm);

	return ret_val;
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
function findMatchingWaypoint (wpt, wptList) {
	var MATCH_RADIUS = 50.0; // Meters
	var matchedWaypoint = null;

	var waypoint = {lon: wpt.attrs.lon, lat: wpt.attrs.lat};
	for (var i=0; i<wptList.length; i++) {
		var delta = distBetweenWpts (DSTU.KM, waypoint, {lon: wptList[i].attrs.lon, lat: wptList[i].attrs.lat})*1000.0;
		if (delta <= MATCH_RADIUS) {
			matchedWaypoint = deepObjectCopy (wptList[i], INTERNAL_IGNORE_NODES);
			break;
		}
	}

	return matchedWaypoint;
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
function renderWaypointTable (id, panel_parent, wpts, showSpeed, showTimestamp, showDistance, showWptMatch, showDepth, showTemp) {
	/*jshint validthis: true*/
	let retObject = {
		tableDiv: null,
		matchedWptsAvailable: false,
		matchedWpts: []
	};
	let thiis = this;
	let table_div;
	let disp_table;
	let disp_head;
	let disp_row;
	let disp_cell;
	let panel = null;

	let depthUnitSetting = gpxAdminInstance.settings.getSetting ("depthUnits");
    let tempUnitSetting = gpxAdminInstance.settings.getSetting ("tempUnits");
    let distUnitSetting = gpxAdminInstance.settings.getSetting ("distUnits");

	if (this.useCollapsiblePanels) {
		panel = panel_parent.getPanelContentDiv();
	}
	else {
		panel = panel_parent;
	}
	var showReportedSpeed = (wpts[0].sog_rpt !== undefined);

	let maxHeight = calculateAvailableHeightAndWidth (panel).height;
	table_div = addNodeToDOM("div", panel, id, "fixTableHead", "max-height:"+maxHeight+"px;display:inline-block");

	disp_table = addNodeToDOM ("table", table_div, null, null, null);
	// Add header to table
	disp_head = addNodeToDOM("thead", disp_table, null, null, null);
	disp_row = addNodeToDOM ("tr", disp_head, null, null, null);
	disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
	disp_cell.innerText = "Name";
	disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
	disp_cell.innerText = "Latitude";
	disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
	disp_cell.innerText = "Longitude";
	disp_cell = addNodeToDOM ("th", disp_row, null, null, "z-index:1;"); // Set this to a z-index of 1.  Otherwise when you scroll an icon by it shows above the header block
	disp_cell.innerText = "Symbol";
	if (showSpeed) {
		if (showReportedSpeed) {
			disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
			disp_cell.innerText = "Reported Speed ("+distUnitSetting.speedUnit+")";
		}
		disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
		disp_cell.innerText = "Speed ("+distUnitSetting.speedUnit+")";
	}
	if (showDistance) {
		disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
		disp_cell.innerText = "Distance ("+distUnitSetting.abbr+")";
	}
	if (showDepth) {
		disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
		disp_cell.innerText = "Depth ("+depthUnitSetting.abbr+")";
	}
	if (showTemp) {
		disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
		disp_cell.innerText = "Water Temp ("+tempUnitSetting.abbr+")";
	}
	if ((showWptMatch !== undefined)&&(showWptMatch !== null)) {
		disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
		disp_cell.innerText = "Match Name";
		disp_cell = addNodeToDOM ("th", disp_row, null, null, null);
		disp_cell.innerText = "Delta (Meters)";
	}
	// Add results
	retObject.tableDiv = table_div;
	wpts.forEach (function (wpt, wpt_index) {
		disp_row = addNodeToDOM ("tr", disp_table, null, null, null);
		disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
		var wpt_name = ((wpt.name!==undefined)&&(wpt.name.trim()!==""))?wpt.name:"<Wpt "+(wpt_index+1)+">";
		if (showTimestamp) {
			wpt_name += " ("+renderTimestamp(wpt.time)+")";
		}
		disp_cell.innerText = wpt_name;
		disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
		disp_cell.innerText = renderDegMin (wpt.attrs.lat);
		disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
		disp_cell.innerText = renderDegMin (wpt.attrs.lon);
		disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
		disp_cell.innerHTML = renderWaypointSym (wpt.sym, icon_meta[wpt.sym]);
		if (showSpeed) {
			if (showReportedSpeed) {
				disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
				if ((wpt.sog_rpt !== undefined)&&(wpt.sog_rpt !== null)) {
					disp_cell.innerText = convertNmForDistanceUnits (wpt.sog_rpt/10.0, distUnitSetting);
				}
				else {
					disp_cell.innerText = "?";
				}
			}
			disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
			disp_cell.innerText = convertNmForDistanceUnits (wpt.sog_fmt, distUnitSetting);
		}
		if (showDistance) {
			disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
			disp_cell.innerText = convertNmForDistanceUnits (wpt.dist_fmt, distUnitSetting)+" ("+convertNmForDistanceUnits (wpt.dist_cumu_fmt, distUnitSetting)+")";
		}
		if (showDepth) {
			disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
			if ((wpt.depth_mtrs !== undefined) && (wpt.depth_mtrs !== null)) {
				disp_cell.innerText = convertMtrForDepthUnits (wpt.depth_mtrs, depthUnitSetting).toFixed(2);
			}
			else {
				disp_cell.innerText = "N/A";
			}
		}
		if (showTemp) {
			disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
			if ((wpt.temp_c !== undefined) && (wpt.temp_c !== null)) {
				disp_cell.innerText = convertCForTempUnits (wpt.temp_c, tempUnitSetting).toFixed(2);
			}
			else {
				disp_cell.innerText = "N/A";
			}
		}
		if ((showWptMatch !== undefined)&&(showWptMatch !== null)) {
			var matchWpt = findMatchingWaypoint (wpt, showWptMatch);
			if (matchWpt !== null) {
				var dist_meters = distBetweenWpts (DSTU.KM, {lon: matchWpt.attrs.lon, lat: matchWpt.attrs.lat}, {lon: wpt.attrs.lon, lat: wpt.attrs.lat})*1000.0;
				if ((wpt.name===undefined)||(wpt.name.trim()==="")) {
					// Mark this table as possibly needing update
					retObject.matchedWptsAvailable = true;
					// Use matched point
					var cpyWpt = {
						attrs: {
							lat: matchWpt.attrs.lat,
							lon: matchWpt.attrs.lon
						},
						time:matchWpt.time,
						name: matchWpt.name.trim(),
						sym: matchWpt.sym.trim()
					};
					retObject.matchedWpts.push (cpyWpt);
				}
				else {
					// Use existing point
					retObject.matchedWpts.push (wpt);
				}
				disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
				disp_cell.innerText = matchWpt.name;
				disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
				disp_cell.innerText = dist_meters.toFixed(2);
			}
			else {
				// Use existing point
				retObject.matchedWpts.push (wpt);
				disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
				disp_cell.innerText = "<None>";
				disp_cell = addNodeToDOM ("td", disp_row, null, null, "text-align:left;");
				disp_cell.innerText = "<?>";
			}
		}
	});

	return retObject;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function drawWaypointsPanel (gpx_meta) {
	/*jshint validthis: true*/
	var thiis = this;

	// Render control panel title
	if ((gpx_meta.gpx.wpts !== undefined)&&(gpx_meta.gpx.wpts !== null)&&(gpx_meta.gpx.wpts.length !== 0)) {
		// Render control panel title
		gpx_meta.wpt_panel = collapsible_panel.createPanel (gpx_meta.tab_container, function (opened) {
			gpx_meta.wptsPanelOpened = opened;
			thiis.setPanelMaxHeights (gpx_meta);
		});
		gpx_meta.wpt_panel.setPanelTitle ("Waypoints (count="+gpx_meta.gpx.wpts.length+")");

		// Render waypoint table
		var wptTableObject = this.renderWaypointTable (gpx_meta.fileId+"_wpt_table", gpx_meta.wpt_panel, gpx_meta.gpx.wpts, false, false, false, null, false, false);
		gpx_meta.wpts_table_div = wptTableObject.tableDiv;
	}
}
///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function drawRoutesPanel (gpx_meta) {
	/*jshint validthis: true*/
	var thiis = this;

	if ((gpx_meta.gpx.rtes !== undefined)&&(gpx_meta.gpx.rtes !== null)&&(gpx_meta.gpx.rtes.length !== 0)) {
		gpx_meta.rte_panel = collapsible_panel.createPanel (gpx_meta.tab_container, function (opened) {
			gpx_meta.rtesPanelOpened = opened;
			thiis.setPanelMaxHeights (gpx_meta);
		});
		gpx_meta.rte_panel.setPanelTitle ("Routes (count="+gpx_meta.gpx.rtes.length+")");

		// Render routes table
		gpx_meta.rtes_list_div = addNodeToDOM("div", gpx_meta.rte_panel.getPanelContentDiv(), gpx_meta.fileId+"_rte_list", null, "overflow: auto; max-height:150px;");

		gpx_meta.rtes_table_panel = [];
		gpx_meta.rtes_table_div = [];
		gpx_meta.gpx.rtes.forEach (function (route, rte_index) {
			gpx_meta.rtes_table_panel.push (collapsible_panel.createSubPanel (gpx_meta.rtes_list_div, function (opened) {
				gpx_meta.rtes_table_panel[rte_index].panelOpened = opened;
				//thiis.setPanelMaxHeights (gpx_meta);
			}));

			// Render waypoint table
			var rteTableObject = thiis.renderWaypointTable (gpx_meta.fileId+"_rtept_table_"+rte_index, gpx_meta.rtes_table_panel[rte_index], route.rtepts, false, false, true, gpx_meta.gpx.wpts, false, false);
			gpx_meta.rtes_table_div.push (rteTableObject.tableDiv);

			gpx_meta.rtes_table_panel[rte_index].setPanelTitle (route.name+" (Total Dist.="+route.total_dist_fmt+" NM)");

			if (rteTableObject.matchedWptsAvailable) {
				gpx_meta.rtes_table_panel[rte_index].setPanelTitleTextColor ("darkred");
				gpx_meta.rtes_table_panel[rte_index].addButtonToPanelTitleBar ("Use matched waypoints", function(){
					route.rtepts = rteTableObject.matchedWpts;
					gpx_meta.gpx.postProcessRouteDistance (route);
					removeAllChildElements(rteTableObject.tableDiv);
					gpx_meta.rtes_table_panel[rte_index].getPanelContentDiv().removeChild(rteTableObject.tableDiv);
					rteTableObject = thiis.renderWaypointTable (gpx_meta.fileId+"_rtept_table_"+rte_index, gpx_meta.rtes_table_panel[rte_index], route.rtepts, false, false, true, gpx_meta.gpx.wpts, false, false);
					gpx_meta.rtes_table_panel[rte_index].setPanelTitleTextColor ("white");
					gpx_meta.rtes_table_panel[rte_index].removeButtonfromPanelTitleBar ();
					event.stopPropagation();
				});
			}
		});
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function drawTracksPanel (gpx_meta) {
	/*jshint validthis: true*/
	var thiis = this;

	if ((gpx_meta.gpx.trks !== undefined)&&(gpx_meta.gpx.trks !== null)&&(gpx_meta.gpx.trks.length !== 0)) {
		gpx_meta.trk_panel = collapsible_panel.createPanel (gpx_meta.tab_container, function (opened) {
			gpx_meta.trksPanelOpened = opened;
			thiis.setPanelMaxHeights (gpx_meta);
		});
		gpx_meta.trk_panel.setPanelTitle ("Tracks (count="+gpx_meta.gpx.trks.length+")");

		// Render tracks table
		gpx_meta.trks_list_div = addNodeToDOM("div", gpx_meta.trk_panel.getPanelContentDiv(), gpx_meta.fileId+"_trk_list", null, "overflow: auto; max-height:150px;");

		gpx_meta.trks_table_panel = [];
		gpx_meta.trks_table_div = [];
		gpx_meta.trks_speed_graph_div = [];
		gpx_meta.gpx.trks.forEach (function (track, trk_index) {
			gpx_meta.trks_table_panel.push (collapsible_panel.createSubPanel (gpx_meta.trks_list_div, function (opened) {
				gpx_meta.trks_table_panel[trk_index].panelOpened = opened;
				//thiis.setPanelMaxHeights (gpx_meta);
			}));
			gpx_meta.trks_table_panel[trk_index].setPanelTitle (track.name);

			// Render waypoint table
			let all_trkpts = [];
			track.trksegs.forEach (function (seg){
				all_trkpts = all_trkpts.concat (seg.trkpts);
			});
			var trkTableObject = thiis.renderWaypointTable (gpx_meta.fileId+"_trkpt_table_"+trk_index, gpx_meta.trks_table_panel[trk_index], all_trkpts, true, true, true, null, true, true);
			gpx_meta.trks_table_div.push (trkTableObject.tableDiv);
			var speedGraphDivId = gpx_meta.fileId+"_trk_"+trk_index+"_speed_graph_div";
			gpx_meta.trks_speed_graph_div.push (addNodeToDOM("div", gpx_meta.trks_table_panel[trk_index].getPanelContentDiv(), speedGraphDivId, null, "overflow: hidden; height:450px;display:inline-block;vertical-align:top;"));
			//renderGraph (all_trkpts, speedGraphDivId, GT.SPEED_VS_TIME);
		});
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function displayGPX () {
	/*jshint validthis: true*/
	let thiis = this;
    let gpx_meta = this.file.gpx_meta;

	if (this.useCollapsiblePanels) {
		gpx_meta.tab_container.innerHTML =
			"<div class=\"file-info-area\">Source: "+gpx_meta.gpx.attrs.creator+
			"; GPX Version: "+gpx_meta.gpx.attrs.version+
			"; Size in bytes: "+gpx_meta.fileSize+
			"<input id=\""+gpx_meta.fileId+"_save_file_button\" class=\"gpx_button\"type=\"button\" value=\"Save as file\" style=\"margin: 0px 0px 0px 5px;\">"+
			"</div>";

		this.drawWaypointsPanel (gpx_meta);
		gpx_meta.wptsPanelOpened = false;

		this.drawRoutesPanel (gpx_meta);
		gpx_meta.rtesPanelOpened = false;

		this.drawTracksPanel (gpx_meta);
		gpx_meta.trksPanelOpened = false;

		this.setPanelMaxHeights (gpx_meta);
	}
	else {
		this.sideMenu = new Side_Panel (gpx_meta.tab_container);
		this.tableContainer = addNodeToDOM ("div", this.sideMenu.dataContainer, gpx_meta.fileId+"_data_area_table_area", null, "display:block; padding-top:10px;");

		this.saveFileIcon = this.sideMenu.addControlButton (floppyDiscSVGIcon, "Save", gpx_meta.fileId+"_save_file_icon", function () {
        	thiis.file.queryFileSaveType();
    	});

		this.graphIcon = this.sideMenu.addControlButton (lineGraphSVGIcon, "Graph", gpx_meta.fileId+"_graphing_icon", function () {
        	//thiis.file.queryFileSaveType();
			thiis.openGraphDialog ();
    	});

		/*
		Uncomment this once I enable it.
		this.chartingIcon = this.sideMenu.addControlButton (globeSVGIcon, "Chart", gpx_meta.fileId+"_charting_icon", function () {
        	//thiis.file.queryFileSaveType();
    	});
		*/

		this.rightInfoDiv = addNodeToDOM ("div", this.sideMenu.dataControl, gpx_meta.fileId+"_file_info", null, "display: inline-block;float:right;padding: 5px 10px;");
		this.fileInfoDiv = addNodeToDOM ("div", this.rightInfoDiv, null, null, "display:block;");
		this.fileInfoDiv.innerHTML = "Source: "+gpx_meta.gpx.attrs.creator+
			"; GPX Version: "+gpx_meta.gpx.attrs.version+
			"; Size in bytes: "+gpx_meta.fileSize;
		this.wptTableNameDiv = addNodeToDOM ("div", this.rightInfoDiv, gpx_meta.fileId+"_wpt_table_name", null, "display:none;padding-top:4px;");
		this.wptTableNameDiv.innerHTML = "<div style=\"display:inline-block;\">"+
			"</div>"+
			"<div style=\"display:inline-block;margin-right:5px;padding:1px 3px 1px 3px;background:#dddddd;border-radius:4px;color:black;\">"+
			"</div>";

		this.buildWaypointsMenu (gpx_meta, this.sideMenu);
		this.buildRoutesMenu (gpx_meta, this.sideMenu);
		this.buildTracksMenu (gpx_meta, this.sideMenu);

		// Properly size everything
		this.sideMenu.sizeVertically();
		this.sideMenu.sizeDataAreaWidth ();

		if (this.currentlyDisplayedWpts === null) {
			if (this.graphIcon !== null) {
				this.sideMenu.disableControlButton (this.graphIcon);
			}
			if (this.chartingIcon !== null) {
				this.sideMenu.disableControlButton (this.chartingIcon);
			}
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function getOpenPanelCnt (gpx_meta) {
	/*jshint validthis: true*/
	var cnt = 0;

	if (gpx_meta.wptsPanelOpened) {
		cnt++;
	}
	if (gpx_meta.rtesPanelOpened) {
		cnt++;
	}
	if (gpx_meta.trksPanelOpened) {
		cnt++;
	}

	return cnt;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function setPanelMaxHeights (gpx_meta) {
	/*jshint validthis: true*/
	// Determine how much space we have
	var avail_hgt = document.getElementsByTagName("html")[0].clientHeight-document.getElementById("content_container").offsetHeight;
	var topMargin = parseInt(getComputedStyle (document.body).marginTop);
	var bottomMargin = parseInt(getComputedStyle (document.body).marginBottom);
	var body_margin_hgt = (isNaN(topMargin)?0:topMargin) + (isNaN(bottomMargin)?0:bottomMargin);

	avail_hgt = avail_hgt - body_margin_hgt;

	var wpts_hgt = 0;
	if ((gpx_meta.wpt_panel !== undefined)&&(gpx_meta.wpt_panel !== null)) {
		wpts_hgt = gpx_meta.wpt_panel.getPanelContentDiv().offsetHeight-4;
	}

	var rtes_hgt = 0;
	if ((gpx_meta.rte_panel !== undefined)&&(gpx_meta.rte_panel !== null)) {
		rtes_hgt = gpx_meta.rte_panel.getPanelContentDiv().offsetHeight-4;
	}

	var trks_hgt = 0;
	if ((gpx_meta.trk_panel !== undefined)&&(gpx_meta.trk_panel !== null)) {
		trks_hgt = gpx_meta.trk_panel.getPanelContentDiv().offsetHeight-4;
	}

	avail_hgt = avail_hgt+wpts_hgt+rtes_hgt+trks_hgt;
	var max_panel_hgt;

	var open_cnt = this.getOpenPanelCnt (gpx_meta);
	if (open_cnt !== 0) {
		max_panel_hgt = avail_hgt/open_cnt;
	}
	else {
		max_panel_hgt = avail_hgt;
	}

	// Adjust for the open panels, because the panel has 2px top and bottom of padding but this is not
	// included in the determining if the max-height has been reached
	max_panel_hgt -= (open_cnt*4);

	if (max_panel_hgt < 100) {
		max_panel_hgt = 100;
	}

	console.log ("Setting max panel height to: "+max_panel_hgt);

	if ((gpx_meta.wpts_table_div !== undefined)&&(gpx_meta.wpts_table_div !== null)) {
		gpx_meta.wpts_table_div.style.maxHeight = max_panel_hgt+"px";
	}
	if ((gpx_meta.rtes_list_div !== undefined)&&(gpx_meta.rtes_list_div !== null)) {
		gpx_meta.rtes_list_div.style.maxHeight = max_panel_hgt+"px";
	}
	if ((gpx_meta.trks_list_div !== undefined)&&(gpx_meta.trks_list_div !== null)) {
		gpx_meta.trks_list_div.style.maxHeight = max_panel_hgt+"px";
	}

	// If a panel isn't using its max-height allow the other panels to use that space.
	var extra_hgt_avail = 0;
	var panels_that_can_use_more_hgt = [];

	if (gpx_meta.wptsPanelOpened) {
		if (wpts_hgt < max_panel_hgt) {
			extra_hgt_avail += (max_panel_hgt-wpts_hgt);
		}
		else {
			panels_that_can_use_more_hgt.push (gpx_meta.wpts_table_div);
		}
	}

	if (gpx_meta.rtesPanelOpened) {
		if (rtes_hgt < max_panel_hgt) {
			extra_hgt_avail += (max_panel_hgt-rtes_hgt);
		}
		else {
			panels_that_can_use_more_hgt.push (gpx_meta.rtes_list_div);
		}
	}

	if (gpx_meta.trksPanelOpened) {
		if (trks_hgt < max_panel_hgt) {
			extra_hgt_avail += (max_panel_hgt-trks_hgt);
		}
		else {
			panels_that_can_use_more_hgt.push (gpx_meta.trks_list_div);
		}
	}

	if (panels_that_can_use_more_hgt.length > 0) {
		var extra_hgt_per_panel = extra_hgt_avail/panels_that_can_use_more_hgt.length;
		panels_that_can_use_more_hgt.forEach (function (panel) {
			panel.style.maxHeight = (max_panel_hgt+extra_hgt_per_panel)+"px";
		});
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function buildWaypointsMenu (gpx_meta, menu) {
	let thiis = this;
    if ((gpx_meta.gpx.wpts !== undefined)&&(gpx_meta.gpx.wpts !== null)&&(gpx_meta.gpx.wpts.length > 0)) {
        menu.addMenuItem ({
            label: "Waypoints (count="+gpx_meta.gpx.wpts.length+")",
            action: function () {
                removeAllChildElements (thiis.tableContainer);
				document.getElementById(thiis.file.gpx_meta.fileId+"_wpt_table_name").style.display="none";
                menu.collapseMenu();
				// Render waypoint table
				var wptTableObject = thiis.renderWaypointTable (gpx_meta.fileId+"_wpt_table", thiis.tableContainer, gpx_meta.gpx.wpts, false, false, false, null, false, false);
				thiis.currentlyDisplayedWpts = gpx_meta.gpx.wpts;
				thiis.currentlyDisplayedWptsName = "Waypoints";
				thiis.sideMenu.disableControlButton (thiis.graphIcon);
            }
        });
    }
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function buildRoutesMenu (gpx_meta, menu) {
	let thiis = this;

    if ((gpx_meta.gpx.rtes !== undefined)&&(gpx_meta.gpx.rtes !== null)&&(gpx_meta.gpx.rtes.length > 0)) {
        let topRteMenu = menu.addMenuItem ({
            label: "Routes (count="+gpx_meta.gpx.rtes.length+")",
            action: null
        });
        gpx_meta.gpx.rtes.forEach (function (rte, rte_index) {
            menu.addMenuItem ({
                label: rte.name+" (Total Dist.="+rte.total_dist_fmt+" NM)",
                action: function () {
                    removeAllChildElements (thiis.tableContainer);
                    menu.collapseMenu();
					let titleDiv = document.getElementById(thiis.file.gpx_meta.fileId+"_wpt_table_name");
					titleDiv.style.display = "inline-block";
					//@ts-ignore Intellisense is wrong about this error
					titleDiv.children[0].innerText="Route Name=";
					//@ts-ignore Intellisense is wrong about this error
					titleDiv.children[1].innerText=rte.name;
					var rteTableObject = thiis.renderWaypointTable (gpx_meta.fileId+"_rtept_table_"+rte_index, thiis.tableContainer, rte.rtepts, false, false, true, gpx_meta.gpx.wpts, false, false);
					thiis.currentlyDisplayedWpts = rte.rtepts;
					thiis.currentlyDisplayedWptsName = rte.name;
					thiis.sideMenu.disableControlButton (thiis.graphIcon);
                }
            }, topRteMenu);
        });
    }
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function buildTracksMenu (gpx_meta, menu) {
    if ((gpx_meta.gpx.trks !== undefined)&&(gpx_meta.gpx.trks !== null)&&(gpx_meta.gpx.trks.length > 0)) {
        let topTrkMenu = menu.addMenuItem ({
            label: "Tracks (count="+gpx_meta.gpx.trks.length+")",
            action: null
        });
        gpx_meta.gpx.trks.forEach (function (trk, trk_index) {
            let numpts = trk.trksegs[0].trkpts.length;
            menu.addMenuItem ({
                label: trk.name+" (Total Dist.="+trk.trksegs[0].trkpts[numpts-1].dist_cumu_fmt+" NM)",
                action: function () {
                    removeAllChildElements (thiis.tableContainer);
					menu.collapseMenu();
					let titleDiv = document.getElementById(thiis.file.gpx_meta.fileId+"_wpt_table_name");
					titleDiv.style.display = "inline-block";
					//@ts-ignore Intellisense is wrong about this error
					titleDiv.children[0].innerText="Track Name=";
					//@ts-ignore Intellisense is wrong about this error
					titleDiv.children[1].innerText=trk.name;
					let all_trkpts = [];
					trk.trksegs.forEach (function (seg){
						all_trkpts = all_trkpts.concat (seg.trkpts);
					});
					let trkTableObject = thiis.renderWaypointTable (gpx_meta.fileId+"_trkpt_table_"+trk_index, thiis.tableContainer, all_trkpts, true, true, true, null, true, true);
					thiis.currentlyDisplayedWpts = all_trkpts;
					thiis.currentlyDisplayedWptsName = trk.name;
					thiis.sideMenu.enableControlButton (thiis.graphIcon);
                }
            }, topTrkMenu);
        });
    }
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Tab}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function openGraphDialog () {
	let graph = new GPX_Graph (this.currentlyDisplayedWpts, this.currentlyDisplayedWptsName);

	graph.openGraphDialog ();
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
    this.file = file;
	this.sideMenu = null;
	this.tableContainer = null;
	this.useCollapsiblePanels = false;
	this.saveFileIcon = null;
	this.chartingIcon = null;
	this.graphIcon = null;
	this.fileInfoDiv = null;
	this.rightInfoDiv = null;
	this.wptTableNameDiv = null;
	this.currentlyDisplayedWpts = null;
	this.currentlyDisplayedWptsName = null;

    this.displayGPX = function () {
		return displayGPX.call (this);
	};
	this.renderWaypointTable = function (id, panel_parent, wpts, showSpeed, showTimestamp, showDistance, showWptMatch, showDepth, showTemp) {
		return renderWaypointTable.call (this, id, panel_parent, wpts, showSpeed, showTimestamp, showDistance, showWptMatch, showDepth, showTemp);
	};
	this.drawWaypointsPanel = function (gpx_meta) {
		return drawWaypointsPanel.call (this, gpx_meta);
	};
	this.drawRoutesPanel = function (gpx_meta) {
		return drawRoutesPanel.call (this, gpx_meta);
	};
	this.drawTracksPanel = function (gpx_meta) {
		return drawTracksPanel.call (this, gpx_meta);
	};
	this.getOpenPanelCnt = function (gpx_meta) {
		return getOpenPanelCnt.call (this, gpx_meta);
	};
	this.setPanelMaxHeights = function (gpx_meta) {
		return setPanelMaxHeights.call (this, gpx_meta);
	};
	this.buildWaypointsMenu = function (gpx_meta, sideMenu) {
		return buildWaypointsMenu.call (this, gpx_meta, sideMenu);
	};
	this.buildRoutesMenu = function (gpx_meta, sideMenu) {
		return buildRoutesMenu.call (this, gpx_meta, sideMenu);
	};
	this.buildTracksMenu = function (gpx_meta, sideMenu) {
		return buildTracksMenu.call (this, gpx_meta, sideMenu);
	};
	this.openGraphDialog = function () {
		return openGraphDialog.call (this);
	}

	let thiis = this;
	this.resizeWaypointTable = function () {
		if (thiis.tableContainer != null) {
			for (let i=0; i<thiis.tableContainer.children.length; i++) {
				if ((thiis.tableContainer.children[i].id.includes("_wpt_table"))||
					(thiis.tableContainer.children[i].id.includes("_rtept_table_"))||
					(thiis.tableContainer.children[i].id.includes("_trkpt_table_"))) {
					let maxHeight = calculateAvailableHeightAndWidth (thiis.tableContainer).height;
					thiis.tableContainer.children[i].style.maxHeight = maxHeight+"px";
					break;
				}
			}
		}
	};
}