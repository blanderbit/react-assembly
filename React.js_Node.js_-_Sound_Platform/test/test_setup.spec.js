const sinon = require('sinon');
require('sinon-as-promised');
require('sinon-mongoose');

beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
});
