require('./index.js');
var terminal = require('child_process').spawn('cmd');

terminal.stdout.on('data', function (data) {
    if (data.toString().trim().length)
        console.log('childTerminal: ' + data);
});

/*terminal.stderr.on('end', function (data) {
 console.log('childTerminal: ' + data);
 });*/

terminal.on('exit', function (code) {

    process.exit();
});

terminal.stdin.write('grunt unittests\n');

terminal.stdin.end();