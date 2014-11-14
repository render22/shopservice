require('./index.js');
var terminal = require('child_process').spawn('cmd');

terminal.stdout.on('data', function (data) {
    if (data.toString().trim().length) {
        if (~data.toString().indexOf('Aborted') || ~data.toString().indexOf('Fatal error')) {
            console.log(data.toString());
            process.exit(1);
        }
        console.log('childTerminal: ' + data);


    }

});

terminal.stderr.on('data', function (data) {
    console.log(data.toString());
    process.exit(3);
});
/*terminal.stderr.on('end', function (data) {
 console.log('childTerminal: ' + data);
 });*/

terminal.on('exit', function (code) {

    process.exit(0);
});

terminal.stdin.write('grunt unittests\n');

terminal.stdin.end(2);