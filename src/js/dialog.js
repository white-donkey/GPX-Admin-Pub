/* 
Use this example dialog meta as a starting point for defining your dialog 
Note that the defVal property is not required.  If omitted or set to null
the control will not have a default value.
 
var example = {
	title: "Example Dialog Defnition",
	type: DT.CONFIRM_YN,
    controls: [ {
	    id: 0,
		type: CT.TEXT_STATIC,
		label: "Select a checkbox or try entering text."
    }, {
	    id: 1,
		type: CT.TEXT_INPUT,
		label: "Enter some random text"
    }, {
	    id: 2,
		type: CT.CHECKBOX_GROUP,
		group_label: "Group of Check Boxes",
		label:[
		"Check box 1",
		"Check box 2",
		"Check box 3",
		"Check box 4"
		],
		// Default to check box one and 3 being selected
		defVal: ["Check box 1", "Check box 3"]
	}]
};
*/

/*
** The following comment is to tell jshint that these items are 
** defined in another file and are globals.
*/
/* global addNodeToDOM */
/* global removeAllChildElements */

/* exported MHS_Dialog */

var dialog_id_counter = 0;

// Dialog type enum
var DT = {
	FIRST: 0,
	CUSTOM: 0,
	ALERT: 1,
    CONFIRM_YN: 2,
	CONFIRM_OC: 3,
	LAST: 3
};
// Control type enum
var CT = {
	FIRST: 0,
	BUTTON: 0,
	CTRL_BUTTON: 1,
	CHECKBOX_GROUP: 2,
	RADIOBUTTON_GROUP: 3,
	TEXT_INPUT: 4,
	TEXT_STATIC: 5,
	CANVAS: 6,
	HORIZONTAL_BLOCKS: 7,
	LAST: 7
};

function MHS_Dialog (meta) {
	"use strict";

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access public * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function openDialog () {
	/*jshint validthis: true*/
	this.surround.style.display = "block";
	this.mainContainer.style.display = "block";
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access public * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function closeDialog () {
	/*jshint validthis: true*/
	this.surround.style.display = "none";
	this.mainContainer.style.display = "none";
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access public * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function okHandler () {
	/*jshint validthis: true*/

	this.closeDialog ();

	if ((this.meta.ok_cb !== undefined)&&(this.meta.ok_cb !== null)) {
		this.meta.ok_cb ();
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access public * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function cancelHandler () {
	/*jshint validthis: true*/

	this.closeDialog ();
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {MHS_Dialog}
 * This function ... 
 * memberof
 * access public * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function getResponse () {
	/*jshint validthis: true*/
	var thiss = this;

	this.resp_values = [];

	this.meta.controls.forEach (function (ctrl, ctrl_idx) {
		thiss.resp_values.push(thiss.getControlResp (ctrl, ctrl_idx));
	});

	return this.resp_values;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {MHS_Dialog}
 * This function ... 
 * memberof
 * access public * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function getControlResp (ctrl, ctrl_idx) {
	var resp_value = {id: ctrl.id, type: ctrl.type};
	switch (ctrl.type) {
	case CT.HORIZONTAL_BLOCKS:
		let thiss = this;
		ctrl.controls.forEach (function (subCtrl, subCtrl_idx) {
			thiss.resp_values.push(thiss.getControlResp (subCtrl, subCtrl_idx));
		});
		break;
	case CT.CTRL_BUTTON:
		/* Fall through */
	case CT.TEXT_STATIC:
		resp_value.label = ctrl.label;
		resp_value.value = null;
		break;
	case CT.CHECKBOX_GROUP:
		resp_value.group_label = ctrl.group_label;
		var cbnodes = this.mainContainer.querySelectorAll("input[name=cbgroup_"+ctrl.id+"]:checked");
		resp_value.value = [];
		for (var cbnode_idx=0; cbnode_idx<cbnodes.length; cbnode_idx++) {
			resp_value.value.push (cbnodes[cbnode_idx].value);
		}
		break;
	case CT.TEXT_INPUT:
		resp_value.label = ctrl.label;
		// @ts-ignore The value attribute is added to the HTMLElement by
		// this code in the buildCustomDialog function
		resp_value.value = document.getElementById("dialog_"+thiss.id_suffix+"_text_input_"+ctrl.id).value;
		break;
	case CT.RADIOBUTTON_GROUP:
		resp_value.group_label = ctrl.group_label;
		resp_value.value = this.mainContainer.querySelector("input[name=rbgroup_"+ctrl.id+"]:checked");
		//resp_value.value = [];
		//for (var cbnode_idx=0; cbnode_idx<cbnodes.length; cbnode_idx++) {
		//	resp_value.value.push (cbnodes[cbnode_idx].value);
		//}
		break;
	}

	return resp_value;
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {MHS_Dialog}
 * This function ... 
 * memberof
 * access private * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function buildCustomDialog () {
	/*jshint validthis: true*/
/*
	<div id="printPreviewSurround" class="mhs_dialog_surround">
	</div>
	<div id="printPreviewControls" class="mhs_dialog">
		<input id="button_print_ctrl_cancel" class="btn mhs_dialog_button_colors" type="button" onclick="closeDialog();" value="Cancel" style="position: relative; top:5px; left:10px; width: 110px;"/>
	</div>
*/
	var thiss = this;

	this.surround = addNodeToDOM ("div", document.body, "dialog_surround_"+this.id_suffix, "mhs_dialog_surround", "height:"+window.innerHeight+"px; width:"+window.innerWidth+"px;");
	this.mainContainer = addNodeToDOM("div", document.body, "dialog_body_"+this.id_suffix, "mhs_dialog mhs_dialog_text", null);

	if (this.meta.title.trim() !== "") {
		addNodeToDOM("div", this.mainContainer, "dialog_title_"+this.id_suffix, "mhs_dialog_title mhs_dialog_title_text", "font-size:25px;").innerText = this.meta.title.trim();
	}

	var ctrlContainer = addNodeToDOM("div", this.mainContainer, "dialog_ctrl_container_"+this.id_suffix, "mhs_dialog_control_area", "max-height:"+(this.surround.clientHeight-200)+"px;");
	var ctrlButtonContainer = addNodeToDOM ("div", this.mainContainer, "dialog_button_area_"+this.id_suffix, "mhs_dialog_ctrl_button_area", null);

	// Add the controls
	this.meta.controls.forEach (function (ctrl, ctrl_idx) {
		thiss.addControl (ctrl, ctrl_idx, ctrlContainer, ctrlButtonContainer, false);
	});
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * @this {MHS_Dialog}
 * This function ... 
 * memberof
 * access public * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function addControl (ctrl, ctrl_idx, ctrlContainer, ctrlButtonContainer, isInHorizContainer) {
	switch (ctrl.type) {
	case CT.HORIZONTAL_BLOCKS:
		let thiss = this;
		let horizBlockClassList = "mhs-ctrl-section";
		
		if (ctrl_idx !== 0) {
			horizBlockClassList += " mhs-ctrl-section-vert-divider"
		}
		let horizBlock = addNodeToDOM("div", ctrlContainer, "dialog_"+this.id_suffix+"_horizblk_"+ctrl.id, horizBlockClassList, "text-align:left;padding-top:0px;");
		if ((ctrl.label !== undefined) && (ctrl.label !== null) && (ctrl.label.trim() !== "")) {
			addNodeToDOM("div", horizBlock, "dialog_"+this.id_suffix+"_horizblk_"+ctrl.id+"_label", null, "font-weight:bold;margin:10px 5px 0px 5px;").innerText = ctrl.label.trim();
		}
		let horizBlockContainers = []; // TODO: Create array of inline-block divs inside the horizBlock container
		for (let i=0; i<ctrl.controls.length; i++) {
			horizBlockContainers.push (addNodeToDOM("div", horizBlock, "dialog_"+this.id_suffix+"_horizblk_"+ctrl.id+"_block_"+ctrl.controls[i].id, "mhs-ctrl-horizontal-blocks", null));
		}
		ctrl.controls.forEach (function (subCtrl, subCtrl_idx) {
			thiss.addControl (subCtrl, subCtrl_idx, horizBlockContainers[subCtrl_idx], ctrlButtonContainer, true);
		});
		break;
	case CT.CTRL_BUTTON:
		var ctrl_button_node = addNodeToDOM ("input", ctrlButtonContainer, "dialog_"+this.id_suffix+"_button_"+ctrl.id, "mhs_dialog_text btn mhs_dialog_ctrl_button", null);
		ctrl_button_node.setAttribute ("type", "button");
		ctrl_button_node.setAttribute ("value", ctrl.label);
		ctrl_button_node.onclick = ctrl.cb;
		break;
	case CT.TEXT_STATIC:
		addNodeToDOM("div", ctrlContainer, "dialog_"+this.id_suffix+"_text_static_"+ctrl.id, "mhs-ctrl-section"+(ctrl_idx !== 0?(isInHorizContainer?" mhs-ctrl-section-horiz-divider":" mhs-ctrl-section-vert-divider"):""), "text-align:left;").innerHTML = ctrl.label.trim();
		break;
	case CT.CANVAS:
		let canvasClassList = "mhs-ctrl-section";
		if ((ctrl.label !== undefined) && (ctrl.label !== null) && (ctrl.label.trim() !== "")) {
			addNodeToDOM("div", ctrlContainer, "dialog_"+this.id_suffix+"_canvas_"+ctrl.id+"_label", "mhs_dialog_title mhs_dialog_title_text"+(ctrl_idx !== 0?(isInHorizContainer?" mhs-ctrl-section-horiz-divider":" mhs-ctrl-section-vert-divider"):""), "font-size:15px;").innerText = ctrl.label.trim();
		}
		else if (ctrl_idx !== 0) {
			if (isInHorizContainer) {
				canvasClassList += " mhs-ctrl-section-horiz-divider"
			}
			else {
				canvasClassList += " mhs-ctrl-section-vert-divider"
			}
		}
		let canvasIndex = this.canvasDiv.length;
		this.canvasDiv.push (addNodeToDOM("div", ctrlContainer, "dialog_"+this.id_suffix+"_canvas_"+ctrl.id, canvasClassList, "text-align:left;padding-top:0px;"));
		if ((ctrl.height !== undefined) && (ctrl.height !== null)) {
			this.canvasDiv[canvasIndex].style.height = ctrl.height+"px";
		}
		if ((ctrl.width !== undefined) && (ctrl.width !== null)) {
			this.canvasDiv[canvasIndex].style.width = ctrl.width+"px";
		}
		break;
	case CT.CHECKBOX_GROUP:
		var cbgroup_div = addNodeToDOM("div", ctrlContainer, null, "mhs-ctrl-section"+(ctrl_idx !== 0?(isInHorizContainer?" mhs-ctrl-section-horiz-divider":" mhs-ctrl-section-vert-divider"):""), null);
		if ((ctrl.group_label !== undefined)&&(ctrl.group_label !== null)&&(ctrl.group_label.trim() !== "")) {
			addNodeToDOM ("label", addNodeToDOM("div", cbgroup_div, null, null, null), null, null, null).innerText = ctrl.group_label;
		}
		for (var cb_idx=0; cb_idx<ctrl.label.length; cb_idx++) {
			var cblabel = addNodeToDOM ("label", addNodeToDOM("div", cbgroup_div, null, "mhs-rb-cb-group-indent", null), null, null, null);
			var cbinput = addNodeToDOM ("input", cblabel, null, null, null);
			cbinput.setAttribute ("type", "checkbox");
			cbinput.setAttribute ("value", ctrl.label[cb_idx]);
			cbinput.setAttribute ("name", "cbgroup_"+ctrl.id);
			if ((ctrl.defVal !== undefined)&&(ctrl.defVal !== null)&&(Array.isArray(ctrl.defVal))) {
				if (ctrl.defVal.indexOf (ctrl.label[cb_idx]) >= 0) {
					cbinput.setAttribute("checked","checked");
				}
			}
			cblabel.innerHTML +=ctrl.label[cb_idx];
		}
		break;
	case CT.TEXT_INPUT:
		var textarea_div = addNodeToDOM("div", ctrlContainer, null, "mhs-ctrl-section"+(ctrl_idx !== 0?(isInHorizContainer?" mhs-ctrl-section-horiz-divider":" mhs-ctrl-section-vert-divider"):""), null);
		if ((ctrl.label !== undefined)&&(ctrl.label !== null)&&(ctrl.label.trim() !== "")) {
			addNodeToDOM ("label", addNodeToDOM("div", textarea_div, null, null, null), null, null, null).innerText = ctrl.label;
		}
		var textarea_node = addNodeToDOM ("textarea", textarea_div, "dialog_"+this.id_suffix+"_text_input_"+ctrl.id, null, "resize: none; margin-left: 1px;");
		textarea_node.setAttribute ("name", "dialog_"+this.id_suffix+"_text_input"+ctrl.id);
		textarea_node.setAttribute ("rows", ctrl.rows);
		textarea_node.setAttribute ("cols", ctrl.cols);
		if ((ctrl.defVal !== undefined)&&(ctrl.defVal !== null)) {
			textarea_node.value = ctrl.defVal;
		}
		break;
	case CT.RADIOBUTTON_GROUP:
		var rbgroup_div = addNodeToDOM("div", ctrlContainer, null, "mhs-ctrl-section"+(ctrl_idx !== 0?(isInHorizContainer?" mhs-ctrl-section-horiz-divider":" mhs-ctrl-section-vert-divider"):""), null);
		if ((ctrl.group_label !== undefined)&&(ctrl.group_label !== null)&&(ctrl.group_label.trim() !== "")) {
			addNodeToDOM ("label", addNodeToDOM("div", rbgroup_div, null, null, null), null, null, null).innerText = ctrl.group_label;
		}
		for (var rb_idx=0; rb_idx<ctrl.label.length; rb_idx++) {
			var rblabel = addNodeToDOM ("label", addNodeToDOM("div", rbgroup_div, null, "mhs-rb-cb-group-indent", null), null, null, null);
			var rbinput = addNodeToDOM ("input", rblabel, null, null, null);
			rbinput.setAttribute ("type", "radio");
			rbinput.setAttribute ("value", ctrl.label[rb_idx]);
			rbinput.setAttribute ("name", "rbgroup_"+ctrl.id);
			if ((ctrl.defVal !== undefined)&&(ctrl.defVal !== null)) {
				if (ctrl.label[rb_idx] === ctrl.defVal) {
					rbinput.setAttribute("checked","checked");
				}
			}
			rblabel.innerHTML +=ctrl.label[rb_idx];
		}
		break;
	}
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function buildDialog () {
	/*jshint validthis: true*/

	var thiss = this;

	// Do a quick dummy check on the meta structure
	if ((this.meta.type === undefined) || (this.meta.type === null) ||
		(this.meta.type < DT.FIRST) || (this.meta.type > DT.LAST) ||
		(this.meta.title < DT.FIRST) || (this.meta.title > DT.LAST) ||
		(this.meta.controls === undefined) || (this.meta.controls === null) ||
		(!Array.isArray (this.meta.controls))) {
		console.error ("Invalid dialog meta definition: ",this.meta);
		return;
	}
	else {
		// Continue check into the control types
		let invalidControl = false;
		let errMsg = null;
		this.meta.controls.forEach (function (ctrl) {
			if ((ctrl.type === undefined) || (ctrl.type === null) ||
				(ctrl.type < CT.FIRST) || (ctrl.type > CT.LAST) ||
				((ctrl.type !== CT.CANVAS) && ((ctrl.label === undefined) || (ctrl.label === null))) ||
				((ctrl.type === CT.CHECKBOX_GROUP) && ((!Array.isArray(ctrl.label)) || (ctrl.group_label === undefined) || (ctrl.group_label === null))) ||
				((ctrl.type === CT.RADIOBUTTON_GROUP) && ((!Array.isArray(ctrl.label)) || (ctrl.group_label === undefined) || (ctrl.group_label === null)))) {
				errMsg = "Invalid control definition in meta.controls: ";
				console.error (errMsg, ctrl);
				invalidControl = true;
			}
			else if (ctrl.type === CT.TEXT_INPUT) {
				// Set defaults for the cols and rows if they are not defined
				if ((ctrl.rows === undefined)||(ctrl.rows === null)) {
					ctrl.rows = 4;
				}
				if ((ctrl.cols === undefined)||(ctrl.cols === null)) {
					ctrl.cols = 50;
				}
			}
		});
		if (invalidControl) {
			throw new Error (errMsg);
		}
	}

	this.meta.nonCtrlButtonCount = this.meta.controls.length;

	switch (this.type) {
	case DT.CUSTOM:
		break;
	case DT.ALERT:
		this.meta.controls.push ({type:CT.CTRL_BUTTON,label:"OK", cb: function() {
			thiss.okHandler();
		}});
		break;
	case DT.CONFIRM_YN:
		this.meta.controls.push ({type:CT.CTRL_BUTTON,label:"Yes", cb: function() {
			thiss.okHandler();
		}});
		this.meta.controls.push ({type:CT.CTRL_BUTTON,label:"No", cb: function() {
			thiss.cancelHandler();
		}});
		break;
	case DT.CONFIRM_OC:
		this.meta.controls.push ({type:CT.CTRL_BUTTON,label:"OK", cb: function() {
			thiss.okHandler();
		}});
		this.meta.controls.push ({type:CT.CTRL_BUTTON,label:"Cancel", cb: function() {
			thiss.cancelHandler();
		}});
		break;
	default: // Not really needed due to the checks above
		console.error ("Invalid dialog type:"+this.type);
		break;
	}

	buildCustomDialog.call (this);
}

///////////////////////////////////////////////////////////////////////////////
/** 
 * This function ... 
 * memberof
 * access private * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
function removeDialogFromDOM () {
	/*jshint validthis: true*/

	removeAllChildElements (this.surround);
	removeAllChildElements (this.mainContainer);
	this.surround.parentNode.removeChild(this.surround);
	this.mainContainer.parentNode.removeChild(this.mainContainer);
}

///////////////////////////////////////////////////////////////////////////////
/** THIS IS THE ACTUAL GUTS TO THE CONSTRUCTOR!!!!
 * This function ... 
 * memberof
 * access private
 * param 
 * return
 */
///////////////////////////////////////////////////////////////////////////////
	this.meta = meta;
	this.type = meta.type;
	this.resp_values = null;
	this.mainContainer = null;
	this.surround = null;
	this.id_suffix = dialog_id_counter;
	dialog_id_counter++;
	this.canvasDiv = [];

	this.openDialog = function () {
		return openDialog.call (this);
	};
	this.closeDialog = function () {
		return closeDialog.call (this);
	};
	this.okHandler = function () {
		return okHandler.call (this);
	};
	this.cancelHandler = function () {
		return cancelHandler.call (this);
	};
	this.getResponse = function () {
		return getResponse.call (this);
	};
	this.getControlResp = function (ctrl, ctrl_idx) {
		return getControlResp.call (this, ctrl, ctrl_idx);
	};
	this.removeDialogFromDOM = function () {
		return removeDialogFromDOM.call (this);
	};
	this.addControl = function (ctrl, ctrl_idx, ctrlContainer, ctrlButtonContainer, isInHorizContainer) {
		return addControl.call (this, ctrl, ctrl_idx, ctrlContainer, ctrlButtonContainer, isInHorizContainer);
	};

	buildDialog.call (this);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function displayErrorToUser (title, err_str) {
	console.error (err_str);

	displayAlert (title, err_str);
}

///////////////////////////////////////////////////////////////////////////////
/**
 * memberof
 * accesss public
 * param
 * returns
 */
///////////////////////////////////////////////////////////////////////////////
function displayAlert (title, msg) {
	var alert_dlg_meta = {
		title: title,
		type: DT.ALERT,
		controls: [ {
			id: 0,
			type: CT.TEXT_STATIC,
			label: msg
		}]
	};

	var alertDialog = new MHS_Dialog (alert_dlg_meta);

	alertDialog.openDialog();
}
