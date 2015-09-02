php-errorlog-observer
=====================

(Application) Observe PHP error log and store records into Redis list.

### Installation

```sh
$ npm install
```

### Usage

```sh
$ bin/observer --help

  Usage: observer [options]

  start observing PHP error log, and stores log records to redis key

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -p, --path     <path>    path to PHP error log [/tmp/php_error.log]
	-n, --db       <int>     Redis database number [0]
    -k, --key      <string>  Redis key to store error log records [php:errorlog]
    -r, --refresh            Refresh Redis list(Discard and populate Redis list) [false]
    -l, --limit    <int>     max entries of Redis list. exceeded entries will be purged. [0(no limit)]
```

### License

MIT
