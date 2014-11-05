module.exports=function(grunt) {

    [
        'grunt-cafe-mocha'

    ].forEach(function (task) {

            grunt.loadNpmTasks(task);

        });

    grunt.initConfig({

        cafemocha: {

            all: {src: 'unit-tests/api-tests.js', options: {ui: 'tdd', timeout:5000}}

        }
    });

    grunt.registerTask('unittests', ['cafemocha']);

};