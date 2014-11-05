module.exports = function (req, res, next) {

    var path = req.path;

    // normalize path for correct checking
    path=path.replace(/\/$/,'');

    /**
     * List of routes which required non authorized state
     * @type {string[]}
     */
    var notAuthorizedRequired = [
        '/users/login',
        '/users/registration'
    ];

    /**
     * List of routes which required  authorized state
     * @type {string[]}
     */
    var AuthorizedRequired = [
        '/index/createad',
        '/createad',
        '/users/logout',
        '/users/profile',
        '/users/pm'
    ];

    /**
     * List of routes which required admin non authorized state
     * @type {string[]}
     */
    var AdminNotAuthorizedRequired = [
        '/admin/login'

    ];

    /**
     * List of routes which required  authorized state and admin role
     * @type {string[]}
     */
    var AdminAuthorizedRequired = [
        '/admin',
        '/admin/index',
        '/admin/users',
        '/admin/stats',
        '/admin/ads'
    ];

    /*
    If user not authorized we check requested path and redirect to the appropriate login page
     */
    if (!req.session.user) {

        if (~AuthorizedRequired.indexOf(path) || ~AdminAuthorizedRequired.indexOf(path)) {
            if (~path.indexOf('admin'))
                return res.redirect(303, '/admin/login');
            else
                return res.redirect(303, '/users/login');
        }

    } else {
        if (~notAuthorizedRequired.indexOf(path))
            return res.redirect(303, '/');

        if (~AdminNotAuthorizedRequired.indexOf(path))
            return res.redirect(303, '/admin');

        if (~path.indexOf('admin') && req.session.user.role !== 'admin' && !~AdminNotAuthorizedRequired.indexOf(path))
            return res.redirect(303, '/admin/login');
    }


    next();
}
