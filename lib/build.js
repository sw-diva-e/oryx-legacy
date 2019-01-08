'use strict';

const colors = require('colors/safe');
const moment = require('moment');
const log = require('./log');

function build(configuration, callback) {
    log.task('build');

    if (!build.webpack) {
        build.loadCompiler();
    }

    log.step('using webpack', build.webpackVersion);

    if (configuration.watch) {
        log.step('watchers enabled', colors.dim('(press [ctrl+c] to exit)'));
    }

    log.step('building assets...');

    try {
        build.webpack(configuration, (error, stats) => {
            let output = !!stats && stats.toString(configuration.stats);
            let duration = moment(stats.endTime - stats.startTime).format('s.SS');
            let message = 'built in ' + duration + 's';
            let logFn = 'done';

            if (error || stats.hasErrors()) {
                message = 'build failed';
                logFn = 'error';
            }

            if (error) {
                log.error(colors.red('webpack configuration:'), error.toString());
                log.error(colors.red('details:'), error.details);
            }

            if (output) {
                log.step('webpack output:\n' + output);
            }

            if (configuration.watch) {
                let endTime = moment(stats.endTime).format('HH:mm:ss');
                message = colors.dim('[' + endTime + '] ') + message + '...';
            }

            log[logFn].apply(log, [message]);

            if (callback) {
                callback(error, stats);
            }
        });
    } catch (error) {
        log.error(colors.red('webpack configuration:'), error.toString());
        log.error('build aborted');

        if (callback) {
            callback(error);
        }
    }
}

build.loadCompiler = function(webpack, webpackVersion) {
    this.webpack = webpack || require('webpack');
    this.webpackVersion = webpackVersion || require('webpack/package').version;
}

module.exports = build;
