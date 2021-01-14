require('ut-run').run({
    main: [
        () => ({
            test: () => [
                require('./mock/ftp'),
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
            method: 'ftp.upload',
            name: 'Upload file successfully',
            params: {localFile: 'ftpTest.txt', remoteFile: 'ftpTest.txt'},
            result: (result, assert) => assert.true(result, 'Successfully upload file')
        }, {
            method: 'ftp.append',
            name: 'Append data to file',
            params: {data: 'A new line to append \n', fileName: 'ftpTest.txt'},
            result: (result, assert) => assert.true(result, 'Successfully append data to uploaded file')
        }, {
            method: 'ftp.list',
            name: 'List files',
            params: {remoteDir: '/'},
            result: (result, assert) => assert.true(result.findIndex(r => r.name === 'ftpTest.txt') > -1, 'File is found on remote')
        }, {
            method: 'ftp.download',
            name: 'Download uploaded file',
            params: {remoteFile: 'ftpTest.txt'},
            result: (result, assert) => assert.true(Buffer.from(result).length > 0, 'File has content')
        }, {
            method: 'ftp.download',
            name: 'Download uploaded file',
            params: {remoteFile: 'ftpTest.txt'},
            result: (result, assert) => assert.true(result, 'File was downloaded')
        }, {
            method: 'ftp.remove',
            name: 'Remove uploaded file',
            params: {remoteFile: 'ftpTest.txt'},
            result: (result, assert) => assert.true(result, 'File is successfully removed')
        }, {
            method: 'ftp.list',
            name: 'List files',
            params: {remoteDir: '/'},
            result: (result, assert) => assert.true(result.findIndex(r => r.name === 'ftpTest.txt') === -1, 'File is no longer found on remote')
        }]
    }
});
