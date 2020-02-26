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
            protocol: 'sftp',
            client: {
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
        steps: require('./steps')('sftp')
    }
});
