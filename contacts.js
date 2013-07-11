/**
 * Contacts module begins
 */

var $contacts = {};
/**
 * initialize $contacts object, add title, initial query string params and send request
 */
$contacts.init = function(){
	window.clear();
	/**
	 * Reset contacts object so that new data can be populated
	 * Required when returning from menu, because we don't have any way to know
	 * wheather particular object exists in window or not
	 * if typeof $contacts.list is not undefined, no new object is created so none is placed in window
	 * if we dont clear it, new object wont be placed in window and hence user will see no contacts
	 * if we dont clear it and put objects in window any ways, there will be multiple objects in window on each request
	 * this is best i could come up with, let me know if u have better ideas
	 */
	for(var attr in $contacts){
		if(!isFunction($contacts[attr])){
			delete $contacts[attr];
		}
	}

	$contacts.title = new Text(0, 0, window.w, Text.LINE_HEIGHT, "FonB Contacts | * to Search | # to Filter");
	window.add($contacts.title);
	$contacts.FilterSearch = "";
	$contacts.Source = "all";
	$contacts.PageNumber = 1;


	$contacts.request();
}
/**
 * send request to fonb server and get response
 */
$contacts.request = function(){
	var request = new NetRequest();
	var queryString = "Source=" + $contacts.Source + "&FilterSearch=" + encodeURIComponent($contacts.FilterSearch) + "&PageNumber=" + $contacts.PageNumber;
	request.open("get","http://"+ fonb.config.host +"/php/listphonebook.php?" + queryString);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.oncomplete = function(){
		if(request.status == 200){
			$contacts.show(request.responseText);
		}
		else{
			fonb.login.showForm("Error occured while getting contacts. Status code:" + request.status);
		}
	}
	request.send();
}
/**
 * list json response recevied from request method
 * @param  {string} jsonStr response received by requesting listcallhistory.php
 */
$contacts.show = function(jsonStr){
	$contacts.data = JSON.parse(jsonStr);
	if(typeof $contacts.list == "undefined"){
		$contacts.list = new List(0, Text.LINE_HEIGHT+2, window.w, window.h - Text.LINE_HEIGHT);
		$contacts.list.setColumnWidths(20,110,40,0);
		$contacts.scroll = new Scroll(0, Text.LINE_HEIGHT+2, window.w, window.h - Text.LINE_HEIGHT);
		$contacts.scroll.add($contacts.list);

		$contacts.list.onkeycancel = fonb.menu.init;
		$contacts.list.onkeyleft = function(){
			if($contacts.PageNumber > 1){
				$contacts.prev();
			}
			else{
				fonb.menu.init();
			}
		};
		$contacts.list.onkeyright = $contacts.next;
		$contacts.list.onkeyselect = $contacts.dial;
		$contacts.list.onkeystar = $contacts.showSearch;
		$contacts.list.onkeypound = $contacts.showFilters;

		window.add($contacts.scroll);
	}
	else{
		$contacts.list.clear();
	}
	for(var index=0; index<$contacts.data.Contacts.length; index++){
		var contact = $contacts.data.Contacts[index];
		if(contact.FirstName == null){
			contact.FirstName = "";
		}
		if(contact.LastName == null){
			contact.LastName = "";
		}
		var contactCellContent = contact.FirstName + " "  +contact.LastName;
		if($contacts.data.OrderBy === "lname"){
			contactCellContent = contact.LastName + " "  +contact.FirstName;
		}
		$contacts.list.set(index, 0, new Image("app", "ch_" + contact.Source + ".png", 0, 0, 20, Text.LINE_HEIGHT));
		$contacts.list.set(index, 1, contactCellContent.trim());
		$contacts.list.set(index, 2, contact.Label);
		$contacts.list.set(index, 3, contact.PhoneNumber);
	}
	var softKeys = [{
		"label" : "Dial",
		"handler":$contacts.dial
	},{
		"label" : ""
	},
	{
		"label" : ""
	},
	{
		"label" : "Search",
		"handler" : $contacts.showSearch
	},
	{
		"label" : "Filter",
		"handler" : $contacts.showFilters
	},
	{
		"label" : "Logout",
		"handler":fonb.login.logout
	}];
	/**
	 * show next softkey if current page number is less than total page numbers
	 */
	if($contacts.data.CurrentPageNumber < Math.ceil($contacts.data.TotalCount/$contacts.data.PageSize)){
		softKeys[2]={
			"label" : "next",
			"handler" : $contacts.next
		};
	}
	/**
	 * Show prev softkey is current page number is more than one
	 */
	if($contacts.data.CurrentPageNumber > 1){
		softKeys[1] = {
			"label" : "prev",
			"handler" : $contacts.prev
		};
	}
	$contacts.list.setSoftkeysByList(softKeys);
	$contacts.list.onkeyup = $contacts.checkUp;
	$contacts.list.onkeydown = $contacts.checkDown;

	$contacts.list.takeFocus();
}

$contacts.next = function(){
	$contacts.PageNumber++;
	$contacts.request();
}
//if last contact, navigate to next page
$contacts.checkDown = function(){
	//check if selected contact is last one
	//and
	//check if next is there
	if($contacts.list.selected == ($contacts.data.Contacts.length -1) && $contacts.data.CurrentPageNumber < Math.ceil($contacts.data.TotalCount/$contacts.data.PageSize)){
		$contacts.list.onkeydown = null;
		$contacts.next();
	}
	//make sure we go down in case we are not going to next page
	else if($contacts.list.selected <  ($contacts.data.Contacts.length -1)){
		$contacts.list.select($contacts.list.selected + 1);
	}
}
//if first contact, navigate to prev page
$contacts.checkUp = function(){
	//check if selected contact is first
	//check if prev is there
	if($contacts.list.selected == 0 && $contacts.data.CurrentPageNumber > 1){
		$contacts.list.onkeyup = null;
		$contacts.prev();
	}
	//make sure we go up in case we are not going to prev page
	else if($contacts.list.selected > 0){
		$contacts.list.select($contacts.list.selected - 1);
	}
}

$contacts.prev = function(){
	$contacts.PageNumber--;
	$contacts.request();
}

$contacts.dial = function(){
	var number = $contacts.data.Contacts[$contacts.list.selected].PhoneNumber;
	digium.phone.dial({
		"number" : number
	});
}
/**
 * show input text box for search
 */
$contacts.showSearch = function(){
	if(typeof $contacts.searchInput == "undefined"){
		$contacts.searchInput = new Input(0, Text.LINE_HEIGHT+2, window.w, Text.LINE_HEIGHT);
		$contacts.searchInput.setSoftkey(1, "Search", $contacts.search);
		$contacts.searchInput.setSoftkey(2, "Cancel", $contacts.cancelSearch);
		
		$contacts.searchInput.onkeyselect = $contacts.search;
		$contacts.searchInput.onkeycancel = $contacts.cancelSearch;

		$contacts.searchInput.boxType = Widget.ROUNDED_BOX;
		window.add($contacts.searchInput);
	}
	else{
		$contacts.searchInput.visible = true;
	}
	$contacts.searchInput.takeFocus();
	$contacts.list.focusable = false;
}
/**
 * send search request
 */
$contacts.search = function(){
	$contacts.FilterSearch = $contacts.searchInput.value;
	$contacts.searchInput.visible = false;
	$contacts.list.focusable = true;
	$contacts.PageNumber = 1;
	$contacts.request();
}

$contacts.cancelSearch = function(){
	$contacts.searchInput.visible = false;
	$contacts.list.focusable = true;
	$contacts.list.takeFocus();
}
/*Search ends here*/

/**
 * show filter options, can be either of google, highrise, personal or internal
 */
$contacts.showFilters = function(){
	if(typeof $contacts.filterList == "undefined"){
		$contacts.filterOptions = [{
			value: "all",
			label : "All Contacts"
		}, 
		{
			value: "gcontacts",
			label : "Google Contacts"
		}, {
			value : "highrise",
			label : "Highrise Contacts"
		}, {
			value: "mycontacts",
			label: "My Contacts"
		}, {
			value: "internal",
			label: "Extensions"
		}];

		$contacts.filterList = new List(0, Text.LINE_HEIGHT+2, window.w, window.h);

		for(var index=0; index < $contacts.filterOptions.length; index++){
			$contacts.filterList.set(index, 0, $contacts.filterOptions[index].label);
		}
		$contacts.filterList.setSoftkey(1, "Select", $contacts.filter);
		$contacts.filterList.setSoftkey(2, "Cancel", $contacts.cancelFilter);
		$contacts.filterList.onkeyselect = $contacts.filter;
		$contacts.filterList.onkeycancel = $contacts.cancelFilter;
		$contacts.filterList.onkeyleft = $contacts.cancelFilter;
		window.add($contacts.filterList);
	}
	else{
		$contacts.filterList.visible = true;
	}
	$contacts.filterList.takeFocus();
	$contacts.list.focusable = false;
}


$contacts.filter = function(){
	$contacts.Source =$contacts.filterOptions[$contacts.filterList.selected].value;
	$contacts.filterList.visible = false;
	$contacts.list.focusable = true;
	$contacts.PageNumber = 1;
	$contacts.request();
}

$contacts.cancelFilter = function(){
	$contacts.filterList.visible = false;
	$contacts.list.focusable = true;
	$contacts.list.takeFocus();
}

/**
 * ===================contacts module ends====================
 */
/** 
 * This code is required for using require() function in digium api so if you remove it 
 * you might get a lot of does not have method errors
 * putting $contacts in exports! stupid i know, but Digium API is designed this way!
 * @param  {Object} obj object to copy
 * @return {Boolean}    true if function, false if not
 */
isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};

for(var attr in $contacts){
	if(isFunction($contacts[attr])){
		exports[attr] = $contacts[attr];
	}
}