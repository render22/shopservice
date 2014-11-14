var dbOptions={
    exportOptions: {
        host: 'localhost',
        port: '5432',
        user: 'postgres',
        password: 'root',
        schemaOnly: false,
        database: 'Ads',
        dumpFile:'db.sql'
    },
    importOptions: {
        host: 'localhost',
        port: '5432',
        user: 'postgres',
        password: 'root',
        database: 'TestImport',
        dumpFile:'db.sql'
    }
}

module.exports = function (grunt) {

    [
        'grunt-cafe-mocha'

    ].forEach(function (task) {

            grunt.loadNpmTasks(task);

        });

    grunt.loadTasks('grunt-tasks');

    grunt.initConfig({

        cafemocha: {

            all: {src: 'unit-tests/api-tests.js', options: {ui: 'tdd', timeout: 5000}}

        },


        build_db: {

            all: {
                options: dbOptions
            }
        },

        clean_db: {
            all: {
                options: dbOptions.importOptions
            }
        }


    });

    //Here we run clean_db task twice in case if previous attempt was failed and last clean_db task was not performed
    grunt.registerTask('unittests', ['clean_db','build_db','cafemocha','clean_db']);//['build_db','cafemocha','clean_db']);

};