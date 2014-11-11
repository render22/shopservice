module.exports = function (bookshelf, properties, type) {
    var AccessToken = bookshelf.Model.extend({
        tableName: type === 'client' ? 'clientAccessToken' : 'accessToken'
    });


    return new AccessToken(properties);
}
