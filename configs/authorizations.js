/**
 * 
 * UserRole definitions for role based access.
 * 
 */

module.exports = function(user) {
  
  //roles.use('USER' ,function(req, res) {
    user.use(function(req, res) {
    //var role = req.session.user.role;

    if (role === 'USER' || role === 'ADMIN') {
      return true;
    }
  });

  user.use(function(req, res) {
    //var role = req.session.user.role;    

    if (role === 'ADMIN') {
      return true;
    }
  });  

  console.log("***done  authorizations.js***");
  
}
