/**
 * Model serving client ans user refresh tokens depending on type param
 * @param bookshelf
 * @param properties
 * @param type
 * @returns {RefreshToken}
 */
module.exports = function (bookshelf, properties, type) {
    var RefreshToken = bookshelf.Model.extend({
        tableName: type === 'client' ? 'clientRefreshToken' : 'refreshToken'
    });

    return new RefreshToken(properties);
}

