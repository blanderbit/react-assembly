var commonCtrlVars = {
  totalTracks: null,
  isLoading: false,
  sortKey: 'title',
  sortDirection: 1,
  playingSound: null,
  playingTrack: null,
  currentTimer: '00:00',
  fullTimer: '00:00',
  playingProgress: 0,
  collection: 'Track'
};

export default function TracksController(TracksService, $window, $uibModal, Track, Song, SoundcloudSong, $scope,
  PitchedTrack) {
  'ngInject';

  var ctrl = this;

  $scope.$on('$destroy', function() {
    buzz.sounds.forEach(function(sound) {
      sound.stop();
    });
  });

  $scope.$watch(function() {return ctrl.collection;}, function() {
    ctrl.tracks = [];
    ctrl.loadMoreTracks();
    ctrl.getStats();
  });

  $scope.$watch(function () { return ctrl.specificTags; }, function () {
    ctrl.tracks = [];
    ctrl.loadMoreTracks();
    ctrl.getStats();
  }, true);

  Object.assign(this, {
    $uibModal,
    Track,
    Song,
    SoundcloudSong,
    PitchedTrack,
    TracksService,
    $scope
  });

  this.tracks = [];
  this.selectedTracks = [];

  _.assign(this, commonCtrlVars);

  this.loadMoreTracks();
  this.getStats();

  this.TRACK_TYPES = {
    Song: {
      label: 'S3',
      color: '#adffe2'
    },
    SoundcloudSong: {
      label: 'SC',
      color: '#eedddd'
    },
    PitchedTrack: {
      label: 'Pitched Track',
      color: '#f7f3cf'
    }
  };

  this.ALL_TAGS = [
    { id: 'mainstream', label: 'mainstream' },
    { id: 'indie', label: 'indie' },

    { id: 'paris', label: 'paris' },
    { id: 'new_orleans', label: 'new_orleans' },
    { id: 'nyc', label: 'nyc' },
    { id: 'stockholm', label: 'stockholm' },
    { id: 'classic_mix', label: 'classic_mix' },
    { id: 'miami', label: 'miami' },
    { id: 'berlin', label: 'berlin' },
    { id: 'christmas', label: 'christmas' },
    { id: 'st_barths', label: 'st_barths' },
    { id: 'oldies', label: 'oldies' },
    { id: 'fitness_max', label: 'fitness_max' },
    { id: 'fitness_mid', label: 'fitness_mid' }
  ];
}

var genericTracksCtrl = {
  trackDisplayName: function(track) {
    if (track.artistName && track.title) {
      return [track.artistName, track.title].join(' - ');
    } else {
      return track.artistName || track.title || 'Empty';
    }
  },

  trackIsValid: function(track) {
    if (track.state === 'complete') {
      return true;
    } else {
      return false;
    }
  },

  getTagSubquery: function() {
    return _.keys(this.specificTags).filter((k) => this.specificTags[k]);
  },

  loadMoreTracks: function() {
    var ctrl = this;

    if (this.isLoading) return;
    this.isLoading = true;

    var tracks = this[this.collection].query({
      skip: ctrl.tracks.length,
      sortKey: ctrl.sortKey,
      sortDirection: ctrl.sortDirection,
      tags: this.getTagSubquery(),
      q: ctrl.search
    }, function() {
      if (tracks) {
        ctrl.tracks = ctrl.tracks.concat(tracks);
      }
      ctrl.isLoading = false;
    });
  },

  openEditModal: function(track) {
    var ctrl = this;

    var modalInstance = this.$uibModal.open({
      templateUrl: 'track_edit_modal.tpl.html',
      controller: 'TrackEditModalController',
      controllerAs: 'trackEditCtrl',
      size: 'md',
      resolve: {
        track: function() {
          var res = track.type || 'Track';
          return ctrl[res].get({ trackId: track._id }).$promise;
        },
        onCancel: function() {
          return function() {
            ctrl.isLoading = true;
            var reloadedTrack = ctrl.Track.get({trackId: track._id}, function() {
              ctrl.isLoading = false;
              _.assign(track, reloadedTrack);
            });
          };
        },
        onSave: function() {
          return function() {
            ctrl.isLoading = true;
            var reloadedTrack = ctrl.Track.get({trackId: track._id}, function() {
              ctrl.isLoading = false;
              _.assign(track, reloadedTrack);
            });
          };
        }
      }
    });
  },

  toggleSort: function(sortKey) {
    if (this.sortKey === sortKey) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortKey = sortKey;
      this.sortDirection = 1;
    }

    this.tracks = [];
    this.loadMoreTracks();
  },

  toggleSelection: function(track) {
    if (this.isSelected(track)) {
      _.pull(this.selectedTracks, track);
    } else {
      this.selectedTracks.push(track);
    }
  },

  isSelected: function(track) {
    return this.selectedTracks.indexOf(track) !== -1;
  },

  deleteTrack: function(track) {
    var modalInstance = this.$uibModal.open({
      templateUrl: 'track_delete_modal.tpl.html',
      controller: 'TrackDeleteModalController',
      controllerAs: 'trackDeleteCtrl',
      size: 'sm',
      resolve: {
        track: function() {
          return track;
        }
      }
    });

    modalInstance.result.then(function() {
      track.state = 'deleted';
      track.$delete();
    });
  },

  getStats: function() {
    var ctrl = this;
    this[this.collection].count({
      tags: this.getTagSubquery()
    }).$promise
      .then(function(data) {
        ctrl.totalTracks = data.count;
      });
  },

  toggleImage: function($event) {
    var $el = $($event.currentTarget);
    $el.toggleClass('enlarged');
  },

  doSearch: function() {
    this.tracks = [];
    this.loadMoreTracks();
  },

  togglePlay: function(track) {
    /* global buzz */
    var ctrl = this;

    var stop = function() {
      ctrl.playingSound.stop();
      ctrl.playingSound.unbind('timeupdate');
      ctrl.playingSound.sound.src = '';
      ctrl.playingSound = null;
      ctrl.playingTrack = null;
      ctrl.playingProgress = 0;

      _.assign(ctrl, {
        playingSound: null,
        playingTrack: null,
        playingProgress: 0,
        currentTimer: '00:00',
        fullTimer: '00:00'
      });
    };

    var play = function(track) {
      ctrl.playingSound = new buzz.sound(track.file);
      ctrl.playingTrack = track;
      ctrl.playingSound.play();

      ctrl.playingSound.bind('timeupdate', _.throttle(function() {
        ctrl.currentTimer = buzz.toTimer(this.getTime());
        ctrl.playingProgress = buzz.toPercent(this.getTime(), this.getDuration());
        ctrl.$scope.$apply();
      }, 500));

      ctrl.playingSound.bindOnce('durationchange', function() {
        ctrl.fullTimer = buzz.toTimer(this.getDuration());
        ctrl.$scope.$apply();
      });
    };

    if (!this.playingSound) {
      play(track);
    } else if (this.playingTrack === track) {
      this.playingSound.togglePlay();
    } else {
      stop();
      play(track);
    }
  },

  isCurrent: function(track) {
    return this.playingTrack === track;
  },

  isPaused: function() {
    return this.playingSound && this.playingSound.isPaused();
  },

  playNext: function() {
    if (!this.playingTrack) return;
    var currentIndex = this.tracks.indexOf(this.playingTrack);

    if (currentIndex === -1 || currentIndex === this.tracks.length - 1) return;

    this.togglePlay(this.tracks[currentIndex + 1]);
  },

  playPrevious: function() {
    if (!this.playingTrack) return;
    var currentIndex = this.tracks.indexOf(this.playingTrack);

    if (currentIndex === -1 || currentIndex === 0) return;

    this.togglePlay(this.tracks[currentIndex - 1]);
  },

  handleProgressBarClick: function(e) {
    var fullWidth = $(e.currentTarget).width();
    var requestedPosition = e.offsetX / fullWidth * 100;
    if (this.playingSound) {
      this.playingSound.setPercent(requestedPosition);
    }
  }

};

TracksController.prototype = genericTracksCtrl;
