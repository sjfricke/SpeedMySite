// Different function to help sanitize data

var __globals = require("./globals");

module.exports = {

    // used to check file against black list from global list
    // returns true if clear, false if found in list
    fileTypeCheck: function(file_src) {

	// checks prefix
	for(var i = 0; i < __globals.file_blacklist_prefix.length; i++) {
            if ( file_src.indexOf(__globals.file_blacklist_prefix[i]) == 0 ) {
                return false;
            }
        }

	// checsk suffix
	for(var i = 0; i < __globals.file_blacklist_suffix.length; i++) {
            if ( file_src.endsWith(__globals.file_blacklist_suffix[i]) ) {
                return false;
            }
        }
    }
}
