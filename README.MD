# UT Port FTP

## Used modules:
- ftp communication - https://github.com/mscdex/node-ftp
- sftp communication - https://github.com/spmjs/node-scp2
- tls and ssl - https://nodejs.org/api/tls.html

## Port configuration

- `protocol` (string) - communication protocol; possible values: _'ftp'_, _'sftp'_; __Default__: 'ftp'
- `client` (object) - connection configuration
    - `host` (string) - host name of the ftp server; __Default__: 'localhost'
    - `port` (string, integer) - listening port of the ftp server; __Default__: 21
    - `secure` (bool/string) - encryption type, if _false_, the securityOptions will not be considered; possible values: _'control'_ for control connection encryption, _'implicit'_ for implicitly encrypted control connection, _true_ for both, _false_ for none; __Default__: false
    - `secureOptions` (object) - additional connection options; __Default__: (none)
        - `rejectUnauthorized` (boolean) - if _false_, denies the connection in case the certificate verification fails; __Default__: true __(only if _secure_ is not _false_)__
    - `username` (string) - username for authentication; __Default__: 'anonymous'
    - `password` (string) - password for authentication; __Default__: 'anonymous@'
    - `connTimeout` (integer) - milliseconds to wait for establishing control connection; __Default__: 10000
    - `pasvTimeout` (integer) - milliseconds to wait for establishing PASV data connection; __Default__: 10000
    - `keepalive` (integer) - milliseconds between dummy commands to keep the connection alive; __Default__: 10000
    - `certificatePath` (string) - absolute path to the certificate file; __Default__: (none)
    - `keyPath` (string) - absolute path to the private key file; __Default__: (none)

__NOTE__: The protocol and the presence and need of key and certificate depend on the server configuration !

## Usage

To use any of the available ftp commands, a call to __exec__ method should be done. It accepts _message_ (object) parameter, the structure of which depends on the command which will be used. The mandatory parameter _message.method_ (string) is the name of the command.

## Available commands

- `download` - download file through ftp
- `upload` - upload file through ftp
- `append` - append data to file through ftp; _message_ structure:
    - _method_ = 'append'
    - _data_ (string) - data to be appended
    - _fileName_ (string) - relative path and name of the file on the ftp server to which the _data_ will be appended
- `list` - list all files within a folder on a remote ftp server
- `remove` - remove a file through ftp
