require('repl').start({useGlobal: true});

var wire = require('wire');

m = wire({
    bunyan: {
        create: {
            module: 'ut-log',
            args: {
                type: 'bunyan',
                name: 'bunyan_test',
                streams: [
                    {
                        level: 'trace',
                        stream: 'process.stdout'
                    }
                ]
            }
        }
    },
    ftp: {
        create: 'ut-port-ftp',
        init: 'init',
        properties: {
            config: {
                id: 'sftp',
                logLevel: 'trace',
                // FTP
                /*client: {
                    host: '127.0.0.1',
                    port: '21',
                    user: 'ut5',
                    password: 'test123',
                    debug: console.log
                }*/
                // FTPS
                /*client: {
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
                }*/
                // SFTP
                client: {
                    host: '127.0.0.1',
                    port: '22',
                    username: 'martin',
                    password: 'yolo',
                }
            },
            logFactory: {$ref: 'bunyan'}
        }
    }
}, {require: require}).then(function contextLoaded(context) {
    context.ftp.start().then(function() {
        try {
            // Test flow works the same with FTP / FTPS / SFTP - just change the config params
            context.ftp.exec({
                method: 'upload',
                localFile: 'foo.local-copy.txt',
                remoteFile: '/test/upload.txt'
            });
            setTimeout(function() {
                context.ftp.exec({
                    method: 'download',
                    remoteFile: '/test/upload.txt',
                    localFile: 'download.txt'
                });
            }, 1000);
            setTimeout(function() {
                context.ftp.exec({
                    method: 'list',
                    remoteDir: '/test'
                });
            }, 2000);
            setTimeout(function() {
                context.ftp.exec({
                    method: 'delete',
                    remoteFile: '/test/upload.txt'
                });
            }, 3000);
        } catch (ex) {
            console.log(ex);
        }
    }).catch(function(ex) {
        console.log(ex);
    });
}).done();