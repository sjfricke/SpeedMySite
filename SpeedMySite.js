/********************************************
Dependencies
********************************************/
var Nightmare = require('nightmare'); //used to run the headless browser
var nightmare = Nightmare({ show: false }); //default is true
var sanitize = require("sanitize-filename"); //used to make sure file names are correct
var fs = require('fs-extra'); //used to make directory checking eaiser
var argv = require('minimist')(process.argv.slice(2)); //used for easy param parsing

var image_process = require("./helper_functions/image_process"); //set of image processing functions
var sanitization = require("./helper_functions/sanitization");
var __globals = require("./helper_functions/globals"); //used to hold local variables across application;

/********************************************
Param Checking
********************************************/

// --help 
if (argv.help) {
    console.log("-o <folder>\n\tOutput location of resultsn\n");
    console.log("-v\n\tVerbose mode\n");
    console.log("--threshold <value>\n\tAmount of tolerence to give to images being over size\n\tneeds to be value in percent (so over 100) and default is 110%\n"); 
    //console.log("--images\tSettings for any output images");
    //console.log("\t\t[true] -Default, adds a folder for both old and new photos\n\t\t[false] will not save any photos to disk, only shows in report\n\t\t[new] will only save the new photos")
    process.exit(1);
}

// checks for a URL
if (!process.argv[2]) {
    console.log("SpeedMySite needs a URL before it can fix the web\n\ntry:\n\tnode SpeedMySite http://yourSiteToSpeed.up/inserted/here\n");
    console.log("For more options type:\n\tnode SpeedMySite --help");
    process.exit(1);
}
// cleans URL if forgot http cause Nightmare cant use it then
if (process.argv[2].substring(0,4) != "http") process.argv[2] = "https://" + process.argv[2];

// -o
var output_location = argv.o;

// --threshold
if (argv.threshold) {
    if (argv.threshold == NaN  || argv.threshold <= 100) {
        console.log("--threshold needs to be a positive value representing the percentage (so over 100)\n\tdefault is 110%");
        process.exit(1);
    } else {
        argv.threshold = ((argv.threshold / 100) + 1); //valid threshold as a inclusive percent (ex: 110%)
    }
} else {
    argv.threshold = ((10 / 100) + 1); //default - 110%
}

/********************************************
Nightmare (headless browser) sequence
********************************************/
nightmare
    // First go to site
    .goto(process.argv[2])  

    // inject jquery to be able to evaluate DOM
    .inject('js', 'files/jquery.min.js') //TODO, not force pages with jQuery to load

    // runs a console expression on site to extract image details
    .evaluate(function(){
        var all_images = [];
            
        // loops through and gets all the images on page useing jQuery
        $('*').each(function(){ 
            var backImg;
            var good_img = true;
            var temp_object = {}; // need to be reset each loop #async
            
            // image is inline of html
            if ($(this).is('img') ) {
                
                temp_object.image = $(this);
                temp_object.src = ( $(this)[0].src );
                temp_object.display_width = $(this)[0].clientWidth;
                temp_object.display_height = $(this)[0].clientHeight;
                
                all_images.push(temp_object);
                
            } else {
                //image is embedded as a background image via css    
                //uses regex to grab image url from it
                backImg = $(this).css('background-image');
                if (backImg != 'none') {     
                    
                    temp_object.image = $(this);
                    temp_object.display_width = $(this)[0].clientWidth;
                    temp_object.display_height = $(this)[0].clientHeight;
                    
                    var bg_url = $(this).css('background-image');
                    bg_url = /^url\((['"]?)(.*)\1\)$/.exec(bg_url);
                    temp_object.src = ( bg_url[2] );
                    
                    all_images.push(temp_object);
                }
            }            
            //dont push to all_image each time as most of the * are not images            
        }); // end of for each loop
           
        return all_images;
    
    })
    
    // ends nightmare
    .end()
    .then(function (result_dirty) {

	// need to sanitize the data results first
	for (var i = 0; i < result_dirty.length; i++) {
	    if ( sanitization.srcClean(result_dirty[i].src) == false ) {
		continue; //bad data
	    } else {
		__globals.images.push(result_dirty[i]);
	    }
	}

        // TODO, get rid of
        __globals.image_count = __globals.images.length;
        
        if (argv.v) {
            console.log("**************************\n");
            console.log(__globals.image_count + " images found");
            console.log("\n**************************\n");
        }
    
        // creates directory to store files
        var directory_old = (argv.o) ? (argv.o + "/old/") : "SpeedMySite_Results/old/";
        var directory_new = (argv.o) ? (argv.o + "/new/") : "SpeedMySite_Results/new/";
        
    
        // dir has now been created, including the directory it is to be placed in
        fs.ensureDirSync(directory_old, function (err) { console.log(err); })
        fs.ensureDirSync(directory_new, function (err) { console.log(err); })
    
        for (var i = 0; i < __globals.image_count; i++) {  
            
            // makes sure there is a valid src for the iamge
            if (__globals.images[i].src != 'undefined' || __globals.images[i].src != null){   
                
                if (argv.v){console.log(i + ": ");}         
                
                // need to make sure its a valid file name, idk how its saved on the server anyways... TODO
                __globals.images[i].image_name = sanitize(__globals.images[i].src.substring(__globals.images[i].src.lastIndexOf("/") + 1));
                
                // creates full file name
                __globals.images[i].file_name = directory_old + __globals.images[i].image_name;
                
                // sets file size to -1 to easy validate if not changed
                __globals.images[i].file_size = -1;
                
                __globals.counter = 0; //reset counter
                
                // downloads each image by passing in index of loop
                image_process.download(i, function(return_image){            
                                                            
                    //counts to wait to sync/barrier async for all images to download before resizing
                    __globals.counter++;
                    if (argv.v){console.log(return_image + " saved! \t" + __globals.counter + " of " + __globals.image_count);}
                                        
                    // All files have been downloaded
                    if (__globals.counter == __globals.image_count) {  
                        
                        __globals.counter = 0; //reset counter                        
                        if (argv.v){console.log("\n**************************\n");}
                        
                        // checks each image for needed to be resized or not
                        image_process.checkSize(argv.threshold, function(){                            
                            if (argv.v){console.log("\n**************************\n");}
                            
                            // resizes all images marked as too big
                            image_process.resize(directory_new, argv.threshold, function(element){

				if (element == null) {
				    console.log("resize failed");
				} else if (element == 0) {				                                             
				    // check if test passed with no need to resize
				    if (argv.v){console.log("\n**************************\n");}
                                    console.log("SpeedMySite Report:");
                                    console.log("_______________________________________________");
                                    console.log("Files found: " + __globals.image_count);
                                    console.log("Files found for resizing: " + __globals.resize_count);                                    
                                    console.log("CONGRATULATIONS!\nAll photos found were within size");
				    //return <- need?
				}

                                __globals.counter++;
				
				// calls when resized all photos
                                if (__globals.counter == __globals.resize_count) {   
                                    // done, report time                                                       
                                    if (argv.v){console.log("\n**************************\n");}
                                    console.log("SpeedMySite Report:");
                                    console.log("_______________________________________________");
                                    console.log("Files found: " + __globals.image_count);
                                    console.log("Files found for resizing: " + __globals.resize_count);                                    
                                    console.log("Images Resized: ");
                                    for(var i = 0; i < __globals.image_count; i++){
                                        if (__globals.images[i].resize) {
                                            console.log("\t" + __globals.images[i].image_name + " from " + __globals.images[i].file_size + " to " + __globals.images[i].new_file_size + " bytes");
                                        }
                                    } 
                                    console.log("_______________________________________________");
                                    console.log("Old files size: \t" + __globals.size.old + " bytes");
                                    console.log("New files size: \t" + __globals.size.new + " bytes");
                                    console.log("_______________________________________________");
                                    var total_saved = (__globals.size.old - __globals.size.new);
                                    console.log("Total size saved: \t" + total_saved + " bytes");                                    
                                    console.log("\tor\t\t" + (total_saved / 1024).toFixed(3) + " KB");
                                    console.log("\tor\t\t" + (total_saved / 1024 / 1024).toFixed(3) + " MB");
                                }
                                
                                
                            })
                        });
                    }
                    
                });
            }
        }    
        if (argv.v){console.log("\n**************************\n");} //barrier after file and url display
    })
    .catch(function (error) {
        console.error('Search failed:', error);
    }); //end of Nightmare


//Work around to check if jquery is there or not
//.evaluate(function () {if (typeof jQuery != 'undefined') { return jQuery.fn.jquery; } else {  return  jQuery.fn.jquery; }})
