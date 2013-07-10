var fonb = {};

fonb.util = require('util');
fonb.config = require("config");

/**
 * We will follow these conventions when importing modules in this app:
 * - Module name will be prepended with $ and saved in $moduleName for use in same module and fonb.moduleName 
 * for reference by other modules which can't access $moduleName 
 */
fonb.login = $login = require("login");
fonb.menu = $menu = require("menu");
fonb.contacts = $contacts = require("contacts");
fonb.callhistory = $callhistory = require("callhistory");

//initialzing app
$login.init();