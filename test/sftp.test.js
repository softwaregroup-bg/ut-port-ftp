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
            namespace: ['sftp'],
            client: {
                protocol: 'sftp',
                host: '127.0.0.1',
                port: 6000,
                username: 'sftp',
                password: 'sftp'
            }
        },
        FtpServer: {
            url: 'sftp://127.0.0.1:6000',
            pasv_url: '127.0.0.1',
            username: 'sftp',
            password: 'sftp'
        }
    },
    params: {
        steps: [{
            method: 'sftp.exec',
            name: 'Upload file successfully',
            params: {localFile: path.join(__dirname, 'data', 'test.txt'), remoteFile: 'sftpTest.txt', method: 'upload'},
            result: (result, assert) => assert.true(result, 'Successfully upload file')
        }, {
            method: 'sftp.exec',
            name: 'Append data to file',
            params: {data: 'A new line to append \n', fileName: 'sftpTest.txt', method: 'append'},
            result: (result, assert) => assert.true(result, 'Successfully append data to uploaded file')
        }, {
            method: 'sftp.exec',
            name: 'List files',
            params: {remoteDir: '/', method: 'list'},
            result: (result, assert) => assert.true(result.findIndex(r => r.name === 'sftpTest.txt') > -1, 'File is found on remote')
        }, {
            method: 'sftp.exec',
            name: 'Remove uploaded file',
            params: {remoteFile: 'sftpTest.txt', method: 'remove'},
            result: (result, assert) => assert.true(result, 'File is successfully removed')
        }, {
            method: 'sftp.exec',
            name: 'List files',
            params: {remoteDir: '/', method: 'list'},
            result: (result, assert) => assert.true(result.findIndex(r => r.name === 'sftpTest.txt') === -1, 'File is no longer found on remote')
        }]
    }
});
