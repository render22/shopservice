var spawn = require('child_process').spawn;
var fs=require('fs');

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('build_db', 'Build database for unit tests', function () {
        var done = grunt.task.current.async();

        var exportOptions = this.options().exportOptions;
        var importOptions = this.options().importOptions;

        if (!exportOptions)
            throw new Error("Export options not provided");

        if (!importOptions)
            throw new Error("Import options not provided");


        var pgDump = spawn('pg_dump', prepareExportCommand(exportOptions));

        pgDump.stdout.on('data', function (data) {

            console.log('pgDump: ' + data);


        });


        pgDump.stderr.on('data', function (data) {

            throw new Error(data.toString());

        });


        pgDump.on('exit', function (code) {
            var psql = spawn('psql', prepareImportCommand(importOptions));

            psql.stderr.on('data', function (data) {

                throw new Error(data.toString());

            });

            psql.on('exit', function (code) {
                done();
            });

            fs.createReadStream(importOptions.dumpFile).pipe(psql.stdin);



        });


    });


};

function prepareExportCommand(exportOptions) {
    var exportCommand = [];
    if (exportOptions.host)
        exportCommand.push('-h' + exportOptions.host);

    if (exportOptions.port)
        exportCommand.push('-p' + exportOptions.port);

    if (exportOptions.user)
        exportCommand.push('-U' + exportOptions.user);

    if (exportOptions.schemaOnly)
        exportCommand.push('--schema-only');

    exportCommand.push('-O');

    if (!exportOptions.database) {
        throw new Error('Export database not provided');
    } else {
        exportCommand.push('-d' + exportOptions.database);
        exportCommand.push('-f' + (exportOptions.dumpFile ? exportOptions.dumpFile : 'dump.sql'));
    }

    return exportCommand;
}


function prepareImportCommand(importOptions) {
    var importCommand = [];
    if (importOptions.host)
        importCommand.push('-h' + importOptions.host);

    if (importOptions.port)
        importCommand.push('-p' + importOptions.port);

    if (importOptions.user)
        importCommand.push('-U' + importOptions.user);


    if (!importOptions.database) {
        throw new Error('Import database not provided');
    } else {
        importCommand.push(importOptions.database);

    }

    return importCommand;
}

