module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		typescript: {
		  base: {
			src: ['src/*.ts'],
			dest: 'src/',
			options: {
			  module: 'amd', //or commonjs
			  target: 'es5', //or es3
			  basePath: 'src/',
			  sourceMap: false,
			  declaration: true,
			  watch: true
			}
		  }
		},
	});
	grunt.loadNpmTasks('grunt-typescript');
	grunt.registerTask('default', ['typescript']);
};