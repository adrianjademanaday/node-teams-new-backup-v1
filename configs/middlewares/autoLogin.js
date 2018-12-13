/**
 * 
 * Utlity Express middleware to auto login the user during development purposes only
 * So that developer won't need to login everytime when testing the application.
 * MUST be disabled during production.
 */

module.exports = function(req, res, next) {
	if (AUTO_LOGIN) {
		req.session.user = {username: 'user', password: 'str1d3', role: AUTO_LOGIN_ROLE}		
	} 

	next();
}
