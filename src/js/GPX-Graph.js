var GT = {
	SPEED_VS_TIME: {xAxis: G_X_AXIS.TIME, yAxis: G_Y_AXIS.SPEED},
	DEPTH_VS_TIME:  {xAxis: G_X_AXIS.TIME, yAxis: G_Y_AXIS.DEPTH},
	TEMP_VS_TIME:  {xAxis: G_X_AXIS.TIME, yAxis: G_Y_AXIS.TEMP},
	SPEED_VS_DIST:  {xAxis: G_X_AXIS.DIST, yAxis: G_Y_AXIS.SPEED},
	DEPTH_VS_DIST: {xAxis: G_X_AXIS.DIST, yAxis: G_Y_AXIS.DEPTH},
	TEMP_VS_DIST: {xAxis: G_X_AXIS.DIST, yAxis: G_Y_AXIS.TEMP}
};

function GPX_Graph (wpts, graphName) {
    "use strict";

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Graph}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function mouseLeaveHandler (e, rg) {
    let lclRg = [rg];

    if (this.unifiedCursors) {
        lclRg = this.renderGraphs;
    }

    lclRg.forEach (function (rg) {
        rg.cursor.toolTip.style ("opacity", 0);
        rg.cursor.vertMarkerLine.attr ("opacity", 0);
        rg.cursor.horizMarkerLine.attr ("opacity", 0);
        rg.cursor.markerDot.attr ("opacity", 0);
    });
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Graph}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function mouseMoveHandler (e, rg) {
    let thiss = this;
    const pointerCoords = d3.pointer(e)
    const [posX, posY] = pointerCoords
    let lclRg = [rg];

    if (this.unifiedCursors) {
        lclRg = this.renderGraphs;
    }
    
    lclRg.forEach (function (rg) {
        if ((posX >= 0)&&(posX <= rg.width)) {
            let xAxisVal = rg.xAxis.invert(posX);
            const bisect = d3.bisector(function(wpt) {
                if (rg.gt.xAxis === G_X_AXIS.DIST) {
                    //@ts-ignore Not a real error with the version of d3 I am using
                    return +wpt.dist_cumu_fmt;
                }
                else if (rg.gt.xAxis === G_X_AXIS.TIME) {
                    //@ts-ignore Not a real error with the version of d3 I am using
                    return new Date (wpt.time);
                }
            });
            let yAxisVal = thiss.getGraphDataPoint (thiss.wpts[bisect.center(thiss.wpts,xAxisVal)], rg.gt.yAxis);
            let yAxisValPos = rg.yAxis(yAxisVal);

            rg.cursor.vertMarkerLine.attr("x1", posX)
                .attr("x2", posX)
                .attr("opacity", 1);

            rg.cursor.horizMarkerLine.attr("y1", yAxisValPos)
                .attr("y2", yAxisValPos)
                .attr("opacity", 1);
                
            rg.cursor.markerDot.attr("cx", posX)
                .attr("cy", yAxisValPos)
                .attr("opacity", 1);

            rg.cursor.toolTip.style("left", (posX>60?posX-60:0)+"px")
                .style("top", "0px")
                .style("opacity", 0.8)
                .text(function () {
                    if (rg.gt.yAxis === G_Y_AXIS.DEPTH) {
                        return Math.abs(yAxisVal).toFixed(2);
                    }
                    else {
                        return yAxisVal.toFixed(2);
                    }
                })
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
function getGraphDataPoint (wpt, graphYAxis) {
	let returnPt = 0;

	switch (graphYAxis) {
	case G_Y_AXIS.SPEED:
		if ((wpt.sog_fmt !== undefined)&&(wpt.sog_fmt !== null)) {
			returnPt = convertNmForDistanceUnits (wpt.sog_fmt, this.distUnitSetting);
		}
		else {
			returnPt = 0.0;
		}
		break;
	case G_Y_AXIS.DEPTH:
		if ((wpt.depth_mtrs !== undefined)&&(wpt.depth_mtrs !== null)) {
			returnPt = (-1*convertMtrForDepthUnits (wpt.depth_mtrs, this.depthUnitSetting));
		}
		else {
			returnPt = 0.0;
		}
		break;
	case G_Y_AXIS.TEMP:
		if ((wpt.temp_c !== undefined)&&(wpt.temp_c !== null)) {
			returnPt = convertCForTempUnits (wpt.temp_c, this.tempUnitSetting);
		}
		else {
			returnPt = convertCForTempUnits (12.778, this.tempUnitSetting);
		}
		break;
	default:
		console.error ("Unknown graph y axis type: "+graphYAxis);
		returnPt = 0;
	}

	return returnPt;
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
function renderGraph (div, rg) {
    let thiss = this;

	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 60};
	rg.width = div.clientWidth - margin.left - margin.right;
	rg.height = div.clientHeight - margin.top - margin.bottom

	// append the svg object to the body of the page
	var svg = d3.select (div)
		.append("svg")
			.attr("width", rg.width + margin.left + margin.right)
			.attr("height", rg.height + margin.top + margin.bottom)
		.append("g")
            .attr("id", "graph_g_"+rg.gt.yAxis+"_"+rg.gt.xAxis)
			.attr("transform",
				  "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis --> it is either a date format or distance
	rg.xAxis = d3.scaleLinear()
		.domain(d3.extent(this.wpts, function(wpt) {
			if (rg.gt.xAxis === G_X_AXIS.DIST) {
				return +(convertNmForDistanceUnits (wpt.dist_cumu_fmt, thiss.distUnitSetting));
			}
			else if (rg.gt.xAxis === G_X_AXIS.TIME) {
				return new Date (wpt.time);
			}
		}))
		.range([ 0, rg.width ]);

	svg.append("g")
		.attr("transform", "translate(0," + rg.height + ")")
		.call(d3.axisBottom(rg.xAxis));

	// Add Y axis
    var leftAxis = null;
	if (rg.gt.yAxis === G_Y_AXIS.SPEED) {
		rg.yAxis = d3.scaleLinear()
            // @ts-ignore
			.domain([0, d3.max(this.wpts, function(wpt) { return thiss.getGraphDataPoint (wpt, rg.gt.yAxis); })])
			.range([ rg.height, 0 ]);
        leftAxis = d3.axisLeft(rg.yAxis);
	}
	else if (rg.gt.yAxis === G_Y_AXIS.TEMP) {
		rg.yAxis = d3.scaleLinear()
            // @ts-ignore
			.domain([d3.min(this.wpts, function(wpt) { return thiss.getGraphDataPoint (wpt, rg.gt.yAxis); }),
					 d3.max(this.wpts, function(wpt) { return thiss.getGraphDataPoint (wpt, rg.gt.yAxis); })])
			.range([ rg.height, 0 ]);
        leftAxis = d3.axisLeft(rg.yAxis);
	}
	else if (rg.gt.yAxis === G_Y_AXIS.DEPTH) {
		rg.yAxis = d3.scaleLinear()
            // @ts-ignore
			.domain([d3.min(this.wpts, function(wpt) { return thiss.getGraphDataPoint (wpt, rg.gt.yAxis); }), 0])
			.range([ rg.height, 0 ]);
        // @ts-ignore
        leftAxis = d3.axisLeft(rg.yAxis).tickFormat(function (tickVal) {return Math.abs(tickVal)});
	}
	svg.append("g")
		.call(leftAxis);

	// Add the line
	svg.append("path")
		.datum(this.wpts)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 1.5)
        .attr("pointer-events", "none")
		.attr("d", d3.line()
			.x(function(wpt) {
				if (rg.gt.xAxis === G_X_AXIS.DIST) {
					//@ts-ignore Not a real error with the version of d3 I am using
					return rg.xAxis(+wpt.dist_cumu_fmt);
				}
				else if (rg.gt.xAxis === G_X_AXIS.TIME) {
					//@ts-ignore Not a real error with the version of d3 I am using
					return rg.xAxis(new Date (wpt.time));
				}
			})
			.y(function(wpt) {
				return rg.yAxis(thiss.getGraphDataPoint (wpt, rg.gt.yAxis));
			}));
    
    // This rectangle is added to allow the mouse over to happen
    // anywhere within the canvas
    let cursorRect = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", rg.width)
        .attr("height", rg.height)
        .attr("opacity", 0)
        .style("touch-action", "none");
        
    let fo = svg.append("foreignObject")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", rg.width)
        .attr("height", rg.height)
        .attr("pointer-events", "none");
    
    rg.cursor.toolTip = fo.append("xhtml:div")
        .attr("class", "tooltip gpx-graph-tootip")
        .style("opacity", 0)
        .style("pointer-events", "none"); // Important for interaction

    rg.cursor.vertMarkerLine = svg.append("line")
	    .attr("x1", 0)
    	.attr("x2", 0)
	    .attr("y1", 0)
    	.attr("y2", rg.height)
	    .attr("stroke-width", 1)
    	.attr("stroke", "black")
	    .attr("opacity", 0)
        .attr("pointer-events", "none");

    rg.cursor.horizMarkerLine = svg.append("line")
	    .attr("x1", 0)
    	.attr("x2", rg.width)
	    .attr("y1", 0)
    	.attr("y2", 0)
	    .attr("stroke-width", 1)
    	.attr("stroke", "black")
	    .attr("opacity", 0)
        .attr("pointer-events", "none");
	
    rg.cursor.markerDot = svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", "black")
        .attr("opacity", 0)
        .attr("pointer-events", "none");

    cursorRect.on ("mouseleave", (e) => {
        thiss.mouseLeaveHandler (e, rg);
    });

    cursorRect.on("pointermove", (e) => {
        thiss.mouseMoveHandler (e, rg);
    })
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Graph}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function openGraphDialog () {
    let dialogHeight = document.body.clientHeight - 150;
	let dialogWidth = document.body.clientWidth - 100;
    let xAxisAbbr = (((this.currXAxisSetting.abbr===null)||((this.currXAxisSetting.abbr.split("##").length===3)&&(this.currXAxisSetting.abbr.split("##")[0]==="")&&(this.currXAxisSetting.abbr.split("##")[2]==="")))?
        (((this.currXAxisSetting.dynamicAbbr!==undefined)&&(this.currXAxisSetting.dynamicAbbr!==null))?
            this.currXAxisSetting.dynamicAbbr:null)
        :this.currXAxisSetting.abbr);
	let graphCanvases = {
		speedGraph: {
			container: null,
			control: {
				type: CT.CANVAS,
				height: dialogHeight/3,
				width: dialogWidth,
				label: "Speed ("+this.distUnitSetting.speedUnit+") vs "+this.currXAxisSetting.name+((xAxisAbbr!==null)?" ("+xAxisAbbr+")":"")
			}
		},
		depthGraph: {
			container: null,
			control: {
				type: CT.CANVAS,
				height: dialogHeight/3,
				width: dialogWidth,
				label: "Depth ("+this.depthUnitSetting.name+") vs "+this.currXAxisSetting.name+((xAxisAbbr!==null)?" ("+xAxisAbbr+")":"")
			}
		},
		tempGraph: {
			container: null,
			control: {
				type: CT.CANVAS,
				height: dialogHeight/3,
				width: dialogWidth,
				label: "Temperature ("+this.tempUnitSetting.name+") vs "+this.currXAxisSetting.name+((xAxisAbbr!==null)?" ("+xAxisAbbr+")":"")
			}
		}
	};
	let graphDlgMeta = {
		title: "Speed and Depth Graph for "+this.graphName,
		type: DT.ALERT,
		controls: []
	};

    if (this.renderGraphs.length === 0) {
        displayErrorToUser ("Unable to Display Graph", "There is not enough data in "+this.graphName+" to show any graphs.");
    }
    else {
        // Adjust the heights of the graphs
        graphCanvases.speedGraph.control.height = dialogHeight/this.renderGraphs.length;
        graphCanvases.depthGraph.control.height = dialogHeight/this.renderGraphs.length;
        graphCanvases.tempGraph.control.height = dialogHeight/this.renderGraphs.length;

        this.renderGraphs.forEach (function (rg) {
            switch (rg.gt.yAxis) {
            case G_Y_AXIS.SPEED:
                graphDlgMeta.controls.push (graphCanvases.speedGraph.control);
                break;
            case G_Y_AXIS.DEPTH:
                graphDlgMeta.controls.push (graphCanvases.depthGraph.control);
                break;
            case G_Y_AXIS.TEMP:
                graphDlgMeta.controls.push (graphCanvases.tempGraph.control);
                break;
            }
        });

        var graphDialog = new MHS_Dialog (graphDlgMeta);

        graphDialog.openDialog();

        // Render the graphs
        let thiss = this;
        this.renderGraphs.forEach (function (rg, index) {
            graphDlgMeta.controls[index].container = graphDialog.canvasDiv[index];
            thiss.renderGraph (graphDlgMeta.controls[index].container, rg);
        });
    }
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_Graph}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function preProcessWaypointsForGraphing (wpts) {
    // Lets do a quick sanity check.  If there are fewer than 15
    // waypoints don't show any graphs.
    if (wpts.length <= 15) {
        this.renderGraphs = [];
        return [];
    }

    // properties to be copied in for each point
    //    dist_cumu_fmt
    //    time
    //    sog_fmt
    //    depth_mtrs
    //    temp_c
    let retWpts = [];
    let speedCntWithData = 0;
    let depthCntWithData = 0;
    let tempCntWithData = 0;

    wpts.forEach (function (wpt) {
        let newWpt = {
            dist_cumu_fmt: +wpt.dist_cumu_fmt,
            time: wpt.time
        };

        // Process the sog
        if ((wpt.sog_fmt !== undefined)&&(wpt.sog_fmt !== null)) {
            speedCntWithData++;
            newWpt.sog_fmt = +wpt.sog_fmt;
        }
        else {
            newWpt.sog_fmt = 0;
        }

        // Process the depth
        if ((wpt.depth_mtrs !== undefined)&&(wpt.depth_mtrs !== null)) {
            depthCntWithData++;
            newWpt.depth_mtrs = +wpt.depth_mtrs;
        }
        else {
            newWpt.depth_mtrs = 0;
        }

        // Process the temperature
        if ((wpt.temp_c !== undefined)&&(wpt.temp_c !== null)) {
            tempCntWithData++;
            newWpt.temp_c = +wpt.temp_c;
        }
        else {
            newWpt.temp_c = 13.0;
        }

        retWpts.push (newWpt);
    });

    // Determine if a graph should be shown or not.  If less than 10%
    // of the waypoints have valid data for a particular graph, that
    // graph will not be shown.
    let threshold = wpts.length*0.1;
    // reset the value of renderGraphs to render none
    this.renderGraphs = [];
    if (speedCntWithData >= threshold) {
        this.renderGraphs.push ({gt:{xAxis: this.currXAxisSetting.unit, yAxis: G_Y_AXIS.SPEED}, cursor: {}, xAxis: null, yAxis: null, width: 0, height: 0});
    }
    if (depthCntWithData >= threshold) {
        this.renderGraphs.push ({gt:{xAxis: this.currXAxisSetting.unit, yAxis: G_Y_AXIS.DEPTH}, cursor: {}, xAxis: null, yAxis: null, width: 0, height: 0});
    }
    if (tempCntWithData >= threshold) {
        this.renderGraphs.push ({gt:{xAxis: this.currXAxisSetting.unit, yAxis: G_Y_AXIS.TEMP}, cursor: {}, xAxis: null, yAxis: null, width: 0, height: 0});
    }

    return retWpts;
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
    /**
     * @typedef {object} ProcessedWaypoints
     * @property {Number} dist_cumu_fmt
     * @property {Date} time
     * @property {Number} sog_fmt
     * @property {Number} depth_mtrs
     * @property {Number} temp_c
     * @property {Number} length
    */
    
    /** @type {ProcessedWaypoints} */
    this.wpts = null;
    this.graphName = graphName;
    this.renderGraphs = [];

    this.currXAxisSetting = gpxAdminInstance.settings.getSetting ("xAxisDomain");
    this.unifiedCursors = gpxAdminInstance.settings.getSetting ("unifiedCursor").unit;
    this.depthUnitSetting = gpxAdminInstance.settings.getSetting ("depthUnits");
    this.tempUnitSetting = gpxAdminInstance.settings.getSetting ("tempUnits");
    this.distUnitSetting = gpxAdminInstance.settings.getSetting ("distUnits");

    this.getGraphDataPoint = function (wpt, graphYAxis) {
        return getGraphDataPoint.call (this, wpt, graphYAxis);
    };

    this.openGraphDialog = function () {
        return openGraphDialog.call (this);
    };
    this.renderGraph = function (div, rg) {
        return renderGraph.call (this, div, rg);
    };
    this.preProcessWaypointsForGraphing = function (wpts) {
        return preProcessWaypointsForGraphing.call (this, wpts);
    };
    this.mouseLeaveHandler = function (e, rg) {
        return mouseLeaveHandler.call (this, e, rg);
    };
    this.mouseMoveHandler = function (e, rg) {
        return mouseMoveHandler.call (this, e, rg);
    };

    // pre process the data to get what will be displayed.
    // the method preProcessWaypointsForGraphing will also
    // populate the renbderGraphs array with the list of graphs
    // that will actually be displayed.
    this.wpts = this.preProcessWaypointsForGraphing (wpts);
}