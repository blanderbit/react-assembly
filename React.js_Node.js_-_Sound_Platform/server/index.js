'use strict';

const express = require('express');

const path = require('path');
const fs = require('fs');
const http = require('http');

const logger = require('./logger').main;

if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
  logger.info('Reading local .env file');
  require('node-env-file')(path.join(__dirname, '..', '.env'), { overwrite: true });
}

const soapServer = require('./soap_server');

const app = express();

require('./config')(app);

// mongoose models
const models = require('./models');

models.connect(process.env.MONGOLAB_URI);

app.use(require('./routes'));

// log a warning when trying to serve with Node.js in prod
// const staticOpts = (process.env.NODE_ENV === 'production') ?
// {
//   setHeaders: (res, filePath) => {
//     logger.warn(
//       `Serving ${filePath} with node static server`,
//       res.req.url,
//       res.req.headers.referer,
//       res.req.headers['user-agent']
//     );
//   }
// } :
// null;

//  static service
app.use(express.static(path.join(__dirname, '..', 'generated')));
app.use(express.static(path.join(__dirname, '..', 'landing-pages')));

const server = http.createServer(app);

module.exports.app = app;
module.exports.server = server;

module.exports.startServer = () => {
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    logger.info(`Listening on ${port}`);
  });

  soapServer.startServer(server);
};

if (require.main === module) {
  module.exports.startServer();
}
