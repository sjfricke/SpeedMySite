# SpeedMySite
A Nodejs tool that can be used to clean up the load time of websites by finding the issues that are slowing it down for no reason

It will output a folder with a write up of what you can do to speed up the site, if no parameter is passed it will set the folder by default to the top level as `/SpeedMySite_Results`

-------

## How To Setup
1. The first thing you need to do is clone the repo
`git clone https://github.com/sjfricke/SpeedMySite.git`

2. go to the cloned repo directory and run
`npm install`

3. Run the script with one of the flags below
`node SpeedMySite <my_site_ur> [additional parameters]`

## Parameters and examples

  * No parameters
	* Example: `node SpeedMySite http://www.google.com`
  * `-o` Output location of results
	* Example: `node SpeedMySite http://www.google.com -o ~/myOtherFolder`
  * `-v` Verbose mode
	* Example: `node SpeedMySite http://www.google.com -o ~/myOtherFolder -v`
  * `--threshold` Amount of tolerence to give to images being over size
	* Values represent percent, so value needs to be over 100
	* Default: 110%
	* Example: `node SpeedMySite http://www.google.com --threshold 200` 
	
## Current Issues

* Have found I still need to work on a way to correctly get photos when they are sized and styled with background css attributes. Also dynamically loaded pages (like angular site) that don't have the image up don't have a display size so will need to find the size in the css.
* Duplicate - it catches duplicates and handles it correctly, but I want to fix it to display in report, otherwise it will say `n` images fixed and only show `n-1` images in the folder
* resize-img node modules seems to not want to work on Windows, will need to figure that out as well
* Files type
  * .gif
  * .svg
  * data:images (base64)
