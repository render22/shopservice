var fs = require('fs');
var url = require('url');
function initRoutes(app, routes) {


    var invokable;

    //set default route
    if (fs.existsSync(app.get('appPath') + '/controllers/index.js')) {
        var indexController = require(app.get('appPath') + '/controllers/index.js');

        if (typeof indexController === 'object') {
            if (indexController['indexAction']) {
                app.get('/', indexController['indexAction'].bind(indexController));
            }
        }
    }

    for (var requestType in routes) {

        for (var controller in routes[requestType]) {

            var cInstance = require(app.get('appPath') + '/controllers/' + controller + '.js');

            if (typeof cInstance === 'object') {
                if(cInstance.init instanceof Function )
                    cInstance.init(app);
                var actions = routes[requestType][controller];

                for (var action in actions) {

                    if (cInstance[actions[action] + 'Action']) {
                        var actionName = actions[action] + 'Action';
                        if (controller === 'index') {
                            app[requestType]('/' + actions[action], cInstance[actionName].bind(cInstance));
                        }else if(actionName === 'indexAction'){
                            app[requestType]('/' + controller , cInstance[actionName].bind(cInstance));
                        }

                        app[requestType]('/' + controller + '/' + actions[action], cInstance[actionName].bind(cInstance));


                    } else {
                        var cI = cInstance;

                        var cb = function (req, resp, next) {

                            var reqUrl = url.parse(req.path);
                            var reqParts = reqUrl.path.split('/');
                            var i = 1;

                            if (reqParts[i]) {
                                var isFounded = false;
                                while (reqParts[i]) {
                                    var actionName = reqParts[i] + 'Action';
                                    actionName = actionName.replace('/', '');
                                    if (this[actionName] instanceof Function) {
                                        isFounded = true;
                                        this[actionName].apply(this, arguments);
                                    }
                                    ++i;
                                }

                                if (!isFounded)
                                    next();

                            } else if (this['indexAction'] instanceof Function) {

                                this['indexAction'].apply(this, arguments);

                            } else {

                                next();
                            }


                        }

                        if (controller === 'index')
                            app[requestType](actions[action], cb.bind(cI));

                        app[requestType]('/' + controller + actions[action], cb.bind(cI));
                    }


                }

            }

        }

    }
}


exports.initRoutes = initRoutes;