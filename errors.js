var create = require('ut-error').define;

var FTP = create('PortFTP');
var Connection = create('Connection', FTP);

module.exports = {
    ftp: function(cause) {
        return new FTP(cause);
    },
    connection: function(cause) {
        return new Connection(cause);
    }
};
