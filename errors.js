var create = require('errno').custom.createError;

var PortFTP = create('PortFTP');
var Connection = create('Connection', PortFTP);

module.exports = {
    ftp: function(cause) {
        return new PortFTP('FTP error', cause);
    },
    connection: function(cause) {
        return new Connection('FTP connection error', cause);
    }
};
