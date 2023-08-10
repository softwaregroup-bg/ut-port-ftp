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
                host: 'bgs-vlx-dv-22.softwaregroup-bg.com',
                port: 30022,
                username: 'sftp',
                password: 'sftp123'
            }
        }
    },
    params: {
        steps: require('./steps')
    }
});
