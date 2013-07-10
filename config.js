/**
 * Config module begins
 * add all config vars here, they will be accessible in methods of other modules by fonb.config.varname
 */

var config = {
	host: "10.0.8.6"
};

/**
 * ===================config module ends====================
 */
/** 
 * This code is required for using require() function in digium api so if you remove it 
 * you might get a lot of does not have property errors
 * putting config in exports! stupid i know, but what can I do if Digium API is designed this way!
 */
for(var attr in config){
	if(config.hasOwnProperty(attr)){
		exports[attr] = config[attr];
	}
}