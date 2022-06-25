const fs = require('fs-extra');
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const path = require('node:path');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const rollupStream = require('@rollup/stream');

const rollupConfig = require('./rollup.config.cjs');

/********************/
/*  CONFIGURATION   */
/********************/

const name = 'crossblade';
const sourceDirectory = './src';
const distDirectory = './dist';
const stylesDirectory = `${sourceDirectory}/styles`;
const stylesExtension = 'css';
const sourceFileExtension = 'ts';
const staticFiles = ['assets', 'fonts', 'lang', 'packs', 'templates', 'module.json'];
const projectDirectory = '.';
const projectFiles = ['README.md', 'CHANGELOG.md'];

/********************/
/*      BUILD       */
/********************/

let cache;

/**
 * Build the distributable JavaScript code
 */
function buildCode() {
  return rollupStream({ ...rollupConfig(), cache })
    .on('bundle', (bundle) => {
      cache = bundle;
    })
    .pipe(source(`${name}.js`))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${distDirectory}/module`));
}

/**
 * Build style sheets
 */
function buildStyles() {
  return gulp.src(`${stylesDirectory}/${name}.${stylesExtension}`).pipe(gulp.dest(`${distDirectory}/styles`));
}

/**
 * Copy static files
 */
async function copyFiles() {
  for (const staticFile of staticFiles) {
    if (fs.existsSync(`${sourceDirectory}/${staticFile}`)) {
      await fs.copy(`${sourceDirectory}/${staticFile}`, `${distDirectory}/${staticFile}`);
    }
  }
  for (const projectFile of projectFiles) {
    if (fs.existsSync(`${projectDirectory}/${projectFile}`)) {
      await fs.copy(`${projectDirectory}/${projectFile}`, `${distDirectory}/${projectFile}`);
    }
  }
}

/**
 * Watch for changes for each build step
 */
function watch() {
  gulp.watch(`${sourceDirectory}/**/*.${sourceFileExtension}`, { ignoreInitial: false }, buildCode);
  gulp.watch(`${stylesDirectory}/**/*.${stylesExtension}`, { ignoreInitial: false }, buildStyles);
  const staticFilesPaths = staticFiles.map((staticFile) => `${sourceDirectory}/${staticFile}`);
  const projectFilesPaths = projectFiles.map((projectFile) => `${projectDirectory}/${projectFile}`);
  gulp.watch(staticFilesPaths.concat(projectFilesPaths), { ignoreInitial: false }, copyFiles);
}

const build = gulp.series(clean, gulp.parallel(buildCode, buildStyles, copyFiles));

/********************/
/*      CLEAN       */
/********************/

/**
 * Remove built files from `dist` folder while ignoring source files
 */
async function clean() {
  const files = [...staticFiles, ...projectFiles, 'module'];

  if (fs.existsSync(`${stylesDirectory}/${name}.${stylesExtension}`)) {
    files.push('styles');
  }

  console.log(' ', 'Files to clean:');
  console.log('   ', files.join('\n    '));

  for (const filePath of files) {
    await fs.remove(`${distDirectory}/${filePath}`);
  }
}

/********************/
/*       LINK       */
/********************/

/**
 * Get the data path of Foundry VTT based on what is configured in `foundryconfig.json`
 */
function getDataPath() {
  const config = fs.readJSONSync('foundryconfig.json');

  if (config?.dataPath) {
    if (!fs.existsSync(path.resolve(config.dataPath))) {
      throw new Error('User Data path invalid, no Data directory found');
    }

    return path.resolve(config.dataPath);
  } else {
    throw new Error('No User Data path defined in foundryconfig.json');
  }
}

/**
 * Link build to User Data folder
 */
async function link() {
  let destinationDirectory;
  if (fs.existsSync(path.resolve(sourceDirectory, 'module.json'))) {
    destinationDirectory = 'modules';
  } else {
    throw new Error('Could not find module.json');
  }

  const linkDirectory = path.resolve(getDataPath(), 'Data', destinationDirectory, name);

  const argv = yargs(hideBin(process.argv)).option('clean', {
    alias: 'c',
    type: 'boolean',
    default: false,
  }).argv;
  const clean = argv.c;

  if (clean) {
    console.log(`Removing build in ${linkDirectory}.`);

    await fs.remove(linkDirectory);
  } else if (!fs.existsSync(linkDirectory)) {
    console.log(`Linking dist to ${linkDirectory}.`);
    await fs.ensureDir(path.resolve(linkDirectory, '..'));
    await fs.symlink(path.resolve(distDirectory), linkDirectory);
  }
}

module.exports = {
  watch,
  build,
  clean,
  link,
};
