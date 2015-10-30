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

    return when.promise(function(resolve, reject) {
        if (!(FtpClient instanceof Function)) {
            reject(errors.ftp('FTP library has not been initialized'));
        }

        if (this.config.id === 'sftp') {
            this.client = new FtpClient(this.config.client || {});
            this.pipeExec(this.exec.bind(this), this.config.concurrency);
            resolve();
        } else {
            this.client = new FtpClient(this.config.client || {});
            //todo refactor, as starting does not mean wait for connection
            this.client.on('ready', function() {
                this.pipeExec(this.exec.bind(this), this.config.concurrency);
                resolve();
            }.bind(this));
            this.client.on('error', function(e) {
                reject(errors.connection(e));
            }.bind(this));
            this.client.connect(this.config.client || {});
        }
    }.bind(this));
};

//todo split to two objects
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
                        //todo handle error case
                        stream.once('close', function() {
                            resolve(true);
                            port.client.end();
                        });
                        stream.pipe(fs.createWriteStream(message.localFile));
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
                        port.client.end();
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
                        port.client.end();
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
                        port.client.end();
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
};

module.exports = FtpPort;
