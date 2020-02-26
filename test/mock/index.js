const path = require('path');
const fs = require('fs');
const FtpSrv = require('ftp-srv');

module.exports = function FtpServer({config, utPort, utBus}) {
    return class FtpServer extends utPort {
        get defaults() {
            return {
                id: 'ftpSrv',
                type: 'ftpServer'
            };
        }

        get schema() {
            return {
                type: 'object',
                properties: {
                    username: {
                        type: 'string'
                    },
                    password: {
                        type: 'string'
                    },
                    url: {
                        type: 'string'
                    },
                    pasv_url: {
                        type: 'string'
                    }
                },
                required: [
                    'username',
                    'password',
                    'url',
                    'pasv_url'
                ]
            };
        }

        async start() {
            const result = await super.start();
            const root = path.join(utBus.config.workDir, 'FtpServer');
            if (!fs.existsSync(root)) {
                fs.makeTreeSync(root);
            }
            this.server = new FtpSrv(config);
            this.server.on('login', (data, resolve) => resolve({root}));
            await this.server.listen();
            this.pull(() => {});
            return result;
        }

        async destroy() {
            const result = await super.destroy();
            await this.server.close();
            return result;
        }
    };
};
