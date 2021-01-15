module.exports = function({utPort, registerErrors}) {
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

            this.bytesSent = this.counter && this.counter('counter', 'bs', 'Bytes sent', 300);
            this.bytesReceived = this.counter && this.counter('counter', 'br', 'Bytes received', 300);

            return result;
        }

        exec() {
            const [, $meta] = arguments;
            const methodName = $meta && $meta.method;
            if (methodName) {
                const method = this.findHandler(methodName);
                if (method instanceof Function) {
                    return method.apply(this, Array.prototype.slice.call(arguments));
                }
            }
            throw this.errors['ftpPort.unknownMethod']();
        }
    };
};
