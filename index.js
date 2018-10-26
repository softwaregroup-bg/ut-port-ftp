var fs = require('fs');
var when = require('when');
var util = require('util');
var Port = require('ut-bus/port');
var errors = require('./errors');
var FtpClient;

function FtpPort() {
    Port.call(this);
    this.config = {
        id: null,
        logLevel: '',
        type: 'ftp'
    };
    /**
     * @param {Object} client
     * @description holds the FTP client instance
     */
    this.client = null;
    this.ready = false;
    this.reconnectInterval = null;
    return this;
}

util.inherits(FtpPort, Port);

/**
 * @function init
 * @description Extends the default Port.init() method and determines which ftp client to require
 */
FtpPort.prototype.init = function init() {
    Port.prototype.init.apply(this, arguments);
    this.latency = this.counter && this.counter('average', 'lt', 'Latency');

    if (this.config.protocol === 'sftp') {
        FtpClient = require('scp2/lib/client').Client;
    } else {
        FtpClient = require('ftp');
    }
};

/**
 * @function start
 * @description Extends the default Port.init() method and initializes the ftp client
 * @return {Promise}
 */
FtpPort.prototype.start = function start() {
    Port.prototype.start.apply(this, arguments);

    if (!(FtpClient instanceof Function)) {
        throw errors.ftp('FTP library has not been initialized');
    }

    if (this.config.id === 'sftp') {
        this.client = new FtpClient(this.config.client || {});
        this.pipeExec(this.exec.bind(this), this.config.concurrency);
    } else {
        this.client = new FtpClient(this.config.client || {});

        this.client.on('ready', function() {
            this.pipeExec(this.exec.bind(this), this.config.concurrency);
            this.ready = true;
            this.log && this.log.info && this.log.info('Connected');
        }.bind(this));

        this.client.on('error', function(e) {
            this.log && this.log.error && this.log.error(e);
            this.ready = false;
            (this.reconnectInterval == null) && this.reconnect();
        }.bind(this));

        this.client.on('close', function() {
            this.log && this.log.info && this.log.info('Disconnected');
            this.ready = false;
            (this.reconnectInterval == null) && this.reconnect();
        }.bind(this));

        this.client.connect(this.config.client || {});
    }
};

/**
 * @function reconnect
 * @description Extends the default Port.init() method and determines which ftp client to require
 */
FtpPort.prototype.reconnect = function() {
    this.reconnectInterval && clearInterval(this.reconnectInterval); // Ensure no interval will leak
    this.reconnectInterval = setInterval(function() {
        if (this.ready) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        } else {
            this.log && this.log.info && this.log.info('Reconnecting');
            this.client.connect(this.config.client || {});
        }
    }.bind(this), this.config.reconnectInterval || 10000);
};

// todo split to two objects
/**
 * @class FTP
 * @description Private class for separation of the different ftp-related tasks
 */
var FTP = {
    /**
     * @function download
     * @description Download file through ftp
     * @param {Object} message
     * @return {Promise}
     */
    download: function(message) {
        var port = this;
        return when.promise(function(resolve, reject) {
            if (port.config.id === 'sftp') {
                port.client.download(message.remoteFile, message.localFile, function(err) {
                    if (err) {
                        reject(errors.ftp(err));
                    } else {
                        resolve(true);
                    }
                });
            } else {
                port.client.get(message.remoteFile, function(err, stream) {
                    if (err) {
                        reject(errors.ftp(err));
                    } else {
                        if (!message.localFile) {
                            var buffer = Buffer.alloc(0);
                            stream.on('data', function(buf) {
                                buffer = Buffer.concat([buffer, buf]);
                            });
                            stream.once('end', function() {
                                resolve(buffer);
                            });
                        } else {
                            // todo handle error case
                            stream.once('close', function() {
                                resolve(true);
                            });
                            stream.pipe(fs.createWriteStream(message.localFile));
                        }
                    }
                });
            }
        });
    },
    /**
     * @function upload
     * @description Uploads file through ftp
     * @param {Object} message
     * @return {Promise}
     */
    upload: function(message) {
        var port = this;
        return when.promise(function(resolve, reject) {
            if (port.config.id === 'sftp') {
                port.client.upload(message.localFile, message.remoteFile, function(err) {
                    if (err) {
                        reject(errors.ftp(err));
                    } else {
                        resolve(true);
                    }
                });
            } else {
                port.client.put(message.localFile, message.remoteFile, function(err) {
                    if (err) {
                        reject(errors.ftp(err));
                    } else {
                        resolve(true);
                    }
                });
            }
        });
    },
    /**
     * @function list
     * @description Lists all files within a folder in a remote ftp server
     * @param {Object} message
     * @return {Promise}
     */
    list: function(message) {
        var port = this;
        return when.promise(function(resolve, reject) {
            if (port.config.id === 'sftp') {
                port.client.sftp(function(err, sftp) {
                    if (err) {
                        reject(errors.ftp(err));
                    } else {
                        sftp.readdir(message.remoteDir, function(err, list) {
                            if (err) {
                                reject(errors.ftp(err));
                            } else {
                                resolve(list);
                            }
                        });
                    }
                });
            } else {
                port.client.list(message.remoteDir, function(err, list) {
                    if (err) {
                        reject(errors.ftp(err));
                    } else {
                        resolve(list);
                    }
                });
            }
        });
    },
    /**
     * @function remove
     * @description Removes a file through ftp
     * @param {Object} message
     * @return {Promise}
     */
    remove: function(message) {
        var port = this;
        return when.promise(function(resolve, reject) {
            if (port.config.id === 'sftp') {
                port.client.sftp(function(err, sftp) {
                    if (err) {
                        reject(errors.ftp(err));
                    } else {
                        sftp.unlink(message.remoteFile, function(err) {
                            if (err) {
                                reject(errors.ftp(err));
                            } else {
                                resolve(true);
                            }
                        });
                    }
                });
            } else {
                port.client.delete(message.remoteFile, function(err) {
                    if (err) {
                        reject(errors.ftp(err));
                    } else {
                        resolve(true);
                    }
                });
            }
        });
    }
};

/**
 * @function exec
 * @description Takes a JSON message and executes an ftp method
 * @return {Promise}
 */
FtpPort.prototype.exec = function exec(message) {
    if (this.ready) {
        var $meta = (arguments.length && arguments[arguments.length - 1]);
        if (message.method && FTP[message.method]) {
            return FTP[message.method].apply(this, arguments)
                .then(function(result) {
                    $meta.mtid = 'response';
                    return result;
                });
        } else {
            return when.reject(errors.ftp('Unknown method ' + message.method));
        }
    } else {
        return when.reject(errors.ftp('Connection not ready'));
    }
};

module.exports = FtpPort;
