var gpxAdminInstance = null;
	
function initApp () {
	const inputElement = document.getElementById("gpx_file_input");
	inputElement.style.display="none";
	inputElement.addEventListener("change", handleFiles, false);
	let devDiv = document.getElementById ("dev_ver_div");
	let pubDiv = document.getElementById ("pub_ver_div");
	getPubVersionDisplay.call (pubDiv);
	getDevVersionDisplay.call (devDiv);
	
	if (gpxAdminInstance === null) {
		gpxAdminInstance = gpx_admin.startAdmin (DSTU.NM);
	}

	/**
 	* @this {HTMLInputElement}
 	*/
	function handleFiles() {
		if ((this !== undefined) && (this !== null)&&
			(this.files !== undefined)&&(this.files !== null)) {
			for (var i=0; i<this.files.length; i++) {
				//@ts-ignore Adding my own property to File that is used by openFile
				this.files[i].mode = static_GPX_File.FM.READ;
				gpxAdminInstance.openFile (this.files[i]);
			}
			
			// Reset value so that "change" will fire again if we are opening a
			// file with the same name as the last file opened
			this.value = null;
		}
	}
}

function openMergeDialog () {
	gpxAdminInstance.queryMergeContents();
}

var isPublished = false;

function isPublishedVersion () {
	let retVal = false;

	if ((isPublished !== undefined)&&(isPublished !== null)&&(isPublished)) {
		retVal = true;
	}

	return retVal;
}

function getPubVersionDisplay () {
	if ((this !== undefined)&&(this !== null)) {
		if (isPublishedVersion ()) {
			//console.log ("Published version so displaying published version number.");
			this.style.display = "inline-block";
		}
		else {
			//console.log ("Hiding published version number");
			this.style.display = "none";
		}
	}
	else {
		console.error ("Pub Div is undefined!");
	}
}

function getDevVersionDisplay () {
	if ((this !== undefined)&&(this !== null)) {
		if (!isPublishedVersion ()) {
			//console.log ("Development version so displaying development version number.");
			this.style.display = "inline-block";
		}
		else {
			//console.log ("Hiding development version number");
			this.style.display = "none";
		}
	}
	else {
		console.error ("Dev Div is undefined!");
	}
}