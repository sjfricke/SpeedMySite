var fs = require('fs'); // used to read and write to file
var request = require('request'); // used to download
var sizeOf = require('image-size'); // used to get size
var resizeImg = require('resize-img');
var argv = require('minimist')(process.argv.slice(2)); // only used for -v verbose of console.logs()

var __globals = require("./globals"); // used to hold local variables across application;


// These functions are exported to modulize the files
// Have created functions to use global array
module.exports = {

    // used to download file from src
    download: function(index, callback){

        var uri = __globals.images[index].src;
        var file_name = __globals.images[index].file_name;
        var image_name = __globals.images[index].image_name;

        if (argv.v){console.log("\turi: " + uri);}
        if (argv.v){console.log("\tfile name: " + file_name);}

        request.head(uri, function(err, res, body){

            if (argv.v){console.log("attempting: " + image_name);} // res.headers['content-type']

            // file size in bytes, note 1024 not 1000 from bytes to KB
            __globals.images[index].file_size = res.headers['content-length'];

            // downloads and sends callback when done
            request(uri).pipe(fs.createWriteStream(file_name))
            .on('close', function(){
                callback(image_name);
            })
            .on('error', function(err){
                console.error("DOWNLOAD ERROR:");
                console.error(err);
            });
      });
    }, //download end

    // used to check size and see if file needs resizing
    checkSize: function(threshold, callback) {
        var fix_list = [];
        for (var i = 0; i < __globals.images.length; i++) {

            // gets actual photo size
	    try {
		var dimensions = sizeOf(__globals.images[i].file_name);
		__globals.images[i].old_width = dimensions.width;
		__globals.images[i].old_height = dimensions.height;
	    } catch (e) {
		console.log("\nWARNING: " + __globals.images[i].file_name + "exceeded the buffer limit of the check size library...Going to assume the image is TOO LARGE!!!\n");
		__globals.images[i].old_width = 2048;
		__globals.images[i].old_height = 2048;
	    }

            // checks if size is out of size range
            // give 10% margin by default
	    if (__globals.images[i].display_width < 1 || __globals.images[i].display_height < 1) {
		// checks if size is zero as it throws error in resizer
		__globals.images[i].resize = false;
		__globals.images[i].zero = true;
	    } else  if ((__globals.images[i].old_width >= __globals.images[i].display_width * threshold) &&
                (__globals.images[i].old_height >= __globals.images[i].display_height * threshold)
            ) {
                __globals.images[i].resize = true;
                __globals.size.old += parseInt(__globals.images[i].file_size); // to compare to size resized
                __globals.resize_count++;
                __globals.images[i].new_width = Math.floor(__globals.images[i].display_width * threshold);
                __globals.images[i].new_height = Math.floor(__globals.images[i].display_height * threshold);
            } else {
                __globals.images[i].resize = false; // better to have false then undefined
            }

            // prints out width and heights of display and download size
            if (argv.v){
		if (__globals.images[i].zero) {
		    console.log(__globals.images[i].image_name + "\n\t\t No display size found! ");
		} else {
		    console.log(__globals.images[i].image_name + "\n\t\t width: " + __globals.images[i].old_width + " should be: " + __globals.images[i].display_width + "\n\t\t height: " + __globals.images[i].old_height + " should be: " + __globals.images[i].display_height);
		}
            }
	}
        callback();
    }, // checkSize end

    // directory passed in is new directory to place new photos
    resize: function(directory, threshold, callback) {

	// checks here for passed site with no resize
	// will just return and never callback otherwise
	if (__globals.resize_count == 0) {
	    callback(0);
	}

        __globals.images.forEach(function(element, index, array) {
            if (!element.resize) {
                return; // skip image, its all good
            } else {
		 resizeImg(fs.readFileSync(element.file_name), {width : element.new_width, height : element.new_height} )
                .then(function(buf){
                    fs.writeFileSync(directory + element.image_name, buf);

                    if (argv.v){console.log("Resized file wrote to: " + directory + element.image_name);}

                    __globals.images[index].new_file_size = buf.byteLength;
                    __globals.size.new += buf.byteLength;

                    callback(element);
                })
		.catch(function(err){
		    console.log(err);
		    console.log("RESIZE FAILED");
		    callback(null);
		});
            }
        }); //forEach end
    } //resize end
} //module export end
