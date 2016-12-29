var Nightmare = require('nightmare'); //used to run the headless browser
var nightmare = Nightmare({ show: false }); //default is true
var image_process = require("./helper_functions/image_process"); //set of image processing functions
var sanitize = require("sanitize-filename"); //used to make sure file names are correct
var fs = require('fs-extra'); //used to make directory checking eaiser

var image_count = 0; //used to count images 

var argv = require('minimist')(process.argv.slice(3)); //used for easy param parsing

//Param Checking
if (!process.argv[2]) {
    console.log("SpeedMySite needs a URL before it can fix the web\n\ntry:\n\tnode SpeedMySite http://yourSiteToSpeed.up/inserted/here\n");
    console.log("For more options type:\n\tnode SpeedMySite --help");
    process.exit(1);
} else if (argv.help) {
    console.log("-o\t\tOutput location of results");
    console.log("--images\tSettings for any output images");
    console.log("\t\t[true] -Default, adds a folder for both old and new photos\n\t\t[false] will not save any photos to disk, only shows in report\n\t\t[new] will only save the new photos")
    process.exit(1);
}

var output_location = argv.o;
var known_black_list = image_process.blackList();

//cleans URL if forgot http cause Nightmare cant use it then
if (process.argv[2].substring(0,7) != "http://") process.argv[2] = "http://" + process.argv[2];

nightmare
    .goto(process.argv[2])  
    .inject('js', 'files/jquery.min.js') //TODO, not force pages with jQuery to load
    .evaluate(function(known_black_list){
        var all_images = [];
            
        //loops through and gets all the images on page useing jQuery
        $('*').each(function(){ 
            var backImg;
            var good_img = true;
            var temp_object = {}; //need to be reset each loop #async
            
            //image is inline of html
            if ($(this).is('img') ) {
                
                //check if image url is on the known black list of URLs
                for(var i = 0; i < known_black_list.length; i++) {
                    if ( $(this)[0].src.indexOf(known_black_list[i]) != -1) {
                        good_img = false;
                        break; //found image on list
                    }
                }
                if (good_img) {                    
                    temp_object.image = $(this);
                    temp_object.src = ( $(this)[0].src );
                    
                    all_images.push(temp_object);
                }
                
            } else {
                //image is embedded as a background image via css    
                //uses regex to grab image url from it
                backImg = $(this).css('background-image');
                if (backImg != 'none') {     
                    
                    temp_object.image = $(this);
                    
                    var bg_url = $(this).css('background-image');
                    bg_url = /^url\((['"]?)(.*)\1\)$/.exec(bg_url);
                    temp_object.src = ( bg_url[2] );
                    
                    all_images.push(temp_object);
                }
            }            
            //dont push to all_image each time as most of the * are not images            
        });       
           
        return all_images;
    
    }, known_black_list)
    .end()
    .then(function (result) {
    
        console.log(result.length + " images found\n");
    
        var directory = (argv.o) ? (argv.o + "/old") : "SpeedMySite_Results/old/";
        
        fs.ensureDirSync(directory, function (err) {
          console.log(err) 
          // dir has now been created, including the directory it is to be placed in
        })
    
        for (var i = 0; i < result.length; i++) {  
            if (result.src != 'undefined' || result.src != null){             
                console.log(i + ": ");                
                              
                var img_name = directory + sanitize(result[i].src.substring(result[i].src.lastIndexOf("/") + 1));
                
                image_process.download(result[i].src, img_name, function(){                    
                    image_count++;
                    console.log("image saved! \t" + image_count + " of " + result.length);
                    
                    if (image_count == result.length) {
                        image_process.checkSize();
                    }
                    
                });
            }
        }
    })
    .catch(function (error) {
        console.error('Search failed:', error);
    }); //end of Nightmare


//Work around to check if jquery is there or not
//.evaluate(function () {if (typeof jQuery != 'undefined') { return jQuery.fn.jquery; } else {  return  jQuery.fn.jquery; }})
