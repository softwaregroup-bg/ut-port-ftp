require('ut-run').run({
    implementation: 'sftp_test',
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
        steps: require('./steps')
    }
});
