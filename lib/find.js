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

async function globbyAsync(patterns, rootConfiguration) {
    let rootResults = await globby(patterns, rootConfiguration);

    return rootResults;
}

async function glob(configuration, dirs, patterns) {
    return await dirs.reduce(async (results, dir) => {
        let relativeRoot = dir.replace(cwd, '.');
        log.debug('searching in', relativeRoot + '...');

        let rootConfiguration = Object.assign({}, configuration, {
            cwd: dir
        });

        return await globbyAsync(patterns, rootConfiguration).then(globbyResult => {
            const globbyFullPath = globbyResult.map(result => path.join(dir, result));

            return results.concat(globbyFullPath);
        }, error => {
            log.error(error, 'impossible to resolve globby promise');
        })

    }, []);
}

function toObject(paths, defineName) {
    return paths.reduce((object, currentPath) => {
        let name = defineName ? defineName(currentPath) : path.basename(currentPath);
        object[name] = currentPath;
        return object;
    }, {});
}

async function find(settings, initial) {
    settings = parseSettings(settings);

    log.debug('settings:', settings);

    let results = glob(settings.glob, settings.dirs, settings.patterns);
    let count = 0;

    return await results.then(resolve => {
        log.task('find');

        initial = parseOrigin(initial);

        log.debug('initial:', initial);

        if (settings.description) {
            log.step(settings.description);
        }

        if (Array.isArray(initial)) {
            results = initial.concat(resolve);
            count = resolve.length;
        } else {
            results = Object.assign({}, initial, toObject(resolve, settings.defineName));
            count = Object.keys(resolve).length;
        }

        log.debug('results:', results);
        log.done(count, 'found');

        return results;
    }, error => {
        log.error(error, 'impossible to find entries');
    })
}

module.exports = find;
