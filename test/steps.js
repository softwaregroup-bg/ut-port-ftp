const fs = require('fs');
const path = require('path');
module.exports = async function steps(assert, bus) {
    fs.copyFileSync(path.join(__dirname, 'data', 'test.txt'), path.join(bus.config.workDir, 'ftpTest.txt'));
    await bus.importMethod('ftp.unknown')({})
        .catch(e => assert.equals(e.type, 'ftpPort.unknownMethod', 'unknown method'));
    await bus.importMethod('ftp.list')({remoteDir: 'abcd'})
        .catch(e => assert.equals(e.type, 'ftpPort', 'missing dir'));
    await bus.importMethod('ftp.download')({remoteFile: 'nonexistingfile.txt'})
        .catch(e => assert.equals(e.type, 'ftpPort', 'file does not exist'));
    await bus.importMethod('ftp.remove')({remoteFile: 'nonexistingfile.txt'})
        .catch(e => assert.equals(e.type, 'ftpPort', 'file does not exist'));

    await bus.importMethod('ftp.upload')({localFile: 'ftpTest.txt', remoteFile: 'ftpTest.txt'})
        .then(r => assert.true(r, 'Successfully upload file'));
    await bus.importMethod('ftp.append')({data: 'A new line to append \n', fileName: 'ftpTest.txt'})
        .then(r => assert.true(r, 'Successfully append data to uploaded file'));

    await bus.importMethod('ftp.list')({remoteDir: './'})
        .then(r => assert.true(r.findIndex(i => (i.name || i.filename) === 'ftpTest.txt') > -1, 'File is found on remote'));
    await bus.importMethod('ftp.download')({remoteFile: 'ftpTest.txt'})
        .then(r => assert.true(Buffer.from(r).length > 0, 'File has content'));
    await bus.importMethod('ftp.download')({remoteFile: 'ftpTest.txt', localFile: 'ftpDownload.txt'})
        .then(r => assert.true(r, 'File was downloaded'));

    await bus.importMethod('ftp.remove')({remoteFile: 'ftpTest.txt'})
        .then(r => assert.true(r, 'File is successfully removed'));
    await bus.importMethod('ftp.list')({remoteDir: './'})
        .then(r => assert.true(r.findIndex(i => (i.name || i.filename) === 'ftpTest.txt') === -1, 'File is not found on remote'));
};
