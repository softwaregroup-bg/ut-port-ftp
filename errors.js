'use strict';
module.exports = ({defineError, fetchErrors}) => {
    const ftpPort = defineError('ftpPort', undefined, 'Ftp error');
    defineError('lib.init', ftpPort, 'FTP library has not been initialized');
    defineError('unknownMethod', ftpPort, 'Unknown method');
    const connection = defineError('connection', ftpPort, 'Connection');
    defineError('notReady', connection, 'Connection not ready');
    return fetchErrors('ftpPort');
};
