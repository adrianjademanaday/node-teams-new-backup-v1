/**
 * 
 * Express middleware. Determines whether user is logged in.
 * If not logged in redirects user to login page.
 * 
 */

module.exports = function(req, res, next) {

	// Ignore login and logout requests

	if (req.url === '/login' || req.url === '/logout') {
		return next();			
	}

	// When user is not authenticated or is unauthorized

	if (req.session.user == null || req.session.user.role == null) {
		res.redirect('/login');
	} 

	return next();
}
