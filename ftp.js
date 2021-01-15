const FtpClient = require('ftp');
const fs = require('fs');
const path = require('path');

module.exports = (...params) => class FtpPort extends require('./base')(...params) {
    async start() {
        const result = await super.start(...arguments);

        this.client = new FtpClient(this.config.client);

        this.client.on('ready', () => {
            this.pull(this.exec);
            this.isReady = true;
            this.reconnecting = false;
            this.log.info && this.log.info('Connected');
        });

        this.client.on('error', e => {
            this.log.error && this.log.error(e);
            this.isReady = false;
            this.reconnecting = false;
            !this.reconnectInterval && this.reconnect();
        });

        this.client.on('close', () => {
            this.log.info && this.log.info('Disconnected');
            this.isReady = false;
            this.reconnecting = false;
            !this.reconnectInterval && this.reconnect();
        });

        this.client.connect(Object.assign({}, this.config.client, {user: this.config.client.username}));

        return result;
    }

    stop() {
        this.client && this.client.destroy();
        this.reconnectInterval && clearInterval(this.reconnectInterval);
        return super.stop(...arguments);
    }

    reconnect() {
        this.reconnectInterval && clearInterval(this.reconnectInterval); // Ensure no interval will leak
        this.reconnectInterval = setInterval(() => {
            if (this.isReady) {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            } else if (!this.reconnecting) {
                this.reconnecting = true;
                this.log.info && this.log.info('Reconnecting');
                this.client.connect(Object.assign({}, this.config.client, {user: this.config.client.username}));
            }
        }, this.config.reconnectInterval || 10000);
    }

    get handlers() {
        const [{utBus: {config: {workDir}}, config}] = params;
        return []
            .concat(config.namespace)
            .reduce((handlers, namespace) => ({
                ...handlers,
                [`${namespace}.download`](message) {
                    return new Promise((resolve, reject) => {
                        this.client.get(message.remoteFile, (err, stream) => {
                            if (err) return reject(this.errors.ftpPort(err));
                            if (!message.localFile) {
                                let buffer = Buffer.alloc(0);
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
                                stream.pipe(fs.createWriteStream(path.join(workDir, message.localFile)));
                            }
                        });
                    });
                },
                [`${namespace}.upload`](message) {
                    return new Promise((resolve, reject) => {
                        this.client.put(path.join(workDir, message.localFile), message.remoteFile, err => {
                            if (err) return reject(this.errors.ftpPort(err));
                            return resolve(true);
                        });
                    });
                },
                [`${namespace}.append`](message) {
                    return new Promise((resolve, reject) => {
                        this.client.append(Buffer.from(message.data, 'utf8'), message.fileName, false, err => {
                            if (err) return reject(this.errors.ftpPort(err));
                            return resolve(true);
                        });
                    });
                },
                [`${namespace}.list`](message) {
                    return new Promise((resolve, reject) => {
                        this.client.list(message.remoteDir, (err, list) => {
                            if (err) return reject(this.errors.ftpPort(err));
                            return resolve(list);
                        });
                    });
                },
                [`${namespace}.remove`](message) {
                    return new Promise((resolve, reject) => {
                        this.client.delete(message.remoteFile, err => {
                            if (err) return reject(this.errors.ftpPort(err));
                            return resolve(true);
                        });
                    });
                }
            }), {});
    }
};
