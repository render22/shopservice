module.exports = function (bookshelf, properties) {
    var AccessToken=bookshelf.Model.extend({
        tableName: 'accessToken'
    });

    return new AccessToken(properties);
}
