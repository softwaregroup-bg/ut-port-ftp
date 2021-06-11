const {Client} = require('scp2');
const {v4: uuid} = require('uuid');
const fs = require('fs');
const path = require('path');
module.exports = (...params) => class FtpPort extends require('./base')(...params) {
    async start() {
        const result = await super.start(...arguments);
        this.client = new Client({
            ...this.config.client,
            ...this.config.client.secureOptions
        });

        this.client.on('error', e => this.log.error && this.log.error(e));
        this.client.on('end', () => this.client.close);

        this.pull(this.exec);
        return result;
    }

    stop() {
        this.client && this.client.close();
        return super.stop(...arguments);
    }

    handlers() {
        return []
            .concat(this.config.namespace)
            .reduce((handlers, namespace) => ({
                ...handlers,
                [`${namespace}.download`]: function(message) {
                    return new Promise((resolve, reject) => {
                        let localFile = message.localFile;
                        if (!localFile) localFile = uuid();
                        const localFilePath = path.join(this.workDir, localFile);
                        this.client.download(message.remoteFile, localFilePath, err => {
                            if (err) {
                                fs.unlinkSync(localFilePath);
                                return reject(this.errors.ftpPort(err));
                            }
                            if (!message.localFile) {
                                const file = fs.readFileSync(localFilePath);
                                fs.unlinkSync(localFilePath);
                                return resolve(file);
                            }
                            return resolve({filepath: localFilePath});
                        });
                    });
                },
                [`${namespace}.upload`]: function(message) {
                    return new Promise((resolve, reject) => {
                        this.client.upload(path.join(this.bus.config.workDir, message.localFile), message.remoteFile, err => {
                            if (err) reject(this.errors.ftpPort(err));
                            return resolve(true);
                        });
                    });
                },
                [`${namespace}.append`]: function(message) {
                    return new Promise((resolve, reject) => {
                        this.client.sftp((err, sftp) => {
                            if (err) return reject(this.errors.ftpPort(err));
                            sftp.appendFile(message.fileName, Buffer.from(message.data, 'utf8'), false, err => {
                                if (err) return reject(this.errors.ftpPort(err));
                                return resolve(true);
                            });
                        });
                    });
                },
                [`${namespace}.list`]: function(message) {
                    return new Promise((resolve, reject) => {
                        this.client.sftp((err, sftp) => {
                            if (err) return reject(this.errors.ftpPort(err));
                            sftp.readdir(message.remoteDir, (err, list) => {
                                if (err) return reject(this.errors.ftpPort(err));
                                return resolve(list);
                            });
                        });
                    });
                },
                [`${namespace}.remove`]: function(message) {
                    return new Promise((resolve, reject) => {
                        this.client.sftp((err, sftp) => {
                            if (err) return reject(this.errors.ftpPort(err));
                            sftp.unlink(message.remoteFile, err => {
                                if (err) return reject(this.errors.ftpPort(err));
                                return resolve(true);
                            });
                        });
                    });
                }
            }), {});
    }
};
