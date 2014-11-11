module.exports = function (bookshelf, properties, type) {
    var RefreshToken = bookshelf.Model.extend({
        tableName: type === 'client' ? 'clientRefreshToken' : 'refreshToken'
    });

    return new RefreshToken(properties);
}

