/**
 * callhistory section
 */
var $callhistory = {};
/**
 * initializes callhistory after successful login.
 */
$callhistory.init = function(){
	window.clear();
	/**
	 * see comments in callhistory.js init function
	 */
	for(var attr in $callhistory){
		if(!isFunction($callhistory[attr])){
			delete $callhistory[attr];
		}
	}

	$callhistory.title = new Text(0, 0, window.w, Text.LINE_HEIGHT, "FonB Call History | * to Search | # to Filter");
	window.add($callhistory.title);
	$callhistory.any = "";
	$callhistory.ShowByDirection = "all";
	$callhistory.pagenumber = 1;


	$callhistory.request();
}

/**
 * send request to listphonebook.php with proper query params and get response
 */
$callhistory.request = function(){
	var request = new NetRequest();
	var queryString = "ShowByDirection=" + $callhistory.ShowByDirection + "&any=" + encodeURIComponent($callhistory.any) + "&pagenumber=" + $callhistory.pagenumber + "&ShowByUser=null&ShowByDate=&hasattachment=off&calldate=&submit=search1";
	request.open("get","http://"+ fonb.config.host +"/php/listcallhistory.php?" + queryString);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.oncomplete = function(){
		if(request.status == 200){
			$callhistory.show(request.responseText);
		}
		else{
			fonb.login.showForm("Error occured while getting call history. Status code:" + request.status);
		}
	}
	request.send();
}
/**
 * list call history data
 * @param  {string} jsonStr text response received from request method
 */
$callhistory.show = function(jsonStr){
	$callhistory.data = JSON.parse(jsonStr);
	if(typeof $callhistory.list == "undefined"){
		$callhistory.list = new List(0, Text.LINE_HEIGHT+2, window.w, window.h - Text.LINE_HEIGHT);
		$callhistory.list.setColumnWidths(20,80,60,30,0);
		$callhistory.scroll = new Scroll(0, Text.LINE_HEIGHT+2, window.w, window.h - Text.LINE_HEIGHT);

		$callhistory.list.onkeycancel = fonb.menu.init;
		$callhistory.list.onkeyleft = function(){
			if($callhistory.pagenumber > 1){
				$callhistory.prev();
			}
			else{
				fonb.menu.init();
			}
		};
		$callhistory.list.onkeyright = $callhistory.next;
		$callhistory.list.onkeyselect = $callhistory.dial;
		$callhistory.list.onkeystar = $callhistory.showSearch;
		$callhistory.list.onkeypound = $callhistory.showFilters;

		$callhistory.scroll.add($callhistory.list);
		window.add($callhistory.scroll);
	}
	else{
		$callhistory.list.clear();
	}
	for(var index=0; index<$callhistory.data.CallHistoryList.length; index++){
		var callhistory = $callhistory.data.CallHistoryList[index];
		var callerClid = callhistory.CallerClid;
		var firstName = "";
		var lastName = "";
		var sources = [];
		if(typeof callerClid.Internal != "undefined"){
			sources.push("internal");
			firstName = callerClid.Internal;
		}
		if(typeof callerClid.MyContacts != "undefined"){
			sources.push("mycontacts");
			if(firstName == ""){
				firstName = callerClid.MyContactsFirstName;
				lastName = callerClid.MyContactsLastName;
			}
		}
		if(typeof callerClid.GContacts != "undefined"){
			sources.push("gcontacts");
			if(firstName == "" && lastName == ""){
				firstName = callerClid.GContactsFirstName;
				lastName = callerClid.GContactsLastName;
			}
		}
		if(typeof callerClid.Highrise != "undefined"){
			sources.push("highrise");
			if(firstName == "" && lastName == ""){
				firstName = callerClid.HighriseFirstName;
				lastName = callerClid.HighriseLastName;
			}
		}
		if(firstName == "" && lastName == ""){
			firstName = callerClid.Num;
		}
		var completeName = (firstName + " "  + lastName).trim();
		var date = callhistory.DateSummary;
		if(!date.match(/^\d\d?:\d\d? PM|AM/i)){
			date = date.replace(/ ?\d\d?:\d\d? PM|AM/i, '');
		}

		$callhistory.list.set(index, 0, new Image("app", callhistory.Direction + "_Call.png", 0, 0, 20, Text.LINE_HEIGHT));
		$callhistory.list.set(index, 1, completeName);

		var imageGroup = new Group(0,0,60,Text.LINE_HEIGHT);
		for(var sourceIndex = 0; sourceIndex < sources.length; sourceIndex++){
			imageGroup.add(new Image("app", "ch_" + sources[sourceIndex] + ".png", (sourceIndex+1)*13,0,13,Text.LINE_HEIGHT));
		}
		if(!callhistory.Duration){
			callhistory.Duration = "xxxx";
		}
		$callhistory.list.set(index, 2, imageGroup);
		$callhistory.list.set(index, 3, callhistory.Duration);
		$callhistory.list.set(index, 4, date);
	}
	var softKeys = [{
		"label" : "Dial",
		"handler":$callhistory.dial
	},{
		"label" : ""
	},
	{
		"label" : ""
	},
	{
		"label" : "Search",
		"handler" : $callhistory.showSearch
	},
	{
		"label" : "Filter",
		"handler" : $callhistory.showFilters
	},
	{
		"label" : "Logout",
		"handler":fonb.login.logout
	}];
	/**
	 * show next softkey if current page number is less than total page numbers
	 */
	if($callhistory.data.CurrentPageNumber < Math.ceil($callhistory.data.TotalCount/$callhistory.data.PageSize)){
		softKeys[2]={
			"label" : "next",
			"handler" : $callhistory.next
		};
	}
	/**
	 * Show prev softkey is current page number is more than one
	 */
	if($callhistory.data.CurrentPageNumber > 1){
		softKeys[1] = {
			"label" : "prev",
			"handler" : $callhistory.prev
		};
	}

	$callhistory.list.onkeyup = $callhistory.checkUp;
	$callhistory.list.onkeydown = $callhistory.checkDown;
	$callhistory.list.setSoftkeysByList(softKeys);
	$callhistory.list.takeFocus();
}

$callhistory.next = function(){
	$callhistory.pagenumber++;
	$callhistory.request();
}

//if last record, navigate to next page
$callhistory.checkDown = function(){
	//check if selected record is last one
	//and
	//check if next is there
	if($callhistory.list.selected == ($callhistory.data.callhistory.length -1) && $callhistory.data.CurrentPageNumber < Math.ceil($callhistory.data.TotalCount/$callhistory.data.PageSize)){
		$contacts.list.onkeydown = null;
		$callhistory.next();
	}
	//make sure we go down in case we are not going to next page
	else if($callhistory.list.selected <  ($callhistory.data.callhistory.length -1)){
		$callhistory.list.select($callhistory.list.selected + 1);
	}
}

$callhistory.prev = function(){
	$callhistory.pagenumber--;
	$callhistory.request();
}
//if first record, navigate to prev page
$callhistory.checkUp = function(){
	//check if selected record is first
	//check if prev is there
	if($callhistory.list.selected == 0 && $callhistory.data.CurrentPageNumber > 1){
		$contacts.list.onkeyup = null;
		$callhistory.prev();
	}
	//make sure we go up in case we are not going to prev page
	else if($callhistory.list.selected > 0){
		$callhistory.list.select($callhistory.list.selected - 1);
	}
}

$callhistory.dial = function(){
	var number = $callhistory.data.CallHistoryList[$callhistory.list.selected].Num;
	digium.phone.dial({
		"number" : number
	});
}
/**
 * show search box
 */
$callhistory.showSearch = function(){
	if(typeof $callhistory.searchInput == "undefined"){
		$callhistory.searchInput = new Input(0, Text.LINE_HEIGHT+2, window.w, Text.LINE_HEIGHT);
		$callhistory.searchInput.setSoftkey(1, "Search", $callhistory.search);
		$callhistory.searchInput.setSoftkey(2, "Cancel", $callhistory.cancelSearch);
		
		$callhistory.searchInput.onkeyselect = $callhistory.search;
		$callhistory.searchInput.onkeycancel = $callhistory.cancelSearch;
		$callhistory.searchInput.mode = "numeric";
		$callhistory.searchInput.boxType = Widget.ROUNDED_BOX;
		window.add($callhistory.searchInput);
	}
	else{
		$callhistory.searchInput.visible = true;
	}
	$callhistory.searchInput.takeFocus();
	$callhistory.list.focusable = false;
}

$callhistory.search = function(){
	$callhistory.any = $callhistory.searchInput.value;
	$callhistory.searchInput.visible = false;
	$callhistory.list.focusable = true;
	$callhistory.pagenumber = 1;
	$callhistory.request();
}

$callhistory.cancelSearch = function(){
	$callhistory.searchInput.visible = false;
	$callhistory.list.focusable = true;
	$callhistory.list.takeFocus();
}
/*Search ends here*/

$callhistory.showFilters = function(){
	if(typeof $callhistory.filterList == "undefined"){
		$callhistory.filterOptions = [{
			value: "all",
			label : "All Calls"
		}, 
		{
			value: "in",
			label : "Incoming"
		}, {
			value : "out",
			label : "Outgoing"
		}, {
			value: "missed",
			label: "Missed Calls"
		}, {
			value: "voicemail",
			label: "Voicemails"
		}];

		$callhistory.filterList = new List(0, Text.LINE_HEIGHT+2, window.w, window.h);

		for(var index=0; index < $callhistory.filterOptions.length; index++){
			$callhistory.filterList.set(index, 0, $callhistory.filterOptions[index].label);
		}
		$callhistory.filterList.setSoftkey(1, "Select", $callhistory.filter);
		$callhistory.filterList.setSoftkey(2, "Cancel", $callhistory.cancelFilter);
		$callhistory.filterList.onkeyselect = $callhistory.filter;
		$callhistory.filterList.onkeycancel = $callhistory.cancelFilter;
		$callhistory.filterList.onkeyleft = $callhistory.cancelFilter;
		window.add($callhistory.filterList);
	}
	else{
		$callhistory.filterList.visible = true;
	}
	$callhistory.filterList.takeFocus();
	$callhistory.list.focusable = false;
}


$callhistory.filter = function(){
	$callhistory.ShowByDirection =$callhistory.filterOptions[$callhistory.filterList.selected].value;
	$callhistory.filterList.visible = false;
	$callhistory.list.focusable = true;
	$callhistory.pagenumber = 1;
	$callhistory.request();
}

$callhistory.cancelFilter = function(){
	$callhistory.filterList.visible = false;
	$callhistory.list.focusable = true;
	$callhistory.list.takeFocus();
}


/**
 * ===================callhistory module ends====================
 */
/**
 * This code is required for using require() function in digium api so if you remove it 
 * you might get a lot of does not have method errors
 * putting $callhistory in exports! stupid i know, but Digium API is designed this way!
 * @param  {Object} obj object to copy
 * @return {Boolean}    true if function, false if not
 */
isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};

for(var attr in $callhistory){
	if(isFunction($callhistory[attr])){
		exports[attr] = $callhistory[attr];
	}
}