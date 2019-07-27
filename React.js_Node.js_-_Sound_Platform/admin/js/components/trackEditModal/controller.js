export default function TrackEditModalController($uibModalInstance, track, onCancel, onSave, TracksService) {
  'ngInject';

  this.track = track;

  this.fingerprintState = {
    eligible: track.type === 'SoundcloudSong' && track.state !== 'complete',
    success: false,
    fail: false,
    processing: false
  };

  this.save = function() {
    track.tags = _(this.tagsList)
      .filter(function(t) {return t.active;})
      .map('id')
      .value();

    if (_.isEmpty(track.tags)) {
      track.tags = ['classic_mix'];
    }

    track.$save()
      .then(function() {
        $uibModalInstance.close();
        onSave(track);
      })
      .catch(function() {
        alert('Failed to save track');
      });
  };

  this.cancel = function() {
    $uibModalInstance.dismiss();
    onCancel();
  };

  this.getReadableTags = TracksService.getReadableTags;

  this.tagsList = TracksService.tagsSet
    .map(function(t) {
      var active = _.includes(track.tags, t.id);
      return _.assign({}, t, {active: active});
    });

  this.fingerprint = function() {
    var self = this;
    this.fingerprintState.processing = true;
    this.fingerprintState.eligible = false;
    this.fingerprintState.success = false;
    this.fingerprintState.fail = false;

    this.track.$fingerprint()
      .then(
        function() {
          self.fingerprintState.processing = false;
          self.fingerprintState.success = true;
          self.fingerprintState.eligible = false;
        },

        function() {
          self.fingerprintState.processing = false;
          self.fingerprintState.fail = true;
          self.fingerprintState.eligible = true;
        }
      );
  };
};
