var fs     = require('fs');
var debug  = require('debug')('app:observe');
var Q      = require('q');
var Parser = require('php-errorlog-parser');
var Tail   = require('tail').Tail;
var redis  = require('redis');

/**
 * Start processing
 *
 * @param {string} path   path to php_error.log
 * @param {int}    db     redis database number
 * @param {string} key    Redis list key to store the log records
 * @param {int}    limit  max entries of Redis list
 */
function start(path, db, key, limit) {
    createFileIfNotExists(path)
        .then(function () {
            return watch(path, db, key, limit);
        })
        .fail(function (err) {
            console.error('ERROR: failed to open log file,', err.toString());
        });
}

function createFileIfNotExists(path) {
    if (fs.existsSync(path)) {
        return Q();
    } else {
        debug("create log file " + path);
        return Q.nfcall(fs.appendFile, path, '', {mode: 0666});
    }
}

function watch(path, db, key, limit) {
    var client = redis.createClient();
	client.select(db);
    var parser = new Parser(200);
    parser.addListener('record', function (record) {
        debug('onRecord', record);
        var message = JSON.stringify(record);
        client.lpush(key, message);
        client.ltrim(key, 0, limit - 1);
        client.publish('php.errorlog.' + key, message);
    });

    var tail = new Tail(path);
    tail.on('line', function (line) {
        parser.addLine(line);
    });

    tail.on('error', function(err) {
        debug('ERROR: ', err);
    });
}

module.exports = start;
