/*
** The following comment is to tell jshint that these items are 
** defined in another file and are globals.
*/
/* global addNodeToDOM */

/* exported collapsible_panel */

var collapsible_panel = (function() {
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
function getPanelContentDiv () {
	/*jshint validthis: true*/
	return this.panel_contents;
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
function setPanelTitle (title) {
	/*jshint validthis: true*/
	this.panel_ctrl.children[1].innerText = title;
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
function setPanelTitleTextColor (color) {
	/*jshint validthis: true*/
	this.panel_ctrl.style.color = color;
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
function addButtonToPanelTitleBar (text, onclick_action) {
	/*jshint validthis: true*/
	this.panel_ctrl_button.style.display = "inline-block";
	this.panel_ctrl_button.setAttribute ("value", text);
	this.panel_ctrl_button.onclick = onclick_action;
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
function removeButtonfromPanelTitleBar () {
	/*jshint validthis: true*/
	this.panel_ctrl_button.style.display = "none";
	this.panel_ctrl_button.setAttribute ("value", "");
	this.panel_ctrl_button.onclick = null;
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
function Collapsible_Panel (container, toggle_cb, ctrl_styling) {
	var thiis = this;

	this.panel_container = container;
	this.panel = null;
	this.panel_ctrl = null;
	this.panel_contents = null;
	this.toggle_cb = toggle_cb;

	this.getPanelContentDiv = function () {
		return getPanelContentDiv.call (this);
	};
	this.setPanelTitle = function (title) {
		return setPanelTitle.call (this, title);
	};
	this.setPanelTitleTextColor = function (color) {
		return setPanelTitleTextColor.call (this, color);
	};
	this.addButtonToPanelTitleBar = function (text, onclick_action) {
		return addButtonToPanelTitleBar.call (this, text, onclick_action);
	};
	this.removeButtonfromPanelTitleBar = function () {
		return removeButtonfromPanelTitleBar.call (this);
	};

	//First, clear all DOM elements out of the container
	//removeAllChildElements (this.tab_container);

	this.panel = addNodeToDOM ("div", container, null, null, "border:1px solid #dddddd; padding:5px 2px; border-radius:4px;");
	this.panel_ctrl = addNodeToDOM ("div", this.panel, null, null, ctrl_styling);
	// Add +/- symbol to show collpased status
	addNodeToDOM ("span", this.panel_ctrl, null, null, "margin-right: 4px;").innerText = "+";
	// Add title text span
	addNodeToDOM ("span", this.panel_ctrl, null, null, null);
	// Add a button that defaults to hidden
	// <input class=\"gpx_button\"type=\"button\" value=\"Save as file\" style=\"margin: 0px 0px 5px 5px;\">"+
	this.panel_ctrl_button = addNodeToDOM ("input", this.panel_ctrl, null, null, "display: none; border:1px solid #ccc; color:#314790; border-radius:4px; text-align:center; background:white; margin: 0px 0px 5px 5px;");
	this.panel_ctrl_button.setAttribute ("type", "button");
	this.panel_ctrl_button.setAttribute ("value", "Control");
	this.panel_contents = addNodeToDOM ("div", this.panel, null, null, "padding: 2px 18px;display: none;overflow: hidden;");
	this.panel_ctrl.addEventListener ("click", function () {
		if (thiis.panel_contents.style.display === "block") {
			thiis.panel_contents.style.display = "none";
			this.children[0].innerText = "+";
		}
		else {
			thiis.panel_contents.style.display = "block";
			this.children[0].innerText = "-";
		}
		if ((thiis.toggle_cb !== undefined)&&(thiis.toggle_cb !== null)) {
			thiis.toggle_cb(thiis.panel_contents.style.display === "block"?true:false);
		}
	});
}

///////////////////////////////////////////////////////////////////////////////
//  Expose our public data and methods to the outside world
///////////////////////////////////////////////////////////////////////////////
	return {
		createPanel : function (container, toggle_cb) {
			var new_instance = new Collapsible_Panel (container, toggle_cb, "background-color: #777;color: white;cursor: pointer;padding: 18px;border: none; border radius: 4px 4px 0px 0px; text-align: left;outline: none;font-size: 15px;");
			
			return new_instance;
		},
		createSubPanel : function (container, toggle_cb) {
			var new_instance = new Collapsible_Panel (container, toggle_cb, "background-color: #777;color: white;cursor: pointer;padding: 3px 18px;border: none; border radius: 4px 4px 0px 0px; text-align: left;outline: none;font-size: 15px;");
			
			return new_instance;
		}
	};
}());

