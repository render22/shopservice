/**
 * Model serving client ans user access tokens depending on type param
 * @param bookshelf
 * @param properties
 * @param type
 * @returns {AccessToken}
 */
module.exports = function (bookshelf, properties, type) {

    var AccessToken = bookshelf.Model.extend({
        tableName: type === 'client' ? 'clientAccessToken' : 'accessToken'
    });


    return new AccessToken(properties);
}
