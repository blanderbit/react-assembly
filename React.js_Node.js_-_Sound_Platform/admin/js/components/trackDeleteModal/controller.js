export default function($uibModalInstance, track) {
  'ngInject';

  this.track = track;

  this.trackDisplayName = (function(track) {
    if (track.artistName && track.title) {
      return [track.artistName, track.title].join(' - ');
    } else {
      return track.artistName || track.title || 'Empty';
    }
  })(track);

  this.confirm = function() {
    $uibModalInstance.close();
  };

  this.cancel = function() {
    $uibModalInstance.dismiss();
  };
};
