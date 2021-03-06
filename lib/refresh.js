var fs     = require('fs');
var debug  = require('debug')('refresh');
var Q      = require('q');
var Parser = require('php-errorlog-parser');
var redis  = require('redis');

/**
 * Discard Redis list and populate it with PHP error log
 *
 * @param {string} path   path to php_error.log
 * @param {string} key    Redis list key to store the log records
 * @param {int}    limit  max entries of Redis list
 */
function refresh(path, key, limit) {
    if (!fs.existsSync(path)) {
        console.error('ERROR: log file not exists; ', path);
        process.exit(1);
    }

    var client = redis.createClient();
    Q.ninvoke(client, 'del', key)
        .then(function () {
            return importLogs(path, key, limit, client);
        })
        .then(function () {
            client.end();
        })
        .fail(function (err) {
            console.error('ERROR:', err.toString());
            process.exit(1);
        });
}

function importLogs(path, key, limit, client) {
    var deferred = Q.defer();

    var parser = new Parser(100);
    parser.addListener('record', function (record) {
        debug('onRecord', record);
        client.lpush(key, JSON.stringify(record));
        client.ltrim(key, 0, limit - 1);
    });

    var reader = fs.createReadStream(path);
    var prevLine = null;
    reader.on('data', function (data) {
        var lines = data.toString().split("\n");
        if (prevLine) {
            lines[0] = prevLine + lines[0];
        }
        prevLine = lines.pop();
        lines.forEach(function (line) {
            parser.addLine(line);
        });
    });

    reader.on('end', function () {
        if (prevLine) {
            parser.addLine(line);
        }
        deferred.resolve();
    });

    reader.resume();

    return deferred.promise;
}

module.exports = refresh;
