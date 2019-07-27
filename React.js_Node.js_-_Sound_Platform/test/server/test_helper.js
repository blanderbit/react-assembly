var chai = require('chai')
  .use(require("chai-as-promised"))
  .use(require('chai-datetime'));

require('../test_setup.spec');

module.exports.expect = chai.expect;
