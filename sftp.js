const {Client} = require('ssh2');
const {v4: uuid} = require('uuid');
const fs = require('fs');
const path = require('path');
module.exports = (...params) => class FtpPort extends require('./base')(...params) {
    async start() {
        const result = await super.start(...arguments);
        this.client = new Client();
        this.client
            .on('error', error => {
                if (!this.isConnecting) return this.log?.error?.(error);
                this.rejectReady(error);
                delete this.isConnecting;
            })
            .on('close', async() => {
                if (this.sftp) {
                    const sftp = await this.sftp;
                    sftp.end();
                    delete this.sftp;
                }
                await this.connect().catch(e => this.log?.error?.(e));
            });

        await this.connect().catch(e => this.log?.error?.(e));
        this.pull(this.exec);
        return result;
    }

    async connect() {
        if (['stopping', 'stopped'].includes(this.state) || !this.client) return false;
        if (this.isConnecting) return await this.isConnecting;
        if (this.resolveReady) this.client.removeListener('ready', this.resolveReady);

        this.isConnecting = new Promise((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
            this.client
                .on('ready', this.resolveReady)
                .connect(this.config.client);
        });
        await this.isConnecting;
        delete this.isConnecting;
    }

    async stop() {
        const result = super.stop(...arguments);
        this.client?.end?.();
        delete this.client;
        return result;
    }

    async getStream(params, $meta) {
        if (this.isConnecting) await this.isConnecting;
        if (this.sftp) return this.sftp;
        this.sftp = new Promise((resolve, reject) =>
            this.client.sftp((error, sftp) => {
                if (error) {
                    this.error(error, $meta);
                    return reject(error);
                }
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
                        sftp.fastGet(params.remoteFile, localFilePath, {...this?.config?.fastGet?.options}, e => {
                            if (e) return reject(this.errors.ftpPort(e));
                            if (!params?.localFile) {
                                const file = fs.readFileSync(localFilePath);
                                if (fs.existsSync(localFilePath)) {
                                    fs.unlinkSync(localFilePath);
                                }
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
                            if (e) return reject(this.errors.ftpPort(e));
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
                },
                async [`${namespace}.rename`](params, $meta) {
                    const sftp = await this.getStream(params, $meta);
                    return new Promise((resolve, reject) =>
                        sftp.rename(params.remoteFile, params.remoteTarget, e => {
                            if (e) return reject(this.errors.ftpPort(e));
                            return resolve(true);
                        })
                    );
                }
            }), {});
    }
};
