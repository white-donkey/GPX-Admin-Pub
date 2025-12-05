
/* exported allowNavigationToNewPage */
/* exported addNodeToDOM */
/* exported addClassName */
/* exported removeClassName */
/* exported editCssSelector */
/* exported overrideStylingByClass */
/* exported getStringWidthInPixels */
/* exported arrayIntersection */
/* exported removeAllChildElements */
/* exported deepObjectCopy */
/* exported getCurrIso8601UTCDate */
/* exported getIso8601UTCDate */
/* exported concatTypedArrays */

function allowNavigationToNewPage() {
	"use strict";
	return true;
}

function addNodeToDOM (node_type, node_parent, id, class_list, style) {
	"use strict";

	var new_node = document.createElement (node_type);

	if ((id !== undefined)&&(id !== null)) {
		new_node.id = id;
	}
	if ((class_list !== undefined)&&(class_list !== null)) {
		new_node.className = class_list;
	}
	if ((style !== undefined)&&(style !== null)) {
		new_node.style.cssText = style;
	}

	node_parent.appendChild (new_node);

	return new_node;
}

function insertNodeBefore (node_type, node_parent, node_before, id, class_list, style) {
	"use strict";

	var new_node = document.createElement (node_type);

	if ((id !== undefined)&&(id !== null)) {
		new_node.id = id;
	}
	if ((class_list !== undefined)&&(class_list !== null)) {
		new_node.className = class_list;
	}
	if ((style !== undefined)&&(style !== null)) {
		new_node.style.cssText = style;
	}

	if ((node_before !== undefined) && (node_before !== null)) {
		node_parent.insertBefore (new_node, node_before);
	}
	else {
		node_parent.appendChild (new_node);
	}

	return new_node;
}

function calculateAvailableHeightAndWidth (domElement) {
	"use strict";

	// Fetch the total available hight and width of the browser
	let totalViewPortHeight = document.documentElement.clientHeight;
	let totalViewPortWidth = document.documentElement.clientWidth;

	// Get the body margin.  This is added by the browser itself.  We do not
	// need the marginTop or marginLeft becuase that is already included 
	// when we fetch the containerTop and containerLeft
	let bottomEdges = 0;
	let rightEdges = 0;
	let elem = domElement;
	let computedStyle = null;
	while (elem !== document.body) {
		computedStyle = getComputedStyle(elem);
		bottomEdges += parseInt (computedStyle.paddingBottom);
		bottomEdges += parseInt (computedStyle.marginBottom);
		bottomEdges += parseInt (computedStyle.borderBottom);
		rightEdges += parseInt (computedStyle.paddingRight);
		rightEdges += parseInt (computedStyle.marginRight);
		rightEdges += parseInt (computedStyle.borderRight);
		elem = elem.parentElement;
	}
	// elem at this point should be the document.body
	computedStyle = getComputedStyle(elem);
	bottomEdges += parseInt (computedStyle.paddingBottom);
	bottomEdges += parseInt (computedStyle.marginBottom);
	bottomEdges += parseInt (computedStyle.borderBottom);
	rightEdges += parseInt (computedStyle.paddingRight);
	rightEdges += parseInt (computedStyle.marginRight);
	rightEdges += parseInt (computedStyle.borderRight);

	let elemTop = domElement.getBoundingClientRect().top;
	let elemLeft = domElement.getBoundingClientRect().left;

	// Also need to include the top and left padding and border of
	// the element itself.
	computedStyle = getComputedStyle(domElement);
	let elemTopEdges = parseInt (computedStyle.paddingTop);
	elemTopEdges += parseInt (computedStyle.borderTop);

	let elemLeftEdges = parseInt (computedStyle.paddingLeft);
	elemLeftEdges += parseInt (computedStyle.borderLeft);

    let elemHeight = totalViewPortHeight-elemTop-bottomEdges-elemTopEdges;
	let elemWidth = totalViewPortWidth-elemLeft-rightEdges-elemLeftEdges;

	// Lastly, subtract a fudge factor or 2 from the hieght.  This is needed
	// to prevent a vertical scroll bar from appearing on a Windows system
	// when the Windows system display setting has a zoom applied to it.
	elemHeight = elemHeight - 2;

	return {height: elemHeight, width: elemWidth};
}

/*
** NOTE!!!!! 
** It is expected that this function is called with the this pointer set 
** to the DOM node that will have the class added. 
** i.e. addClassName.call (dom_node, "class-to-add")
*/
function addClassName (name) {
	"use strict";
	/*jshint validthis: true*/
	this.className += (" "+name);
	//console.log ("Added "+name+" to the class list");
}

/*
** NOTE!!!!! 
** It is expected that this function is called with the this pointer set 
** to the DOM node that will have the class removed. 
** i.e. removedClassName.call (dom_node, "class-to-remove")
*/
/******************************************************************************
 * @this {any}
 */
function removeClassName (name) {
	"use strict";
	/*jshint validthis: true*/
	if ((this.className !== undefined)&&(this.className !== null)) {
		var class_list = this.className.split (" ");
		var new_class_list = "";

		class_list.forEach (function (d) {
			if (d !== name) {
				if (new_class_list !== "") {
					new_class_list += " ";
				}
				new_class_list += d;
			}
		});

		//console.log ("setting class list to: "+new_class_list);

		this.className = new_class_list;
	}
	else {
		console.error ("className is undefined in removeClassName.");
	}
}

/*
** Polyfil for Math.trunc, which is supported by all browsers except for IE
*/
if (!Math.trunc) {
	Math.trunc = function(v) {
		"use strict";
		v = +v;
		if (!isFinite(v)) {
			return v;
		}
		
		return (v - v % 1)   ||   (v < 0 ? -0 : v === 0 ? v : 0);
	};
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
function editCssSelector (selector, style_array)
{
	"use strict";
	var i, j, k;
	var styleSheet;
	var mediaType;
	var media;

	if (!document.styleSheets) {
		return;
	}

	if (document.getElementsByTagName("head").length === 0) {
		return;
	}

	for (j = 0; j < document.styleSheets.length; j++) {
		if (document.styleSheets[j].disabled) {
			continue;
		}
		media = document.styleSheets[j].media;
		mediaType = typeof media;
			
		if (mediaType==="string") {
			// @ts-ignore Since this is only being called if mediaType is of
			// type string we know that indexOf is a valid member.
			if ((media!=="") && ((media.indexOf("screen")===-1))) {
				continue;
			}
		}
		else if (mediaType==="object") {
			if ((media.mediaText!=="") && (media.mediaText.indexOf("screen")===-1) && (media.mediaText.indexOf("all")===-1)) {
				continue;
			}
		}

		styleSheet = document.styleSheets[j];
		var styleSheetLength = (styleSheet.cssRules) ? styleSheet.cssRules.length : 0;

		for (i = 0; i < styleSheetLength; i++) {
			// @ts-ignore Based on what I see in the browser debugger
			// selectorText DOES exist in CSSRule
			if (styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() === selector.toLowerCase()) {
				for (k=0; k<style_array.length; k++) {
					var priority = "";
					if (style_array[k].priority !== undefined) {
						priority = style_array[k].priority;
					}
					// @ts-ignore Based on what I see in the browser debugger
					// style DOES exist in CSSRule
					styleSheet.cssRules[i].style.setProperty (style_array[k].name, style_array[k].value, priority);
				}
				return;
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
function overrideStylingByClass (parent_node, override_array) {
	"use strict";

	override_array.forEach (function (d) {
		var element_list = parent_node.getElementsByClassName (d.class_name);
		d.overrides.forEach (function (override) {
			for (var i=0; i<element_list.length; i++) {
				element_list[i].style[override.name] = override.value;
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
function getStringWidthInPixels (str, class_list) {
	"use strict";

	var temp_node = addNodeToDOM ("span", document.body, null, class_list, "position:absolute; top:0px; left:-1000px;");
	temp_node.innerHTML = str;
	var node_width = temp_node.offsetWidth;

	return node_width;
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
function arrayIntersection (array1, array2) {
	"use strict";
	var ret_val = [];

	ret_val = array1.filter(function (value) {
		return -1 !== array2.indexOf(value);
	});

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
function removeAllChildElements (parent) {
	"use strict";

	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
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
function deepObjectCopy (obj, exclusions) {
	"use strict";
	var copiedObj = {};

	if (Array.isArray(obj)) {
		copiedObj = [];
		obj.forEach (function (oo) {
			switch ((typeof oo)) {
			case "object":
				if (oo === null) {
					copiedObj.push (oo);
				}
				else {
					// We need to step into this object
					copiedObj.push (deepObjectCopy (oo, exclusions));
				}
				break;
			case "symbol":
				copiedObj.push (oo);
				break;
			// The rest are basic types so just copy them
			case "boolean":
			case "number":
			case "string":
			case "bigint":
			case "undefined":
			case "function":
				copiedObj.push (oo);
				break;
			}
		});
	}
	else {
		for (const key in obj) {
			if ((obj.hasOwnProperty (key))&&(exclusions.indexOf(key) < 0)) {
				switch ((typeof obj[key])) {
				case "object":
					if (obj[key] === null) {
						copiedObj[key] = obj[key];
					}
					else {
						// We need to step into this object
						copiedObj[key] = deepObjectCopy (obj[key], exclusions);
					}
					break;
				case "symbol": 
					copiedObj[key] = obj[key];
					break;
				// The rest are basic types so just copy them
				case "boolean":
				case "number":
				case "string":
				case "bigint":
				case "undefined":
				case "function":
					copiedObj[key] = obj[key];
					break;
				}
			}
		}
	}

	return copiedObj;
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
function getIso8601UTCDate (time) {
	"use strict";
	var transMonth = ["01","02","03","04","05","06","07","08","09","10","11","12",];
	var dateStr = "";
	var dayOfMonth = time.getUTCDate();
	if (dayOfMonth < 10) {
		dayOfMonth = "0"+dayOfMonth;
	}
	var hours = time.getUTCHours();
	if (hours < 10) {
		hours = "0"+hours;
	}
	var minutes = time.getUTCMinutes();
	if (minutes < 10) {
		minutes = "0"+minutes;
	}
	var seconds = time.getUTCSeconds();
	if (seconds < 10) {
		seconds = "0"+seconds;
	}
	dateStr += (time.getUTCFullYear()+"-"+transMonth[time.getUTCMonth()]+"-"+dayOfMonth);
	dateStr += ("T"+hours+":"+minutes+":"+seconds+"Z");

	return dateStr;
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
function getCurrIso8601UTCDate () {
	"use strict";
	return getIso8601UTCDate (new Date());
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
function concatTypedArrays(a, b) { // a, b TypedArray of same type
	"use strict";
	if ((a === undefined) || (a === null)) {
		return b;
	}

	var c = new (a.constructor)(a.length + b.length);

	c.set(a, 0);
	c.set(b, a.length);

	return c;
}
