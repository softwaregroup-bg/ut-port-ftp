var fs = require('fs');

module.exports = function({utPort}) {
    let ftpPortErrors;

    var FTP = {
        /**
         * @function download
         * @description Download file through ftp
         * @param {Object} message
         * @return {Promise}
         */
        download: function(message) {
            return new Promise((resolve, reject) => {
                if (this.config.protocol === 'sftp') {
                    this.client.download(message.remoteFile, message.localFile, function(err) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
                        } else {
                            resolve(true);
                        }
                    });
                } else {
                    this.client.get(message.remoteFile, function(err, stream) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
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
            return new Promise((resolve, reject) => {
                if (this.config.protocol === 'sftp') {
                    this.client.upload(message.localFile, message.remoteFile, function(err) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
                        } else {
                            resolve(true);
                        }
                    });
                } else {
                    this.client.put(message.localFile, message.remoteFile, function(err) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
                        } else {
                            resolve(true);
                        }
                    });
                }
            });
        },
        /**
         * @function append
         * @description Appends data to file through ftp
         * @param {Object} message
         * @return {Promise}
         */
        append: function(message) {
            return new Promise((resolve, reject) => {
                if (this.config.protocol === 'sftp') {
                    this.client.write({destination: message.fileName, content: message.data}, function(err) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
                        } else {
                            resolve(true);
                        }
                    })
                } else {
                    this.client.append(Buffer.from(message.data, 'utf8'), message.fileName, false, function(err) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
                        } else {
                            resolve(true);
                        }
                    });
                }
            })
        },
        /**
         * @function list
         * @description Lists all files within a folder in a remote ftp server
         * @param {Object} message
         * @return {Promise}
         */
        list: function(message) {
            return new Promise((resolve, reject) => {
                if (this.config.protocol === 'sftp') {
                    this.client.sftp(function(err, sftp) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
                        } else {
                            sftp.readdir(message.remoteDir, function(err, list) {
                                if (err) {
                                    reject(ftpPortErrors['ftpPort'](err));
                                } else {
                                    resolve(list);
                                }
                            });
                        }
                    });
                } else {
                    this.client.list(message.remoteDir, function(err, list) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
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
            return new Promise((resolve, reject) => {
                if (this.config.protocol === 'sftp') {
                    this.client.sftp(function(err, sftp) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
                        } else {
                            sftp.unlink(message.remoteFile, function(err) {
                                if (err) {
                                    reject(ftpPortErrors['ftpPort'](err));
                                } else {
                                    resolve(true);
                                }
                            });
                        }
                    });
                } else {
                    this.client.delete(message.remoteFile, function(err) {
                        if (err) {
                            reject(ftpPortErrors['ftpPort'](err));
                        } else {
                            resolve(true);
                        }
                    });
                }
            });
        }
    };
    return class FtpPort extends utPort {
        constructor() {
            super(...arguments);
            if (!this.errors || !this.errors.getError) throw new Error('Please use the latest version of ut-port');
            ftpPortErrors = require('./errors')(this.errors);
            this.client = null;
            this.ready = false;
            this.reconnectInterval = null;
            this.FtpClient = null;
        }

        get defaults() {
            return {
                id: null,
                logLevel: '',
                protocol: 'ftp'
            };
        }

        async init() {
            const result = await super.init(...arguments);
            this.bytesSent = this.counter && this.counter('counter', 'bs', 'Bytes sent', 300);
            this.bytesReceived = this.counter && this.counter('counter', 'br', 'Bytes received', 300);

            if (this.config.protocol === 'sftp') {
                this.FtpClient = require('scp2/lib/client').Client;
            } else {
                this.FtpClient = require('ftp');
            }

            this.config.client.secureOptions = Object.assign({}, this.config.client.secureOptions || {});

            if (this.config.client.certificatePath && this.config.client.certificatePath.length) {
                this.config.client.secureOptions = Object.assign(this.config.client.secureOptions, {
                    cert: fs.readFileSync(this.config.client.certificatePath, 'utf8')
                });
            }
            // if (this.config.client.keyPath && this.config.client.keyPath.length) {
            //     this.config.client.secureOptions = Object.assign(this.config.client.secureOptions, {
            //         key: fs.readFileSync(this.config.client.keyPath, 'utf8')
            //     });
            // }

            return result;
        }

        async start() {
            await super.start(...arguments);

            if (!(this.FtpClient instanceof Function)) {
                throw ftpPortErrors['ftpPort.lib.init']('FTP library has not been initialized');
            }

            if (this.config.protocol === 'sftp') {
                this.client = new this.FtpClient(this.config.client || {});

                this.client.on('connect', function() {
                    this.log && this.log.info && this.log.info('Connected');
                }.bind(this));
                
                this.client.on('ready', function() {
                    this.log && this.log.info && this.log.info('Connected');
                }.bind(this));
                
                this.pull(this.exec);
            } else {
                this.client = new this.FtpClient(this.config.client || {});

                this.client.on('ready', function() {
                    this.pull(this.exec);
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

                this.client.connect(Object.assign({}, this.config.client, {user: this.config.client.username}));
            }
            return {};
        }

        reconnect() {
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
        }

        exec(message) {
            if (this.config.protocol === 'sftp' || this.ready) {
                var $meta = (arguments.length && arguments[arguments.length - 1]);
                if (message.method && FTP[message.method]) {
                    return FTP[message.method].apply(this, arguments)
                        .then(function(result) {
                            $meta.mtid = 'response';
                            return result;
                        });
                } else {
                    return Promise.reject(ftpPortErrors['ftpPort.unknownMethod'](message.method));
                }
            } else {
                return Promise.reject(ftpPortErrors['ftpPort.connection.notReady']());
            }
        }
    };
};
