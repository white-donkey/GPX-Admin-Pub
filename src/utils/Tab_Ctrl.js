/*
** The following comment is to tell jshint that these items are 
** defined in another file and are globals.
*/
/* global addNodeToDOM */
/* global removeAllChildElements */

/* exported tab_ctrl */

var tab_ctrl = (function() {
	"use strict";

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Tab_Ctrl}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function addTab (index, title) {
	/*jshint validthis: true*/
	var tab = {
		tab_nav: null,
		tab_content: null,
		tab_id_suffix: 0
	};
	var thiis = this;

	this.tab_id_suffix++;

	tab.index = index;
	tab.tab_id_suffix = this.tab_id_suffix;
	tab.tab_nav = addNodeToDOM ("li", this.tabs_nav, "tab_nav_"+this.tab_id_suffix, null, "float:left;margin-bottom:-1px;position:relative;display:block;border:1px solid #dddddd;border-bottom:none; border-radius:8px 8px 0px 0px;");
	var tab_anchor = addNodeToDOM ("a", tab.tab_nav, "tab_nav_"+this.tab_id_suffix, null, "margin-right:2px;position:relative;border:1px solid transparent;border-radius:4px 4px 0 0;display:block;padding:10px 15px;");
	tab_anchor.onclick = function () {
		thiis.activateTab(tab.index);
	};
	var tab_label_div = addNodeToDOM ("div", tab_anchor, null, "display:inline-block;", null);
	tab_label_div.innerText = title;
	var tab_close_x = addNodeToDOM ("div", tab_label_div, "tab_nav_close"+this.tab_id_suffix, "tab_nav_close_x", "display: inline-block");
	tab_close_x.innerText = "X";
	tab_close_x.onclick = function () {
		event.stopPropagation();  // Prevent the click on the underlying tab_anchor
		thiis.closeTab (tab.index);
	};
	tab.tab_content = addNodeToDOM ("div", this.tabs_content, "tab_content_"+this.tab_id_suffix, "tab-content-edges", "display: none; white-space: nowrap; overflow: hidden;");

	this.tabs.push (tab);

	// Set the active tab since the order may have changed if a tab was
	// inserted in the middle of the tabs.  We need to make sure the currently
	// seected tab remains selected.  If a tab has never been activated then
	// set the active tab to the first tab.
	if (this.active_tab < 0) {
		this.active_tab = 0;
	}
	this.activateTab (this.active_tab);

	return tab.tab_content;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Tab_Ctrl}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function activateTab (index) {
	/*jshint validthis: true*/
	var thiis = this;

	this.active_tab = index;
	this.tabs.forEach (function (tab, i){
		if (i === thiis.active_tab) {
			// Activate tab
			tab.tab_nav.style.paddingBottom = "1px";
			tab.tab_nav.style.background = "royalblue";
			tab.tab_nav.style.color = "white";
			tab.tab_content.style.display = "block";
		}
		else {
			// Deactivate tab
			tab.tab_nav.style.paddingBottom = "0px";
			tab.tab_nav.style.background = "#f3f3f3"; //background:#f3f3f3; 
			tab.tab_nav.style.color = "black";
			tab.tab_content.style.display = "none";
		}
	});

	if ((this.tabActivating_cb !== undefined)&&(this.tabActivating_cb !== null)) {
		this.tabActivating_cb (this.active_tab);
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {Tab_Ctrl}
 * This function ... 
 * memberof
 * access private 
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function closeTab (index) {
	/*jshint validthis: true*/

	// Make sure this file has a tab open.  But still call the callback even
	// if it doesn't
	this.tabClosing_cb (index);
	
	if ((this.tabs[index] !== undefined)&&(this.tabs[index] !== null)) {
		// First remove all the DOM stuff
		removeAllChildElements (this.tabs[index].tab_nav);
		this.tabs_nav.removeChild (this.tabs[index].tab_nav);
		removeAllChildElements (this.tabs[index].tab_content); 
		this.tabs_content.removeChild (this.tabs[index].tab_content);

		// Now remove the tab object
		this.tabs.splice (index, 1);

		// Fix up the index stored in all of the tab objects that are after
		// the one being closed
		for (var i=index; i<this.tabs.length; i++) {
			this.tabs[i].index--;
		}
		
		// Check if the tab being closed is the currently active tab or after the
		// currently active tab.  If it is we need to fiddle with the active tab
		if (this.tabs.length >= 1) {
			if (this.active_tab >= index) {
				if (this.active_tab === index) {
					if (index < this.tabs.length-1) {
						this.activateTab (this.active_tab);
					}
					else {
						// Special case for the last tab in the series
						this.activateTab (this.active_tab-1);
					}
				}
				else {
					this.activateTab (this.active_tab-1);
				}
			}
		}
		else {
			this.active_tab = -1;
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
function fillTabContentHTML (index, html) {
	/*jshint validthis: true*/
	this.tabs[index].tab_content = html;
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
function Tab_Ctrl (container, close_cb, activate_cb) {
	this.tabs = [];
	this.tab_container = container;
	this.tabs_nav = null;
	this.tabs_content = null;
	this.active_tab = -1;
	this.tabClosing_cb = close_cb;
	this.tabActivating_cb = activate_cb;
	this.tab_id_suffix = 0;

	this.addTab = function (index, title) {
		return addTab.call (this, index, title);
	};
	this.activateTab = function (index) {
		return activateTab.call (this, index);
	};
	this.closeTab = function (index) {
		return closeTab.call (this, index);
	};
	this.fillTabContentHTML = function (index, html) {
		return fillTabContentHTML.call (this, index, html);
	};

	//First, clear all DOM elements out of the container
	removeAllChildElements (this.tab_container);

	this.tabs_nav = addNodeToDOM ("ul", container, null, null, "height:41px; border-bottom:1px solid #dddddd;margin-bottom:0px; padding-left:0px;list-style:none; padding-bottom:1px;");
	this.tabs_content = addNodeToDOM ("div", container, "tab_content", null, null);
}

///////////////////////////////////////////////////////////////////////////////
//  Expose our public data and methods to the outside world
///////////////////////////////////////////////////////////////////////////////
	return {
		createTabCtrl : function (container, close_cb, activate_cb) {
			var new_instance = new Tab_Ctrl (container, close_cb, activate_cb);
			
			return new_instance;
		}
	};
}());
