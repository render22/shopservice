module.exports = function (bookshelf, properties) {
    var Client=bookshelf.Model.extend({
        tableName: 'client'
    });

    return new Client(properties);
}
