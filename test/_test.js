/* eslint no-console: 0 */
var FTP = require('../index');
var assign = require('lodash.assign');

var ftp = assign(new FTP(), {
    config: {
        id: 'sftp',
        logLevel: 'trace',
        // FTP
        /* client: {
            host: '127.0.0.1',
            port: '21',
            user: 'ut5',
            password: 'test123',
            debug: console.log
        } */
        // FTPS
        /* client: {
            host: '127.0.0.1',
            port: '21',
            user: 'ut5',
            password: 'test123',
            secure: true,
            debug: console.log,
            secureOptions: {
                //ca: [ fs.readFileSync('D:/FTP/certificate.crt', 'utf8') ],
                rejectUnauthorized: false
            }
        } */
        // SFTP
        client: {
            host: '127.0.0.1',
            port: '22',
            username: 'martin',
            password: 'yolo'
        }
    }
});

ftp.init();

ftp.start().then(function() {
    ftp.exec({
        method: 'upload',
        localFile: 'foo.local-copy.txt',
        remoteFile: '/test/upload.txt'
    }).done();
    ftp.exec({
        method: 'download',
        remoteFile: '/test/upload.txt',
        localFile: 'download.txt'
    }).done();
    ftp.exec({
        method: 'list',
        remoteDir: '/test'
    }).done();
    ftp.exec({
        method: 'delete',
        remoteFile: '/test/upload.txt'
    }).done();
    return;
}).catch(err => console.error(err));

ftp.stop();
