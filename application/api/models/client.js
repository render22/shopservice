/**
 * Model serving client credentials
 * @param bookshelf
 * @param properties
 * @returns {Client}
 */
module.exports = function (bookshelf, properties) {
    var Client=bookshelf.Model.extend({
        tableName: 'client'
    });



    return new Client(properties);
}
