var fs     = require('fs');
var debug  = require('debug')('app:purge');
var Q      = require('q');
var Parser = require('php-errorlog-parser');
var redis  = require('redis');

/**
 * Purge exceeded Redis list entries
 *
 * @param {string} key       Redis list key to store the log records
 * @param {int}    limit     max entries of Redis list
 * @param {int}    interval  interval milli seconds to purge Redis list
 */
function purge(key, limit, interval) {
    var client = redis.createClient();

    debug('start purging');
    setInterval(function () {
        client.llen(key, function (err, count) {
            if (limit < count) {
                debug('purge', key, 'from', count, 'to', limit);
                client.ltrim(key, 0, limit - 1);
            }
        });
    }, interval);
}

module.exports = purge;
