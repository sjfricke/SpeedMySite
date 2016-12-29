var fs = require('fs');
var request = require('request');

module.exports = {
    
    download: function(uri, filename, callback){
        
        console.log("\turi: " + uri);
        console.log("\tfilename: " + filename);
        
        request.head(uri, function(err, res, body){

            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
      });
    },
    
    checkSize: function() {
        console.log("check  your self");  
    },    
    
    //used to return an array of known black list sites
    //"blacklist" refers to sources of images not to check
    //example: google maps
    blackList: function() {
        return [
            "https://maps.googleapis.com",
            "https://maps.gstatic.com"
        ]
    }
    
}