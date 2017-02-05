// Different function to help sanitize data

var __globals = require("./globals");

module.exports = {

    // used to check file against black list from global list
    // returns true if clear, false if found in list
   srcClean: function(file_src) {

       var i;
	    
       // checks prefix
       for ( i = 0; i < __globals.file_blacklist_prefix.length; i++) {
	   if ( file_src.indexOf(__globals.file_blacklist_prefix[i]) == 0 ) {
               return false;
	   }
       }
       
       // check suffix
       for ( i = 0; i < __globals.file_blacklist_suffix.length; i++) {
	   if ( file_src.endsWith(__globals.file_blacklist_suffix[i]) ) {
               return false;
	   }
       }
       
       // checks site black list
       // makes sure its not ANYWHERE in url
       for ( i = 0; i < __globals.site_blacklist.length; i++) {
	   if ( file_src.indexOf(__globals.site_blacklist[i]) != -1 ) {
               return false;
	   }
       }
   }

}
