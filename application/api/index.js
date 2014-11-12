/**
 * Initializing application
 * @type {{initRoutes: Function}}
 */
module.exports={
    initRoutes: function(app){
        return require('./routes')(app);
    }
}
