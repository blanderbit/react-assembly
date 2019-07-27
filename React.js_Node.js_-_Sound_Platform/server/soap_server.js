'use strict';

let fs = require('fs');
let soap = require('soap');

let soapSessions = require('./soap/sessions');
let metaData = require('./soap/metadata');
const logger = require('./logger').smapi;

let wsdl = fs.readFileSync('./server/sonos.wsdl', 'utf8');

let service = {
  Soundsuit: {
    SonosSoap: {
      getSessionId: soapSessions.getSessionId,
      getMetadata: metaData.getMetadata,
      getMediaMetadata: metaData.getMediaMetadata,
      getMediaURI: metaData.getMediaURI,
      getLastUpdate: metaData.getLastUpdate,
      getExtendedMetadata: metaData.getExtendedMetadata
    }
  }
};

exports.startServer = function(server) {
  const soapServer = soap.listen(server, '/smapi', service, wsdl);
  soapServer.log = (type, data) => {
    logger.debug(type, data);
  };
};
