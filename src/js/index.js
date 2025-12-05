var gpxAdminInstance = null;
	
function initApp () {
	const inputElement = document.getElementById("gpx_file_input");
	inputElement.style.display="none";
	inputElement.addEventListener("change", handleFiles, false);
	
	if (gpxAdminInstance === null) {
		gpxAdminInstance = gpx_admin.startAdmin (DSTU.NM);
	}

	function handleFiles() {	
		for (var i=0; i<this.files.length; i++) {
			this.files[i].mode = static_GPX_File.FM.READ;
			gpxAdminInstance.openFile (this.files[i]);
		}
	}
}

function openMergeDialog () {
	gpxAdminInstance.queryMergeContents();
}