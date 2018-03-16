# UT Port FTP

Description
===========

Provides an asynchronous interface for communicating with an FTP server.
Support: FTP, FTP over TLS (FTPS), Secure Shell FTP (SFTP)

Methods
-------

* **download**(< _object_ >) - _(void)_ - Download file through ftp or sftp

    * remoteFile - _string_ - file path

    * localFile - _string_ - file path
* **upload**(< _object_ >) - _(void)_ - Uploads file through ftp or sftp

    * remoteFile - _string_ - file path

    * localFile - _string_ - file path
* **list**(< _object_ >) - _(array)_ - Lists all files within a folder in a remote ftp server

    * remoteDir - _string_ - directory path
* **remove**(< _object_ >) - _(void)_ - Removes a file through ftp

    * remoteFile - _string_ - file path
* **move**(< _object_ >) - _(void)_ - Мoves a file

    * oldPath - _string_ - file path

    * newPath - _string_ - file path

Examples
========

```javascript
    module.exports = {
        id: 'ftp',
        createPort: require('ut-port-ftp'),
        namespace: ['ftp'],
        protocol: 'ftp',
        receive: function(msg, $meta) {
            return msg;
        },
        send: function(msg, $meta) {
            return msg;
        }
    };

    this.bus.importMethod('ftp.download')({localFile: 'ftp/test.ipm', remoteFile: 'out/file.ipm'})
        .then((r) => {
            ....
        });
```
* config
```javascript
    "ftp": {
        "logLevel": "trace",
        "protocol": "ftp / sftp"
        "disconnectTimeout": 60000,
        "options": {
            "host": "127.0.0.1",
            "port": 21,
            "username": "user",
            "password": "123456",
            "secure": true,
            "secureOptions": {
                "rejectUnauthorized": false
            }
        }
    }
```

More options:
============

* [node-ftp](https://github.com/mscdex/node-ftp) -- ftp
* [ssh2](https://github.com/mscdex/ssh2) -- sftp
* [ssh2-streams](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md) -- sftp