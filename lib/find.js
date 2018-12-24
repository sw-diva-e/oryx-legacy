'use strict';

const path = require('path');
const globby = require('globby');
const log = require('./log');
const cwd = process.cwd();

function parseSettings(settings) {
    return Object.assign({}, {
        glob: {
            onlyFiles: false
        }
    }, settings);
}

function parseOrigin(initial) {
    return initial || {};
}

function glob(configuration, dirs, patterns) {
    return dirs.reduce((results, dir) => {
        let relativeRoot = dir.replace(cwd, '.');
        log.debug('searching in', relativeRoot + '...');

        let rootConfiguration = Object.assign({}, configuration, {
            cwd: dir
        });

        let rootResults = globby
            .sync(patterns, rootConfiguration)
            .map(result => path.join(dir, result));

        return results.concat(rootResults);
    }, []);
}

function toObject(paths, defineName) {
    return paths.reduce((object, currentPath) => {
        let name = defineName ? defineName(currentPath) : path.basename(currentPath);
        object[name] = currentPath;
        return object;
    }, {});
}

function find(settings, initial) {
    log.task('find');

    settings = parseSettings(settings);
    initial = parseOrigin(initial);

    log.debug('settings:', settings);
    log.debug('initial:', initial);

    if (settings.description) {
        log.step(settings.description);
    }

    let results = glob(settings.glob, settings.dirs, settings.patterns);
    let count = 0;

    if (Array.isArray(initial)) {
        results = initial.concat(results);
        count = results.length;
    } else {
        results = Object.assign({}, initial, toObject(results, settings.defineName));
        count = Object.keys(results).length;
    }

    log.debug('results:', results);
    log.done(count, 'found');

    return results;
}

module.exports = find;
