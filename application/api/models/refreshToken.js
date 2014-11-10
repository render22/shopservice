module.exports = function (bookshelf, properties) {
    var RefreshToken=bookshelf.Model.extend({
        tableName: 'refreshToken'
    });

    return new RefreshToken(properties);
}

