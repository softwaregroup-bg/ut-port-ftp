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
        steps: []
    }
});
