/**
 * Login section
 * call $login.init() to initiate app
 */
var $login = {};
/**
 * This is where app starts! This function starts app
 */
$login.init = function(){
	credentials = $login.getCredentials();
	if(credentials !== false){
		$login.sendLoginRequest(credentials.username, credentials.password, false);
	}
	else{
		$login.showForm();
	}
}
/**
 * show login form
 * @param  {string} error A message to be displayed after form, in any case of error
 */
$login.showForm = function(error){
	window.clear();
	$login.usernameLabel = new Text(0, 0, window.w, Text.LINE_HEIGHT, "Extension:");
	$login.usernameInput = new Input(0, Text.LINE_HEIGHT + 2, window.w, Text.LINE_HEIGHT);

	$login.passwordLabel = new Text(0, (Text.LINE_HEIGHT+2)*2, window.w, Text.LINE_HEIGHT, "Password:");
	$login.passwordInput = new Input(0, (Text.LINE_HEIGHT+2)*3, window.w, Text.LINE_HEIGHT);

	$login.usernameInput.setSoftkey(1, "Login", $login.sendFormLoginRequest);
	$login.passwordInput.setSoftkey(1, "Login", $login.sendFormLoginRequest);

	$login.passwordInput.onkeyselect = $login.sendFormLoginRequest;
	$login.usernameInput.onkeyselect = $login.sendFormLoginRequest;

	if(error!=""){
		var responseText = new Text(0, (Text.LINE_HEIGHT+2)*4, window.w, Text.LINE_HEIGHT, error);
		window.add(responseText);
	}

	window.add($login.usernameLabel, $login.usernameInput, $login.passwordLabel, $login.passwordInput);
	$login.usernameInput.takeFocus();
}
/**
 * send request by getting data from form input
 */
$login.sendFormLoginRequest = function(){
	$login.sendLoginRequest($login.usernameInput.value, $login.passwordInput.value, true);
}
/**
 * send login request to server
 * @param  {string}  username this is your extension
 * @param  {string}  password this might be your pin
 * @param  {Boolean} isForm
 */
$login.sendLoginRequest = function(username, password, isForm){
	var message = "";
	var request = new NetRequest();
	var queryString = "user=" + username + "&pass=" + password;
	request.open("get", "http://"+ fonb.config.host +"/xml/en/Digium/phonebook.xml?" + queryString);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.oncomplete = function() {
		if(request.status == 401){
			message = "Bad username password";
		}
		else if(request.status != 200){
			message = "Some error occured. Response code: " + request.status;
		}
		else{
			//we are logged in now
			if(isForm === true){
				$login.saveCredentials(username,password);
			}
			fonb.menu.init();
		}
		if(message != ""){
			if(isForm === false){
				message = "";
			}
			$login.showForm(message);
		}
	}
	request.send();
}
/**
 * remove all credentials and show login form
 */
$login.logout = function(){
	var request = new NetRequest();
	var queryString = "logout=yes";
	request.open("get", "http://"+ fonb.config.host +"/xml/en/Digium/login.xml?" + queryString);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.oncomplete = function() {
		$login.removeCredentials();
		$login.showForm();
	}
	request.send();
}
/**
 * saves credentials in tmp storage for using on login later
 * @param  {string} username
 * @param  {Boolean} password
 */
$login.saveCredentials = function(username, password){
	var settingsString = JSON.stringify({"username" : username, "password" : password});
    //write our settings in non-volatile storage so they are preserved.
    digium.writeFile("tmp", "fonb_app_credentials.json", settingsString);
}
/**
 * remove credentials from storage
 */
$login.removeCredentials = function(){
	var settingsString = JSON.stringify({"username" : "", "password" : ""});
    //write our settings in non-volatile storage so they are preserved.
    digium.writeFile("tmp", "fonb_app_credentials.json", settingsString);
}
/**
 * [ description]
 * @return {Object} example: {username : "2134", password : "abc3232"}
 * @return {Boolean} false in case no credentials are found
 */
$login.getCredentials = function(){
	var settings = {};

	// we wrap loading $login file in a try catch because we are not sure if it exists yet or not.
	// if it doesn't the app engine will throw an exception halting execution.
	// $login is also why we initialize the settings object above.
	// If $login errors we will return the empty object
	try {
	     var settingsString = digium.readFile("tmp", "fonb_app_credentials.json");
	     settings = JSON.parse(settingsString);
	} catch (error) {
	    return false;
	}
	if(typeof settings.username != "undefined" && typeof settings.password != "undefined" && settings.username != "" && settings.password != ""){
		return settings;
	}
	else{
		return false;
	}
}
/**
 * ===================Login module ends====================
 */
/** 
 * This code is required for using require() function in digium api so if you remove it 
 * you might get a lot of does not have method errors
 * putting $login in exports! stupid i know, but Digium API is designed this way!
 * every attribute of login needs to be put in exports for it to work
 * @param  {Object} obj object to copy
 * @return {Boolean}    true if function, false if not
 */
isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};

for(var attr in $login){
	if(isFunction($login[attr])){
		exports[attr] = $login[attr];
	}
}