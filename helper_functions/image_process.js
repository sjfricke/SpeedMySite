var fs = require('fs');
var request = require('request');
var sizeOf = require('image-size');

module.exports = {
    
    download: function(uri, file_name, image_name, callback){
        
        console.log("\turi: " + uri);
        console.log("\tfile name: " + file_name);
        
        request.head(uri, function(err, res, body){
            //console.log('content-type:', res.headers['content-type']);
            //console.log('content-length:', res.headers['content-length']);
            
            //downloads and sends callback when done
            request(uri).pipe(fs.createWriteStream(file_name)).on('close', function(){
                callback(image_name);
            });
      });
    },
    
    checkSize: function(image_list, threshold, callback) {
        var fix_list = [];
        for (var i = 0; i < image_list.length; i++) {
              
            //gets actual photo size
            var dimensions = sizeOf(image_list[i].file_name);
            image_list[i].old_width = dimensions.width;
            image_list[i].old_height = dimensions.height;
            
            //checks if size is out of size range
            //give 10% margin by default
            if ((image_list[i].old_width >= image_list[i].display_width * (1 + threshold)) &&
                (image_list[i].old_height >= image_list[i].display_height * (1 + threshold))
            ) {
                image_list[i].resize = true;
                image_list[i].new_width = image_list[i].display_width * (1 + threshold);
                image_list[i].new_height = image_list[i].display_height * (1 + threshold);
            } else {
                image_list[i].resize = false; //better to have false then undefined
            }
            
            console.log(image_list[i].image_name + "\n\t\t width: " + image_list[i].old_width + " should be: " + image_list[i].display_width + "\n\t\t height: " + image_list[i].old_height + " should be: " + image_list[i].display_height);
        }
        callback(image_list);
    },    
    
    resize: function(image_list, directory, callback) {
          
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