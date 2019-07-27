var TrackToProcessInfo = function(data) {
  this.isNew = data.isNew || false;
  this.file = data.file;
  this.state = data.state;
};

TrackToProcessInfo.prototype = {
  isProcessable: function() {
    return this.isNew || (this.state !== 'complete' && this.state !== 'error' && this.state !== 'deleted');
  }
};

module.exports = TrackToProcessInfo;
