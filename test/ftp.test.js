const path = require('path');

require('ut-run').run({
    main: [
        () => ({
            test: () => [
                require('./mock'),
                require('..')
            ]
        })
    ],
    method: 'unit',
    config: {
        test: true,
        FtpPort: {
            namespace: ['ftp'],
            protocol: 'ftp',
            client: {
                host: '127.0.0.1',
                port: 5000,
                username: 'ftp',
                password: 'ftp'
            }
        },
        FtpServer: {
            url: 'ftp://127.0.0.1:5000',
            pasv_url: '127.0.0.1',
            username: 'ftp',
            password: 'ftp'
        }
    },
    params: {
        steps: [{
            method: 'ftp.exec',
            name: 'Upload file successfully',
            params: {localFile: path.join(__dirname, 'data', 'test.txt'), remoteFile: 'ftpTest.txt', method: 'upload'},
            result: (result, assert) => assert.true(result, 'Successfully upload file')
        }, {
            method: 'ftp.exec',
            name: 'Append data to file',
            params: {data: 'A new line to append \n', fileName: 'ftpTest.txt', method: 'append'},
            result: (result, assert) => assert.true(result, 'Successfully append data to uploaded file')
        }, {
            method: 'ftp.exec',
            name: 'List files',
            params: {remoteDir: '/', method: 'list'},
            result: (result, assert) => assert.true(result.findIndex(r => r.name === 'ftpTest.txt') > -1, 'File is found on remote')
        }, {
            method: 'ftp.exec',
            name: 'Download uploaded file',
            params: {remoteFile: 'ftpTest.txt', method: 'download'},
            result: (result, assert) => assert.true(result.length > 0, 'File has content')
        }, {
            method: 'ftp.exec',
            name: 'Remove uploaded file',
            params: {remoteFile: 'ftpTest.txt', method: 'remove'},
            result: (result, assert) => assert.true(result, 'File is successfully removed')
        }, {
            method: 'ftp.exec',
            name: 'List files',
            params: {remoteDir: '/', method: 'list'},
            result: (result, assert) => assert.true(result.findIndex(r => r.name === 'ftpTest.txt') === -1, 'File is no longer found on remote')
        }]
    }
});
