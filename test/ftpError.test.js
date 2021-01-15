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
            protocol: 'ftp',
            client: {
                host: '127.0.0.1',
                port: 9000,
                username: 'ftp',
                password: 'ftp3'
            }
        }
    },
    params: {
        steps: []
    }
});
