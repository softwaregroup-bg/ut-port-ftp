module.exports = function FtpPort({config}) {
    const {protocol} = config;
    if (protocol === 'sftp') return require('./sftp')(...arguments);
    return require('./ftp')(...arguments);
};
