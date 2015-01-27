(function(define) {define(function(require) {
    /**
     * @module FTP Port
     * @author UT Route Team
     * @description File Transfer Protocol Port Module for FTP / FTPS / SFTP
     * @requires fs
     * @requires when
     * @requires util
     * @requires ut-bus/port
     */
    var fs = require('fs');
    var when = require('when');
    var util = require('util');
    var Port = require('ut-bus/port');
    var FtpClient = {};

    function FtpPort() {
        Port.call(this);

        /**
         * @param {Object} config
         * @description Contains all SQL configuration data
         */
        this.config = null;
        /**
         * @function val
         * @description Empty validation method
         */
        this.val = null;
        /**
         * @function log
         * @description Empty logger method
         */
        this.log = null;
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

        if (this.config.id === 'sftp') {
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
            if (!FtpClient instanceof Object)
                reject('FtpClient has not been initialized...');

            if (this.config.id === 'sftp') {
                this.client = new FtpClient(this.config.client);
                resolve();
            } else {
                this.client = new FtpClient(this.config.client);
                this.client.on('ready', function() {
                    resolve();
                }.bind(this));
                this.client.connect(this.config.client);
            }
        }.bind(this));
    };

    /**
     * @function exec
     * @description Takes a JSON message and executes an ftp method
     * @return {Object} message JSON object
     */
    FtpPort.prototype.exec = function exec(message) {
        if (message.method.length) {
            switch (message.method) {
                case 'download':
                    FTP.download(this, message);
                    break;
                case 'upload':
                    FTP.upload(this, message);
                    break;
                case 'list':
                    FTP.list(this, message);
                    break;
                case 'delete':
                    FTP.remove(this, message);
                    break;
            }
        } else {
            throw 'The message sent to FtpPort is malformed...';
        }
    };

    /**
     * @class FTP
     * @description Private class for separation of the different ftp-related tasks
     */
    var FTP = {
        /**
         * @function download
         * @description Download file through ftp
         * @param {FtpPort} port Current instance of the FtpPort
         * @return {Object} message JSON object
         */
        download: function(port, message) {
            if (port.config.id === 'sftp') {
                port.client.download(message.remoteFile, message.localFile, function(err) {
                    if (err)
                        throw err;
                });
            } else  {
                port.client.get(message.remoteFile, function(err, stream) {
                    if (err)
                        throw err;
                    stream.once('close', function() {
                        port.client.end();
                    });
                    stream.pipe(fs.createWriteStream(message.localFile));
                });
            }
        },
        /**
         * @function upload
         * @description Uploads file through ftp
         * @param {FtpPort} port Current instance of the FtpPort
         * @return {Object} message JSON object
         */
        upload: function(port, message) {
            if (port.config.id === 'sftp') {
                port.client.upload(message.localFile, message.remoteFile, function(err) {
                    if (err)
                        throw err;
                });
            } else {
                port.client.put(message.localFile, message.remoteFile, function (err) {
                    if (err)
                        throw err;
                    port.client.end();
                });
            }
        },
        /**
         * @function list
         * @description Lists all files within a folder in a remote ftp server
         * @param {FtpPort} port Current instance of the FtpPort
         * @return {Object} message JSON object
         */
        list: function(port, message) {
            if (port.config.id === 'sftp') {
                port.client.sftp(function(err, sftp) {
                    if (err)
                        throw err;
                    sftp.readdir(message.remoteDir, function(err, list) {
                        if (err)
                            throw err;
                        console.dir(list);
                    });
                });
            } else {
                port.client.list(message.remoteDir, function (err, list) {
                    if (err)
                        throw err;
                    console.dir(list);
                    port.client.end();
                });
            }
        },
        /**
         * @function remove
         * @description Removes a file through ftp
         * @param {FtpPort} port Current instance of the FtpPort
         * @return {Object} message JSON object
         */
        remove: function(port, message) {
            if (port.config.id === 'sftp') {
                port.client.sftp(function(err, sftp) {
                    if (err)
                        throw err;
                    sftp.unlink(message.remoteFile, function(err) {
                        if (err)
                            throw err;
                    })
                });
            } else {
                port.client.delete(message.remoteFile, function(err) {
                    if (err)
                        throw err;
                    port.client.end();
                });
            }
        }
    };

    return FtpPort;

});}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));