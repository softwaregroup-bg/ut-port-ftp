'use strict';
const util = require('util');
const fs = require('fs');
const merge = require('lodash.merge');
let FtpClient;

module.exports = function({parent}) {
    function FtpPort({config}) {
        parent && parent.apply(this, arguments);
        this.config = merge({
            id: 'ftp',
            type: 'ftp',
            logLevel: 'info',
            protocol: 'ftp',
            disconnectTimeout: 300000,
            options: {
                host: 'localhost',
                port: 22
            }
        }, config);
        this.client = null;
        this.connected = false;
        this.timeoutPointer = null;
    }

    if (parent) {
        util.inherits(FtpPort, parent);
    }

    let connect = function() {
        if (this.connected) {
            return Promise.resolve({});
        }
        return new Promise((resolve, reject) => {
            if (this.config.protocol === 'sftp') {
                this.client.on('ready', function() {
                    this.client.sftp(function(err, sftp) {
                        if (err) {
                            this.client.end();
                            return reject(err);
                        }
                        this.sftp = sftp;
                        this.connected = true;
                        this.log && this.log.info && this.log.info('Connected');
                        resolve(true);
                    }.bind(this));
                }.bind(this));
            } else {
                this.client.on('ready', function() {
                    this.connected = true;
                    this.log && this.log.info && this.log.info('Connected');
                    resolve(true);
                }.bind(this));
            }
            this.client.on('error', function(e) {
                this.log && this.log.error && this.log.error(e);
                reject && reject(e);
            }.bind(this));
            this.client.connect(this.config.options);
        });
    };

    let resetIdle = function() {
        if (this.config.disconnectTimeout) {
            this.timeoutPointer && clearTimeout(this.timeoutPointer);
            this.timeoutPointer = setTimeout(function() {
                if (this.connected) {
                    this.log && this.log.info && this.log.info('Disconnecting');
                    this.client.end();
                }
            }.bind(this), this.config.disconnectTimeout);
        }
    };

    FtpPort.prototype.init = function init() {
        parent && parent.prototype.init.apply(this, arguments);
        if (this.config.protocol === 'sftp') {
            FtpClient = require('ssh2').Client;
            // https://github.com/mscdex/ssh2
        } else {
            this.config.options && (this.config.options.user = this.config.options.username);
            FtpClient = require('ftp');
            // https://github.com/mscdex/node-ftp
        }
    };

    FtpPort.prototype.start = function start(callback) {
        return Promise.resolve()
            .then(() => parent.prototype.start.apply(this, Array.prototype.slice.call(arguments)))
            .then(result => {
                this.client = new FtpClient();

                this.client.on('end', function() {
                    this.log && this.log.info && this.log.info('Ended');
                    this.connected = false;
                }.bind(this));

                this.client.on('close', function() {
                    this.log && this.log.info && this.log.info('Disconnected');
                    this.connected = false;
                    delete this.sftp;
                }.bind(this));
                return {};
            }).then(result => {
                this.pull(this.exec);
                return result;
            });
    };
    FtpPort.prototype.exec = function exec(msg) {
        let $meta = (arguments.length > 1 && arguments[arguments.length - 1]);

        let methodName = ($meta && $meta.opcode);
        if (!methodName || !FTP[methodName]) {
            return Promise.reject(this.bus.errors.methodNotFound(methodName));
        }

        return connect.call(this)
            .then(() => {
                resetIdle.call(this);
                return FTP[methodName].apply(this, arguments);
            });
    };

    var FTP = {
        /**
         * @function download
         * @description Download file through ftp or sftp
         * @param {remoteFile: file path, localFile: file path} message
         * @return {Promise}
         */
        download: function(message) {
            var port = this;
            return new Promise((resolve, reject) => {
                if (port.config.protocol === 'sftp') {
                    port.sftp.fastGet(message.remoteFile, message.localFile, function(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                } else {
                    port.client.get(message.remoteFile, function(err, stream) {
                        if (err) {
                            return reject(err);
                        }
                        stream.once('close', function() {
                            resolve(true);
                        });
                        stream.pipe(fs.createWriteStream(message.localFile));
                    });
                }
            });
        },
        /**
         * @function upload
         * @description Uploads file through ftp or sftp
         * @param {remoteFile: file path, localFile: file path} message
         * @return {Promise}
         */
        upload: function(message) {
            var port = this;
            return new Promise((resolve, reject) => {
                if (port.config.protocol === 'sftp') {
                    port.sftp.fastPut(message.localFile, message.remoteFile, function(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                } else {
                    port.client.put(message.localFile, message.remoteFile, function(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                }
            });
        },
        /**
         * @function list
         * @description Lists all files within a folder in a remote ftp server
         * @param {remoteDir: directory path} message
         * @return {Promise}
         */
        list: function(message) {
            var port = this;
            return new Promise((resolve, reject) => {
                if (port.config.protocol === 'sftp') {
                    port.sftp.readdir(message.remoteDir, function(err, list) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(list);
                    });
                } else {
                    port.client.list(message.remoteDir, function(err, list) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(list);
                    });
                }
            });
        },
        /**
         * @function remove
         * @description Removes a file through ftp
         * @param {remoteFile: file path} message
         * @return {Promise}
         */
        remove: function(message) {
            var port = this;
            return new Promise((resolve, reject) => {
                if (port.config.protocol === 'sftp') {
                    port.sftp.unlink(message.remoteFile, function(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                } else {
                    port.client.delete(message.remoteFile, function(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                }
            });
        },
        /**
         * @function move
         * @description Мoves a file
         * @param {oldPath: file path, newPath: file path} message
         * @return {Promise}
         */
        move: function(message) {
            var port = this;
            return new Promise((resolve, reject) => {
                if (port.config.protocol === 'sftp') {
                    port.sftp.rename(message.oldPath, message.newPath, function(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                } else {
                    port.client.rename(message.oldPath, message.newPath, function(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(true);
                    });
                }
            });
        }
    };

    return FtpPort;
};
