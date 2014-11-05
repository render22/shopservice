var stringHelper = require('../../library/stringHelper.js');
var ValidationError = require('./exceptions/validation.js').ValidationErrors;
var q = require('q');

/**
 * Advertisements model
 * @param bookshelf
 * @param properties
 * @returns {Ads}
 */
module.exports = function (bookshelf, properties) {


    var Ads = bookshelf.Model.extend({
        tableName: 'ads',
        /**
         * Here we counting total pages for pagination
         * @param data
         * @param limit
         * @param cb
         */
        countAds: function (data, limit, cb) {

            bookshelf.knex('ads')
                .count('id')
                .then(function (cnt) {

                    var pages = Math.floor(cnt[0].count / limit);

                    (cnt[0].count - (limit * cnt[0].count) !== 0) ? ++pages : pages;

                    data.pagesCount = pages;
                    cb(data);
                })


        }

    });

    /**
     * Getting list of advertisements
     * @param cb
     * @param params
     * @param page
     * @param limit
     */
    Ads.prototype.fetchAds = function (cb, params, page, limit) {
        this.cb = cb;
        var select = bookshelf.knex.select('ads.*', 'users.firstname')
            .from('ads')
            .leftJoin('users', 'ads.userId', 'users.id')
            .offset(page * limit)
            .limit(limit)
            .orderBy('postedDate', 'desc');
        if (params) {

            select.where(params);
        }
        var self = this;
        select.then(function (data) {

            return data;
        }).then(function (data) {
            self.countAds(data, limit, cb);
        });
    }

    /**
     * Searching for advertisement using "LIKE" clause
     * @param cb
     * @param query
     */
    Ads.prototype.search = function (cb, query) {
        var select = bookshelf.knex.select('ads.*', 'users.firstname')
            .from('ads')
            .leftJoin('users', 'ads.userId', 'users.id')

            .orderBy('postedDate', 'desc')
            .where(bookshelf.knex.raw("name LIKE '%" + query + "%' " +
            "OR \"shortDescription\" LIKE '%" + query + "%' " +
            "OR description LIKE '%" + query + "%'"));


        select.then(cb);
    }

    /**
     * Get statistics  counting of ads
     * @param startDate
     * @param endDate
     * @returns {*}
     */
    Ads.prototype.getStat = function (startDate, endDate) {
        console.log(startDate);
        var query = bookshelf.knex('ads')
            .count();
        if (startDate) {
            var parts = startDate.split('/');
            var newDate = parts[2] + '-' + parts[0] + '-' + parts[1];

            startDate = newDate.replace('-0', '-');
            query.where(bookshelf.knex.raw('"postedDate" >= \'' + startDate + '\'::date'));
        }


        if (endDate) {

            query.where(bookshelf.knex.raw('"postedDate" <= \'' + endDate + '\'::date'));
        }


        return query;
    }

    /**
     * Validating and filtering input data
     * @returns {*}
     */
    Ads.prototype.validateData = function () {
        var errors = {};
        var defer = q.defer();
        if (!Object.keys(this.attributes).length) {

            defer.reject('No data provided');
        } else {
            for (var prop in this.attributes) {
                if (prop !== 'photo' && this.attributes[prop].length === 0) {
                    errors[prop] = 'field should not be empty';


                } else if (prop === 'price') {
                    var price = parseFloat(this.attributes[prop]);
                    if (!isNaN(price) && price > 0)
                        this.attributes[prop] = price;
                    else
                        errors[prop] = 'Please enter price number';
                }

                this.attributes[prop] = stringHelper.strip_tags(this.attributes[prop]);
                if (this.attributes[prop].trim)
                    this.attributes[prop] = this.attributes[prop].trim();

            }


            if (Object.keys(errors).length > 0) {
                defer.reject(errors);
            }

            defer.resolve(this);
        }


        return defer.promise;
    }

    var AdsObj = new Ads(properties);
    AdsObj.on('saving', function (model, attrs, options) {


    });

    return AdsObj

}


