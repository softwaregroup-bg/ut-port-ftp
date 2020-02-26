const path = require('path');

module.exports = (protocol) => {
    return [{
        method: `${protocol}.exec`,
        name: 'Upload file successfully',
        params: {localFile: path.join(__dirname, 'data', 'test.txt'), remoteFile: `${protocol}Test.txt`, method: 'upload'},
        result: (result, assert) => assert.true(result, 'Successfully upload file')
    }, {
        method: `${protocol}.exec`,
        name: 'Append data to file',
        params: {data: 'A new line to append \n', fileName: `${protocol}Test.txt`, method: 'append'},
        result: (result, assert) => assert.true(result, 'Successfully append data to uploaded file')
    }, {
        method: `${protocol}.exec`,
        name: 'List files',
        params: {remoteDir: '/', method: 'list'},
        result: (result, assert) => assert.true(result.findIndex(r => r.name === `${protocol}Test.txt`) > -1, 'File is found on remote')
    }, {
        method: `${protocol}.exec`,
        name: 'Download uploaded file',
        params: {remoteFile: `${protocol}Test.txt`, method: 'download'},
        result: (result, assert) => assert.true(result.length > 0, 'File has content')
    }, {
        method: `${protocol}.exec`,
        name: 'Remove uploaded file',
        params: {remoteFile: `${protocol}Test.txt`, method: 'remove'},
        result: (result, assert) => assert.true(result, 'File is successfully removed')
    }, {
        method: `${protocol}.exec`,
        name: 'List files',
        params: {remoteDir: '/', method: 'list'},
        result: (result, assert) => assert.true(result.findIndex(r => r.name === 'ftpTest.txt') === -1, 'File is no longer found on remote')
    }];
};
