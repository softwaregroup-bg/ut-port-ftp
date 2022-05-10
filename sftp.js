const {Client} = require('ssh2');
const {v4: uuid} = require('uuid');
const fs = require('fs');
const path = require('path');
module.exports = (...params) => class FtpPort extends require('./base')(...params) {
    async start() {
        const result = await super.start(...arguments);
        this.client = new Client();
        await new Promise(resolve => {
            this.client
                .on('error', error => this.log?.error?.(error))
                .on('end', () => {
                    this.client?.end?.();
                    this.client?.destroy?.();
                })
                .on('ready', resolve)
                .connect(this.config.client);
        });
        this.pull(this.exec);
        return result;
    }

    async stop() {
        const result = super.stop(...arguments);
        this.client?.end?.();
        this.client?.destroy?.();
        delete this.client;
        return result;
    }

    handlers() {
        return []
            .concat(this.config.namespace)
            .reduce((handlers, namespace) => ({
                ...handlers,
                [`${namespace}.download`](params) {
                    const localFile = params?.localFile || uuid();
                    const localFilePath = path.join(this.workDir, localFile);

                    return new Promise((resolve, reject) =>
                        this.client.sftp((error, sftp) => {
                            if (error) return reject(this.errors.ftpPort(error));
                            return sftp.fastGet(params.remoteFile, localFilePath, {}, e => {
                                if (e) return reject(this.errors.ftpPort(error));
                                if (!params?.localFile) {
                                    const file = fs.readFileSync(localFilePath);
                                    fs.unlinkSync(localFilePath);
                                    return resolve(file);
                                }
                                return resolve({filepath: localFilePath});
                            });
                        }));
                },
                [`${namespace}.upload`](params) {
                    return new Promise((resolve, reject) =>
                        this.client.sftp((error, sftp) => {
                            if (error) return reject(this.errors.ftpPort(error));
                            return sftp.fastPut(path.join(this.workDir, params.localFile), params.remoteFile, {}, e => {
                                if (e) return reject(this.errors.ftpPort(e));
                                return resolve(true);
                            });
                        })
                    );
                },
                [`${namespace}.append`](params) {
                    return new Promise((resolve, reject) =>
                        this.client.sftp((error, sftp) => {
                            if (error) return reject(this.errors.ftpPort(error));
                            const ws = sftp.createWriteStream(params.fileName, {flags: 'a'});
                            ws.write(Buffer.from(params.data, 'utf8'));
                            ws.end();
                            return resolve(true);
                        })
                    );
                },
                [`${namespace}.list`](params) {
                    return new Promise((resolve, reject) =>
                        this.client.sftp((error, sftp) => {
                            if (error) return reject(this.errors.ftpPort(error));
                            return sftp.readdir(params.remoteDir, {}, (e, files) => {
                                if (e) return reject(this.errors.ftpPort(e));
                                return resolve(files);
                            });
                        })
                    );
                },
                [`${namespace}.remove`](params) {
                    return new Promise((resolve, reject) =>
                        this.client.sftp((error, sftp) => {
                            if (error) return reject(this.errors.ftpPort(error));
                            return sftp.unlink(params.remoteFile, e => {
                                if (e) return reject(this.errors.ftpPort(e));
                                return resolve(true);
                            });
                        })
                    );
                }
            }), {});
    }
};
