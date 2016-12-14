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
  * `-o` output location of results
   * Example: `node SpeedMySite http://www.google.com -o ~/myOtherFolder`
  * `-images` settings for any output images
   * Options:
     * `true` -Default, adds a folder for both old and new photos
     * `false` will not save any photos to disk, only shows in report
     * `new` will only save the new photos
   * Example: `node SpeedMySite http://www.google.com -images new`
