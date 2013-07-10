/**
 * Menu section
 */
var $menu = {};
/**
 * initializes menu after successful login.
 */
$menu.init = function(){
	window.clear();
	if(typeof $menu.title == "undefined" && typeof $menu.list == "undefined"){
		$menu.title = new Text(0, 0, window.w, Text.LINE_HEIGHT, "FonB App Menu");
		$menu.list = new List(0, Text.LINE_HEIGHT+2, window.w, window.h);
		$menu.list.set(0,0, new Image("app", "contacts.png", 0, 0, 20, Text.LINE_HEIGHT));
		$menu.list.set(0,1, "Call History");
		$menu.list.set(1,0,  new Image("app", "callhistory.png", 0, 0, 20, Text.LINE_HEIGHT));
		$menu.list.set(1,1, "Contacts");
		$menu.list.setColumnWidths(20, 0);

		$menu.list.setSoftkey(1, "Select", $menu.openSelected);
		$menu.list.setSoftkey(4, "Logout", fonb.login.logout);
		$menu.list.onkeyselect = $menu.openSelected;
		$menu.list.onkeyright = $menu.openSelected;
		$menu.list.onkeycancel = fonb.login.logout;
		$menu.list.onkeyleft = fonb.login.logout;
	}
	window.add($menu.title, $menu.list);

	$menu.list.takeFocus();
}
/**
 * triggered when user pushes softkey one on any menu item
 */
$menu.openSelected = function(){
	switch($menu.list.selected){
		case 0://call history
			fonb.callhistory.init();
			break;
		case 1://contacts
			fonb.contacts.init();
			break;
	}
}
/**
 * ===================Menu module ends====================
 */
/**
 * This code is required for using require() function in digium api so if you remove it 
 * you might get a lot of does not have method errors
 * putting $menu in exports! stupid i know, but Digium API is designed this way!
 * @param  {Object} obj object to copy
 * @return {Boolean}    true if function, false if not
 */
isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};

for(var attr in $menu){
	if(isFunction($menu[attr])){
		exports[attr] = $menu[attr];
	}
}