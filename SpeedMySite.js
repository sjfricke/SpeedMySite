var Nightmare = require('nightmare'); //used to run the headless browser
var nightmare = Nightmare({ show: false }); //default is true

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

//cleans URL if forgot http cause Nightmare cant use it then
if (process.argv[2].substring(0,7) != "http://") process.argv[2] = "http://" + process.argv[2];

nightmare
    //  .goto('http://spencerfricke.com/webgl/')  
//    .goto('http://stackoverflow.com/questions/8641596/how-to-get-all-images-from-img-tag-and-background-images-from-html-page-using-jq')  
    .goto(process.argv[2])  
    .inject('js', 'files/jquery.min.js') //TODO, not force pages with jQuery to load
    //Work around to check if jquery is there or not
    //.evaluate(function () {if (typeof jQuery != 'undefined') { return jQuery.fn.jquery; } else {  return  jQuery.fn.jquery; }})
    .evaluate(function(){
        var image_list = [];
        //loops through and gets all the images on page
        //uses jQuery
        $('*').each(function(){ 
            var backImg;
            
            if ($(this).is('img')) {
                image_list.push($(this));
            } else {
                backImg = $(this).css('background-image');
                if (backImg != 'none') {
                    image_list.push($(this));
                }
            }
        });
    
        return image_list.length;
    })
    .end()
    .then(function (result) {
        console.log(result)
    })
    .catch(function (error) {
    console.error('Search failed:', error);
    });