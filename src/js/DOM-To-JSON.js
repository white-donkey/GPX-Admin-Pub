/*
** The following comment is to tell jshint that these items are 
** defined in another file and are globals.
*/

/* exported dom_to_json */

var dom_to_json = (function() {
	"use strict";

var META_TYPE = {
	MT_FILE : "Meta Type File",
	MT_OBJ : "Meta Type Object"
};

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function parseElement (elem) {
	/*jshint validthis: true*/

	//var obj = {tag_name: elem.nodeName.toLowerCase(), attrs: [], val: null};
	var obj = {tag_name: elem.nodeName, attrs: [], val: null};

	if (elem.firstElementChild !== null) {
		obj.val = this.parseGeneration (elem.firstElementChild);
	}
	else {
		obj.val = elem.innerHTML;
	}

	for (var i=0; i<elem.attributes.length; i++) {
		var curr_attr = {};
		curr_attr.name = elem.attributes[i].name;
		curr_attr.value = elem.attributes[i].value;
		obj.attrs.push (curr_attr);
	}

	return obj;
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
function parseGeneration (first) {
	/*jshint validthis: true*/

	var curr_elem = first;
	var obj_lvl = [];

	while (curr_elem !== null) {
		var lvl_elem = this.parseElement (curr_elem);
		obj_lvl.push (lvl_elem);
		curr_elem = curr_elem.nextElementSibling;
	}

	return obj_lvl;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {DOM_To_JSON}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function parseDOM () {
	/*jshint validthis: true*/

	this.the_obj = this.parseGeneration (this.container.firstElementChild);
	return this.the_obj;
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
function DOM_To_JSON (meta_type, container) {
	this.container = container;
	this.the_obj = [];

	if (meta_type === META_TYPE.MT_OBJ) {
		// Nothing yet
	}
	else if (meta_type === META_TYPE.FILE) {
		// Not supported yet
	}
	else {
		console.error ("Invalid META_TYPE!!!! "+meta_type);
	}

	this.parseElement = function (elem) {
		return parseElement.call (this, elem);
	};
	this.parseGeneration = function (first) {
		return parseGeneration.call (this, first);
	};
	this.parseDOM = function () {
		return parseDOM.call (this);
	}; 
}

///////////////////////////////////////////////////////////////////////////////
//  Expose our public data and methods to the outside world
///////////////////////////////////////////////////////////////////////////////
	return {
		parseDOMToJson : function (meta_type, container) {
			var new_instance = new DOM_To_JSON (meta_type, container);

			return new_instance.parseDOM ();
		},
		createAttributesObj : function (obj) {
			var attr_obj;
			if ((obj.attrs !== undefined)&&(obj.attrs !== null)) {
				attr_obj = {};
				obj.attrs.forEach (function (attr) {
					attr_obj[attr.name] = attr.value;
				});
			}

			return attr_obj;
		},
		META_TYPE : META_TYPE
	};
}());
