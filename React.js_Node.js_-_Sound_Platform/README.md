# Soundsuit

## Structure

The most important parts of Soundsuit are:

### Main player app
Located inside the `front` directory. Built using a set of gulp scripts (`gulp/app`).
Loaded into a browser by `server/views/play.ejs` view.

### Admin app
Located inside the `admin` directory. Built using a set of gulp scripts (`gulp/admin`).
Loaded into a browser by `server/views/admin.ejs` view.

### Landing (deprecated)
Landing uses Wordpress on production. Description below is deprecated.
Consist of a set of static html files (`landing-pages`). Those pages references jss/css/etc that are built (minified) from `landing` directory to `generated/landing`.

### Node.js server
Node.js server does the following:

* works as an API server for a SPAs we have (main, admin) and SONOS clients
* compiles and serves html entry points for SPAs: `play.ejs`, `admin.ejs` etc
* serves static assets from `generated` directory (except production where nginx does it).

## Env variables
To get started you need to copy `.env-template` file to `.env` in main directory and fill in parameter values inside.
To get an idea what env variables should be there, you can have a look at the ones set on stage heroku app (`soundsuit-stage`).

Notable ones:
* **NO_REPEAT_INTERVAL_MINUTES** (default is 120) Tracks shouldn't be repeated during this interval, counting from the time songs was actually played to next query.

* **ANONYMOUS_SESSION_DURATION_SECONDS** Non-registered user session duration

## Persistence
Soundsuit uses self-hosted MongoDB on production and local environment. On stage heroku app we use a free sandbox instance provided by `mlab.com`.

## Development
To start development server run `npm run dev`. That will (see `gulpfile.js` for details):
* build every app we have: landing, admin, app, etc
* start watching for file changes: whenever something is changed, browser reloads (doesn't work when editing landing html - this adjustment is TODO)
* start the Node.js server.

If `gulp` crashes with a weird internal Node error, do the following:
```bash
  npx npm-force-resolutions
  rm -rf node_modules
  npm install
```
See [Github issue for more info](https://github.com/gulpjs/gulp/issues/2162#issuecomment-385197164).

Development server starts on port 5000 unless other is specified by `PORT` env variable.

## File storage
Application hosts mp3 and album cover files on S3 (API access required). There are 2 buckets: mp3source and mp3artwork. Tracks in mp3source are split into directories which indicate "tags". E.g. songs in mp3source/mp3_paris are given "paris" tag etc. For more details, see `tagging.md`.
Mp3 files are not streamed through our server - client browser gets direct signed url to download and play file.

## Deployment

Deployment is performed via `shipit` and its `shipit-deploy` addon.

## How to deploy landing page changes

Landing is deployed together with the main app.

### Common issues
*  If you get `Error: EMFILE, too many open files` on startup,run this: `ulimit -n 1000`
