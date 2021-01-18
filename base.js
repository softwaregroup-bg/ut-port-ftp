const fs = require('fs');
const path = require('path');

module.exports = function({utPort, utBus, registerErrors}) {
    return class FtpPortBase extends utPort {
        get defaults() {
            return {
                type: 'ftpclient',
                protocol: 'ftp'
            };
        }

        get schema() {
            return {
                type: 'object',
                properties: {
                    protocol: {
                        type: 'string',
                        enum: ['ftp', 'sftp'],
                        default: 'ftp'
                    },
                    client: {
                        type: 'object',
                        properties: {
                            host: {
                                type: 'string'
                            },
                            port: {
                                type: 'integer'
                            },
                            username: {
                                type: 'string'
                            },
                            password: {
                                type: 'string'
                            },
                            secure: {
                                type: 'boolean',
                                default: false
                            },
                            secureOptions: {
                                type: 'object',
                                properties: {
                                    cert: {
                                        type: 'string'
                                    },
                                    privateKey: {
                                        type: 'string'
                                    },
                                    key: {
                                        type: 'string'
                                    },
                                    rejectUnauthorized: {
                                        type: 'boolean',
                                        default: true
                                    }
                                }
                            }
                        },
                        required: [
                            'host',
                            'port',
                            'username',
                            'password'
                        ]
                    }
                },
                required: [
                    'protocol',
                    'client'
                ]
            };
        }

        get uiSchema() {
            return {
                client: {
                    password: {
                        'ui:widget': 'password'
                    }
                }
            };
        }

        async init() {
            const result = await super.init(...arguments);
            Object.assign(this.errors, registerErrors(require('./errors')));

            this.workDir = path.join(utBus.config.workDir, 'ut-port-ftp');
            if (!fs.existsSync(this.workDir)) {
                fs.mkdirSync(this.workDir, {recursive: true});
            }

            return result;
        }

        exec() {
            const [, $meta] = arguments;
            const method = this.findHandler($meta.method);
            if (!(method instanceof Function)) {
                throw this.errors['ftpPort.unknownMethod']();
            }
            return method.apply(this, [...arguments]);
        }
    };
};
