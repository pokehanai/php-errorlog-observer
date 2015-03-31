var fs     = require('fs');
var debug  = require('debug')('app:observe');
var Q      = require('q');
var Parser = require('php-errorlog-parser');
var Tail   = require('tail').Tail;
var redis  = require('redis');

/**
 * Start processing
 *
 * @param {string} path  path to php_error.log
 * @param {string} key   Redis list key to store the log records
 */
function start(path, key) {
    createFileIfNotExists(path)
        .then(function () {
            return watch(path, key);
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

function watch(path, key) {
    var client = redis.createClient();
    var parser = new Parser(200);
    parser.addListener('record', function (record) {
        debug('onRecord', record);
        client.rpush(key, JSON.stringify(record));
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
