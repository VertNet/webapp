module.exports = function (grunt) {

  // Use dir arg from command line
  var dir = grunt.option('dir') || 'build';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      std: {
        options: {
          appDir: '.',
          mainConfigFile: 'client/vertnet/main.js',
          baseUrl: 'client/vertnet',
          optimize: 'uglify2',
          inlineText: true,
          findNestedDependencies: true,
          preserveLicenseComments: false,
          wrap: true,
          name: 'main',
          include: 'libs/require/almond',
          dir: dir
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-requirejs');
  grunt.registerTask('build', 'requirejs');

};
