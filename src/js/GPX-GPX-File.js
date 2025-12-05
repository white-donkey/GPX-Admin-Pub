function GPX_GPX_File (parent) {
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
function walkGpxNodeToXml (node, nodename, indent) {
	var outputStr = " ".repeat(indent)+"<"+nodename;
	var addLFAfterOpeningNode = true;

	// Add in the node's attributes, if they exist
	if ((node.attrs !== undefined) && (node.attrs !== null)) {
		for (const key in node.attrs) {
			if ((node.attrs.hasOwnProperty (key))&&(GPX_IGNORE_ATTRS.indexOf(key) < 0)) {
				outputStr += " "+key+"=\""+node.attrs[key]+"\"";
			}
		}
	}
	outputStr += ">";

	// Need to do this little dance with sorting the keys because Garmin
	// Homeport has a few fairly egregious bug (IMO) that REQUIRES that:
	// 1. The timestamp be the first element in a wpt, rtept or trkpt node.
	// 2. The timestamp be the last element in the metadata node.
	// 3. The extensions be the second element in the rte node after the
	//    name node. 
	// If any of these are not true Homeport fails to parse the file with
	// the extremely unhelpful message "Something unexpected happened".
	Object.keys(node)
	.sort(function (a, b){
		if (a.toLowerCase() === "time") {
			if (nodename === "metadata") {
				return 1;
			}
			else {
				return -1;
			}
		}
		if (b.toLowerCase() === "time") {
			if (nodename === "metadata") {
				return -1;
			}
			else {
				return 1;
			}
		}
		if (a.toLowerCase() === "extensions") {
			if ((nodename === "rte")&&(b.toLowerCase() !== "name")) {
				return -1;
			}
			else {
				return 0;
			}
		}
		if (b.toLowerCase() === "extensions") {
			if ((nodename === "rte")&&(a.toLowerCase() !== "name")) {
				return 1;
			}
			else {
				return 0;
			}
		}
		if (a.toLowerCase() === "name") {
			if (nodename === "rte") {
				return -1;
			}
			else {
				return 0;
			}
		}
		if (b.toLowerCase() === "name") {
			if (nodename === "rte") {
				return 1;
			}
			else {
				return 0;
			}
		}
		else {
			return 0;
		}
	})
	.forEach (function (key){
		// Skip attrs since they are a special case and were added in the
		// code above
		if ((key !== "attrs")&&
			(node.hasOwnProperty (key))&&
			(GPX_IGNORE_NODES.indexOf(key) < 0)) {
			if (node[key] !== null) {
				if (addLFAfterOpeningNode) {
					outputStr += "\n";
					addLFAfterOpeningNode = false;
				}
				if (typeof node[key] === "object") {
					if (Array.isArray(node[key])) {
						for (var i=0; i<node[key].length; i++) {
							var obj = node[key][i];
							var realNodeName = key.slice (0,-1);
							outputStr += walkGpxNodeToXml (obj, realNodeName, indent+INDENT_SPACING);
						}
					}
					else {
						outputStr += walkGpxNodeToXml (node[key], key, indent+INDENT_SPACING);
					}
				}
				else if (typeof node[key] === "string") {
					outputStr += (" ".repeat(indent+INDENT_SPACING)+"<"+key+">"+node[key]+"</"+key+">\n");
				}
				else {
					console.error ("Unexpected data type in gpx export of "+nodename+"."+key+" : "+typeof node[key]);
				}
			}
		}
	});

	if (!addLFAfterOpeningNode) {
		// Add the indent only if the closing tag isn't on the same line
		outputStr += " ".repeat(indent);
	}
	outputStr += ("</"+nodename+">\n");

	return outputStr;
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
function gpxToXmlString (nodes) {
	var xmlGpxStr = "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n<gpx creator=\"GPX-Admin\"";
	// Note that if undefined, nodes will default to "all"
	if ((nodes === undefined) ||
		(nodes === null) ||
		(nodes.trim() === "") || 
		((nodes.trim() !== "wpts")&&(nodes.trim() !== "rtes")&&(nodes.trim() !== "trks"))) {
		nodes = "all";
	}
	nodes = nodes.trim();

	// Add in the gpx attributes from the gpx_meta
	for (const key in this.parent.gpx_meta.gpx.attrs) {
		if ((this.parent.gpx_meta.gpx.attrs.hasOwnProperty (key))&&(GPX_IGNORE_ATTRS.indexOf(key) < 0)) {
			xmlGpxStr += " "+key+"=\""+this.parent.gpx_meta.gpx.attrs[key]+"\"";
		}
	}
	xmlGpxStr += ">\n";

	// Add in the metadata tag
	xmlGpxStr += walkGpxNodeToXml (this.parent.gpx_meta.gpx.metadata, "metadata", INDENT_SPACING);

	if ((nodes === "all") || (nodes === "wpts")) {
		for (var wpt_i=0; wpt_i<this.parent.gpx_meta.gpx.wpts.length; wpt_i++) {
			xmlGpxStr += walkGpxNodeToXml (this.parent.gpx_meta.gpx.wpts[wpt_i], "wpt", INDENT_SPACING);
		}
	}

	if ((nodes === "all") || (nodes === "rtes")) {
		for (var rte_i=0; rte_i<this.parent.gpx_meta.gpx.rtes.length; rte_i++) {
			xmlGpxStr += walkGpxNodeToXml (this.parent.gpx_meta.gpx.rtes[rte_i], "rte", INDENT_SPACING);
		}
	}

	if ((nodes === "all") || (nodes === "trks")) {
		for (var trk_i=0; trk_i<this.parent.gpx_meta.gpx.trks.length; trk_i++) {
			xmlGpxStr += walkGpxNodeToXml (this.parent.gpx_meta.gpx.trks[trk_i], "trk", INDENT_SPACING);
		}
	}

	xmlGpxStr += "</gpx>";

	return xmlGpxStr;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_GPX_File}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function saveFile () {
	this.parent.gpx_meta.fileToBeSaved = new Blob([this.gpxToXmlString("all")], {type: "application/xml"});

	return true;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_GPX_File}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function handleFileRead () {
	/*jshint validthis: true*/
	let domParser = new DOMParser();
	this.parent.gpx_meta.container = domParser.parseFromString (this.parent.gpx_meta.rawContents, "text/xml");

	// All seems ok with this file and we have finished reading it, so lets put it on the screen now.
	this.dom_to_gpxobjs ();

	//console.log ("Contents of the file "+this.parent.gpx_meta.filename+":",this.parent.gpx_meta.gpx);
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {GPX_GPX_File}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
/* Move this back into GPX_File
function handleGPX () {
	/*jshint validthis: true*/
/*	this.parent.gpx_meta.tab_container = this.tab_ctrl.addTab (file_index, this.parent.gpx_meta.filename);

	//this.merge_meta_checkbox_ctrl.label.push (gpx_meta.filename);

	this.displayGPX (gpx_meta);
}*/

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function dom_to_gpxobjs () {
	/*jshint validthis: true*/
	var thiis = this;
	var dom_objs = dom_to_json.parseDOMToJson (dom_to_json.META_TYPE.MT_OBJ, this.parent.gpx_meta.container);
	
	console.log ("The DOM objects from the file "+this.parent.gpx_meta.filename+":",dom_objs[0]);
	this.parent.gpx_meta.gpx.attrs = dom_to_json.createAttributesObj (dom_objs[0]);
	dom_objs[0].val.forEach (function (obj) {
		if (obj.tag_name === "metadata") {
			var metadata = parseObject (obj);
			if ((metadata !== undefined)&&(metadata !== null)&&(metadata.metadata !== undefined)) {
				thiis.parent.gpx_meta.gpx.metadata = metadata.metadata;
			}
		}
		else if (obj.tag_name === "wpt") {
			var wpt = parseObject (obj);
			if ((wpt !== undefined)&&(wpt !== null)&&(wpt.wpt !== undefined)) {
				thiis.parent.gpx_meta.gpx.wpts.push (wpt.wpt);
				if ((wpt.wpt.name !== undefined) && (wpt.wpt.name !== null) &&
					(wpt.wpt.name.length > thiis.parent.gpx_meta.wptNameMaxLen)) {
					thiis.parent.gpx_meta.wptNameMaxLen = wpt.wpt.name.length;
				}
			}
		}
		else if (obj.tag_name === "rte") {
			var rte = parseObject (obj);
			if ((rte !== undefined)&&(rte !== null)&&(rte.rte !== undefined)) {
				thiis.parent.gpx_meta.gpx.rtes.push (rte.rte);
				if ((rte.rte.name !== undefined) && (rte.rte.name !== null) &&
					(rte.rte.name.length > thiis.parent.gpx_meta.rteNameMaxLen)) {
					thiis.parent.gpx_meta.rteNameMaxLen = rte.rte.name.length;
				}
				if ((rte.rte.rtepts !== undefined) && (Array.isArray (rte.rte.rtepts))) {
					let maxPtNameLenInRoute = 0;
					rte.rte.rtepts.forEach (function (pt){
						if ((pt.name !== undefined) && (pt.name !== null) &&
							(pt.name.length > maxPtNameLenInRoute)) {
							maxPtNameLenInRoute = pt.name.length;
						}
					});
					if (maxPtNameLenInRoute > thiis.parent.gpx_meta.rteptNameMaxLen) {
						thiis.parent.gpx_meta.rteptNameMaxLen;
					}
				}
			}
		}
		else if (obj.tag_name === "trk") {
			var trk = parseObject (obj);
			if ((trk !== undefined)&&(trk !== null)&&(trk.trk !== undefined)) {
				thiis.parent.gpx_meta.gpx.trks.push (trk.trk);
				if ((trk.trk.name !== undefined) && (trk.trk.name !== null) &&
					(trk.trk.name.length > thiis.parent.gpx_meta.trkNameMaxLen)) {
					thiis.parent.gpx_meta.trkNameMaxLen = trk.trk.name.length;
				}
			}
		}
		else {
			console.log ("Invalid object name ("+obj.name+") under the gpx level!!!");
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
function parseObject (obj) {
	var ret_obj = {};

	if (Array.isArray (obj)) {
		var isARte = false;
		for (var tagIndex=0; tagIndex<obj.length; tagIndex++) {
			if (obj[tagIndex].tag_name === undefined) {
				break;
			}
			if (obj[tagIndex].tag_name === "rtept") {
				isARte = true;
				break;
			}
		}
		obj.forEach (function (sub_obj) {
			if ((typeof sub_obj.val === "object")||((typeof sub_obj.val === "string")&&(sub_obj.val.trim() === ""))) {
				if ((sub_obj.tag_name === "link")||(sub_obj.tag_name === "rtept")||(sub_obj.tag_name === "trkseg")||(sub_obj.tag_name === "trkpt")||(sub_obj.tag_name === "pt")) {
					if (!Array.isArray(ret_obj[sub_obj.tag_name+"s"])) {
						ret_obj[sub_obj.tag_name+"s"] = [];
					}
					if ((typeof sub_obj.val === "string")&&(sub_obj.val.trim() === "")) {
						ret_obj[sub_obj.tag_name+"s"].push ({});
					}
					else {
						ret_obj[sub_obj.tag_name+"s"].push (parseObject (sub_obj.val));
					}
					ret_obj[sub_obj.tag_name+"s"][ret_obj[sub_obj.tag_name+"s"].length-1].attrs = dom_to_json.createAttributesObj (sub_obj);
				}
				else {
					if ((typeof sub_obj.val === "string")&&(sub_obj.val.trim() === "")) {
						ret_obj[sub_obj.tag_name] = {};
					}
					else {
						ret_obj[sub_obj.tag_name] = parseObject (sub_obj.val);
					}
					ret_obj[sub_obj.tag_name].attrs = dom_to_json.createAttributesObj (sub_obj);
				}
			}
			else {
				// Homeport crashes when a rte has a time in it so skip adding it
				// to the merged file 
				if ((!isARte)||(sub_obj.tag_name !== "time")) {
					ret_obj[sub_obj.tag_name] = sub_obj.val;
				}
			}
		});
	}
	else {
		if ((typeof obj.val === "object")||((typeof obj.val === "string")&&(obj.val.trim() === ""))) {
			if ((obj.tag_name === "link")||(obj.tag_name === "rtept")||(obj.tag_name === "trkseg")||(obj.tag_name === "trkpt")||(obj.tag_name === "pt")) {
				if (!Array.isArray(ret_obj[obj.tag_name+"s"])) {
					ret_obj[obj.tag_name+"s"] = [];
				}
				if ((typeof obj.val === "string")&&(obj.val.trim() === "")) {
					ret_obj[obj.tag_name+"s"].push ({});
				}
				else {
					ret_obj[obj.tag_name+"s"].push (parseObject (obj.val));
				}
				ret_obj[obj.tag_name+"s"][ret_obj[obj.tag_name+"s"].length-1].attrs = dom_to_json.createAttributesObj (obj);
			}
			else {
				if ((typeof obj.val === "string")&&(obj.val.trim() === "")) {
					ret_obj[obj.tag_name] = {};
				}
				else {
					ret_obj[obj.tag_name] = parseObject (obj.val);
				}
				ret_obj[obj.tag_name].attrs = dom_to_json.createAttributesObj (obj);
			}
		}
		else {
			ret_obj[obj.tag_name] = obj.val;
		}
	}

	return ret_obj;
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
	this.parent = parent;

	this.handleFileRead = function () {
		return handleFileRead.call (this);
	};
	this.dom_to_gpxobjs = function () {
		return dom_to_gpxobjs.call (this);
	};
	this.gpxToXmlString = function (nodes) {
		return gpxToXmlString.call (this, nodes);
	};
	this.saveFile = function () {
		return saveFile.call (this);
	};
}