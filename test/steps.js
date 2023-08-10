const fs = require('fs');
const path = require('path');
const {v4: uuid} = require('uuid');
const filename = `${uuid()}.txt`;
const initialText = 'Test file to upload\n';
const appendText = 'A new line to append\n';

module.exports = remoteDir => async function steps(assert, bus) {
    fs.writeFileSync(path.join(bus.config.workDir, 'ut-port-ftp', filename), initialText);
    await bus.importMethod('ftp.unknown')({})
        .catch(e => assert.equal(e.type, 'ftpPort.unknownMethod', 'unknown method'));
    await bus.importMethod('ftp.list')({remoteDir: 'abcd'})
        .catch(e => assert.equal(e.type, 'ftpPort', 'missing dir'));
    await bus.importMethod('ftp.download')({remoteFile: 'nonexistingfile.txt'})
        .catch(e => assert.equal(e.type, 'ftpPort', 'file does not exist'));
    await bus.importMethod('ftp.remove')({remoteFile: 'nonexistingfile.txt'})
        .catch(e => assert.equal(e.type, 'ftpPort', 'file does not exist'));

    const remoteFile = path.join(remoteDir, filename);

    await bus.importMethod('ftp.upload')({localFile: filename, remoteFile})
        .then(r => assert.ok(r, 'Successfully upload file'));
    await bus.importMethod('ftp.download')({remoteFile})
        .then(r => assert.ok(Buffer.from(r).toString() === initialText));
    await bus.importMethod('ftp.append')({data: appendText, fileName: remoteFile})
        .then(r => assert.ok(r, 'Successfully append data to uploaded file'));

    await bus.importMethod('ftp.list')({remoteDir})
        .then(r => assert.ok(r.findIndex(i => (i.name || i.filename) === filename) > -1, 'File is found on remote'));
    await bus.importMethod('ftp.download')({remoteFile})
        .then(r => {
            assert.ok(Buffer.from(r).length > 0, 'File has content');
            assert.ok(Buffer.from(r).toString() === initialText + appendText);
            return true;
        });
    await bus.importMethod('ftp.download')({remoteFile, localFile: 'ftpDownload.txt'})
        .then(({filepath}) => assert.ok(fs.readFileSync(filepath).length > 0, 'File was downloaded'));

    await bus.importMethod('ftp.remove')({remoteFile})
        .then(r => assert.ok(r, 'File is successfully removed'));
    await bus.importMethod('ftp.list')({remoteDir})
        .then(r => assert.ok(r.findIndex(i => (i.name || i.filename) === filename) === -1, 'File is not found on remote'));

    await bus.importMethod('ftp.upload')({localFile: filename, remoteFile})
        .then(r => assert.ok(r, 'Successfully upload file'));
    await bus.importMethod('ftp.rename')({remoteFile, remoteTarget: path.join(remoteDir, `new_${filename}`)})
        .then(r => assert.ok(r, 'Successfully rename file'));
    await bus.importMethod('ftp.list')({remoteDir})
        .then(r => assert.ok(r.findIndex(i => (i.name || i.filename) === `new_${filename}`) >= 0, 'Remote file was renamed'));
    await bus.importMethod('ftp.rename')({remoteFile, remoteTarget: `new_${filename}`})
        .catch(e => assert.equal(e.type, 'ftpPort', 'inexistent file rename should fail'));
};
