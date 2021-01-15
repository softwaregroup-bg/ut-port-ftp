require('ut-run').run({
    main: [
        () => ({
            test: () => [
                require('..')
            ]
        })
    ],
    method: 'unit',
    config: {
        test: true,
        FtpPort: {
            namespace: ['ftp'],
            protocol: 'sftp',
            client: {
                host: 'bgs-vlx-dm-01',
                port: 22,
                username: 'sftp',
                password: 'sftp123'
            }
        }
    },
    params: {
        steps: [{
            method: 'ftp.list',
            name: 'List files',
            params: {remoteDir: ''},
            error: (error, assert) => assert.equals(error.type, 'ftpPort', 'missing dir')
        }, {
            method: 'ftp.download',
            name: 'Download non existging file',
            params: {remoteFile: 'nonexistingfile.txt'},
            error: (error, assert) => assert.equals(error.type, 'ftpPort', 'file does not exist')
        }, {
            method: 'ftp.remove',
            name: 'Remove non existing file',
            params: {remoteFile: 'nonexistingfile.txt'},
            error: (error, assert) => assert.equals(error.type, 'ftpPort', 'file does not exist')
        }, {
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
            params: {remoteDir: './'},
            result: (result, assert) => assert.true(result.findIndex(r => r.filename === 'ftpTest.txt') > -1, 'File is found on remote')
        }, {
            method: 'ftp.download',
            name: 'Download uploaded file',
            params: {remoteFile: 'ftpTest.txt'},
            result: (result, assert) => assert.true(Buffer.from(result).length > 0, 'File has content')
        }, {
            method: 'ftp.download',
            name: 'Download uploaded file',
            params: {remoteFile: 'ftpTest.txt', localFile: 'ftpsDownload.txt'},
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
            result: (result, assert) => assert.true(result.findIndex(r => r.filename === 'ftpTest.txt') === -1, 'File is no longer found on remote')
        }]
    }
});
