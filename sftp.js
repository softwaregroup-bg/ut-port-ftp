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

    async getStream(params, $meta) {
        if (this.sftp) return this.sftp;
        this.sftp = new Promise((resolve, reject) =>
            this.client.sftp((error, sftp) => {
                if (error) return reject(error);
                sftp.on('error', e => this.error(e, $meta));
                sftp.on('close', () => delete this.sftp);
                resolve(sftp);
            })
        );
        return this.sftp;
    }

    handlers() {
        return []
            .concat(this.config.namespace)
            .reduce((handlers, namespace) => ({
                ...handlers,
                async [`${namespace}.download`](params, $meta) {
                    const sftp = await this.getStream(params, $meta);
                    const localFile = params?.localFile || uuid();
                    const localFilePath = path.join(this.workDir, localFile);
                    return new Promise((resolve, reject) =>
                        sftp.fastGet(params.remoteFile, localFilePath, {}, e => {
                            if (e) return reject(this.errors.ftpPort(e));
                            if (!params?.localFile) {
                                const file = fs.readFileSync(localFilePath);
                                fs.unlinkSync(localFilePath);
                                return resolve(file);
                            }
                            return resolve({filepath: localFilePath});
                        })
                    );
                },
                async  [`${namespace}.upload`](params, $meta) {
                    const sftp = await this.getStream(params, $meta);
                    return new Promise((resolve, reject) =>
                        sftp.fastPut(path.join(this.workDir, params.localFile), params.remoteFile, {}, e => {
                            if (e) return reject(this.errors.ftpPort(e));
                            return resolve(true);
                        })
                    );
                },
                async  [`${namespace}.append`](params, $meta) {
                    const sftp = await this.getStream(params, $meta);
                    return new Promise((resolve, reject) =>
                        sftp.appendFile(params.fileName, Buffer.from(params.data, 'utf8'), {}, e => {
                            if (e) return (this.errors.ftpPort(e));
                            return resolve(true);
                        })
                    );
                },
                async [`${namespace}.list`](params, $meta) {
                    const sftp = await this.getStream(params, $meta);
                    return new Promise((resolve, reject) =>
                        sftp.readdir(params.remoteDir, {}, (e, files) => {
                            if (e) return reject(this.errors.ftpPort(e));
                            return resolve(files);
                        })
                    );
                },
                async [`${namespace}.remove`](params, $meta) {
                    const sftp = await this.getStream(params, $meta);
                    return new Promise((resolve, reject) =>
                        sftp.unlink(params.remoteFile, e => {
                            if (e) return reject(this.errors.ftpPort(e));
                            return resolve(true);
                        })
                    );
                }
            }), {});
    }
};
