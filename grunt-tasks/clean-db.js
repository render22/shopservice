var spawn = require('child_process').spawn;

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('clean_db', 'Clean database after unit-tests', function () {
        var done = grunt.task.current.async();

        var dbCredentials = this.options();

        var psql = spawn('psql', getConnectionString(dbCredentials));

        psql.stdout.on('data', function (data) {
            console.log('psql: ' + data);

        });


        psql.stderr.on('data', function (data) {
            if (!~data.toString().indexOf('NOTICE'))
                throw new Error(data.toString());

        });

        psql.on('exit', function (code) {
            done();
        });

        psql.stdin.write('DROP SCHEMA public CASCADE;\n');
        psql.stdin.write('CREATE SCHEMA public AUTHORIZATION ' + dbCredentials.user + ';\n');
        psql.stdin.write('GRANT ALL ON SCHEMA public TO ' + dbCredentials.user + ';\n');
        psql.stdin.end();

    });


};


function getConnectionString(dbCredentials) {
    var importCommand = [];
    if (dbCredentials.host)
        importCommand.push('-h' + dbCredentials.host);

    if (dbCredentials.port)
        importCommand.push('-p' + dbCredentials.port);

    if (dbCredentials.user)
        importCommand.push('-U' + dbCredentials.user);


    if (!dbCredentials.database) {
        throw new Error('Target database not provided');
    } else {
        importCommand.push(dbCredentials.database);

    }

    return importCommand;
}


