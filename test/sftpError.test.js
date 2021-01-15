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
                host: '127.0.0.1',
                port: 9000,
                username: 'sftp',
                password: 'sftp123'
            }
        }
    },
    params: {
        steps: [{
            method: 'ftp.upload',
            name: 'Upload file successfully',
            params: {localFile: 'ftpTest.txt', remoteFile: 'ftpTest.txt'},
            error(error, assert) {
                assert.equals(error.type, 'ftpPort', 'ftp port error');
            }
        }]
    }
});
