import { Howler, Howl } from 'howler';

export default function playerMainController($scope, api, $element, $rootScope, UserService, $q, $timeout,
  $interval, IS_MRSSPORTY, MOBILE) {
    'ngInject';

  Howler.usingWebAudio = MOBILE;

  this.FADE_TRANSITION_SEC = 16;
  this.FADE_TRANSITION_MSEC = this.FADE_TRANSITION_SEC * 1000;
  this.QUEUE_LENGTH = 6;
  this.KEEP_PREVIOUS = 20;

  var INITIAL_VOLUME = 50;

  this.DEFAULT_COVER_IMAGE = '/play/images/coverart_generic.jpg';

  this.queue = [];
  this.previousQueue = [];

  this.volume = INITIAL_VOLUME;

  this.$scope = $scope;
  this.$element = $element;
  this.$timeout = $timeout;
  this.$interval = $interval;
  this.IS_MRSSPORTY = IS_MRSSPORTY;
  this.$rootScope = $rootScope;

  this.api = api;

  this.currentMood = 0;

  this.isPlaying = false;
  this.isReady = false;

  this.animationStep = _.throttle(() => {
    const sound = this.current && this.current.sound;
    if (sound && sound.playing()) {
      this.updateTimers();
      requestAnimationFrame(this.animationStep);
    }
  }, 200);

  this.clickSkip = _.throttle(() => {
    if (this.queue.length < 2) return;
    this.cancelInterval();
    this.next();
  }, 500);

  UserService.user();

  $rootScope.$on('user:settings-changed', () => {
    this.reloadQueue();
  });

  $rootScope.$on('reload-playlist', () => {
    this.reloadQueue();
  });

  $rootScope.$on('player-stop', () => {
    if (this.current && this.current.sound) {
      this.cancelInterval();
      this.current.sound.off('end');

      this.fadeAndStop(this.current.sound, () => {
        this.updateTimers(true);
        this.current = null;
        this.subsequent = null;
        this.isPlaying = false;
        this.stopChangingSchedule();
        $rootScope.$digest();
      });
    } else {
      this.cleanupPrevious();
    }
    this.stopChangingSchedule();
  });

  $rootScope.$on('subscription-sent', () => {
    this.start();
  });

  $rootScope.$on('schedule-changing-voice', () => this.startChangingSchedule());

  var loadTracksPromise = this.loadMore(this.QUEUE_LENGTH, true)
    .then((tracks) => {
      this.appendToQueue(tracks);
      this.updateCurrent();
    });

  var optionsPromise = UserService.userReady()
    .then((user) => {
      this.FADE_TRANSITION_SEC = _.get(user, 'options.transition', 16);
      this.FADE_TRANSITION_MSEC = this.FADE_TRANSITION_SEC * 1000;
    });

  $q.all([loadTracksPromise, optionsPromise])
    .then(() => {
      const schedule = _.get($rootScope, 'user.options.schedule');
      this.isReady = true;

      if (schedule) {
        // TODO
        this.setupSchedule(schedule);
      } else if (!MOBILE) {
        this.play();
        this.startChangingSchedule();
      }
    });

  this.elRoundProgress = $('.round-progress')[0];
  this.elCurrentTimer = $('#current-timer')[0];
  this.elTotalTimer = $('#total-timer')[0];
}

playerMainController.prototype = {
  start() {
    return this.reloadQueue(true)
      .then(() => {
        this.updateCurrent();
        this.play();
        this.startChangingSchedule();
      });
  },

  setupSchedule(schedule) {
    const scheduleStart = window.later.parse.cron(schedule.startPlaying);
    const scheduleStop = window.later.parse.cron(schedule.stopPlaying);

    window.later.setInterval(() => {
      if (!this.isPlaying) {
        this.start();
        this.$scope.$apply();
      }
    }, scheduleStart);

    window.later.setInterval(() => {
      if (this.isPlaying) {
        this.cancelInterval();
        this.current.sound.off('end');

        this.fadeAndStop(this.current.sound, () => {
          this.updateTimers(true);
          this.current = null;
          this.subsequent = null;
          this.isPlaying = false;
          this.$scope.$digest();
          this.stopChangingSchedule();
        });
        this.$scope.$apply();
      }
    }, scheduleStop);
  },

  updateTimers(reset) {
    let seek = 0;
    let duration = 0;

    if (!reset) {
      const sound = this.current.sound;
      try {
        seek = sound.seek() || 0;
        duration = sound.duration() || 0;
      } catch (e) {}
    }

    const progress = seek !== 0 && duration !== 0 ? (seek / duration * 360) : 0;

    let deg;
    if (progress <= 180) {
      deg = 90 + progress;
      this.elRoundProgress.style.backgroundImage = 'linear-gradient(' + deg + 'deg, transparent 50%, #eaeaea 50%), linear-gradient(90deg, #eaeaea 50%, transparent 50%)';
    } else {
      deg = 90 + progress - 180;
      this.elRoundProgress.style.backgroundImage = 'linear-gradient(' + deg + 'deg, transparent 50%, #38d4d6 50%), linear-gradient(90deg, #eaeaea 50%, transparent 50%)';
    }

    this.elCurrentTimer.innerHTML = this.formatTime(seek);
    this.elTotalTimer.innerHTML = this.formatTime(duration);
  },

  updateAnimationSpeed(track) {
    var oscPeriod = 60 / track.bpm;
    var animationPeriod = oscPeriod * 3 + 's';
    this.$element.find('.bars-container div').each(function() {
      $(this).css('animation-duration', animationPeriod);
    });
  },

  play() {
    if (this.current.sound && this.current.shouldSkip) {
      this.$timeout(() => {
        this.next();
      }, 2500);
      return;
    }

    this.current.sound = this.current.sound || new Howl({
      src: [this.current.file],
      volume: 0,
      autoplay: false
    });

    const sound = this.current.sound;
    sound.once('play', () => {
      sound.fade(0, this.volume / 100.0, this.FADE_TRANSITION_MSEC);
      if (this.subsequent && !this.subsequent.sound) {
        this.subsequent.sound = new Howl({
          src: [this.subsequent.file],
          volume: 0,
          autoplay: false
        });

        const track = this.subsequent;
        this.subsequent.sound.once('loaderror', () => {
          track.shouldSkip = true;
        });
      }
    });

    sound.on('play', () => {
      requestAnimationFrame(this.animationStep);
      if (!this.current.playReported) {
        this.api.markAsPlayed(this.current);
        this.current.playReported = true;
      }
      this.updateAnimationSpeed(this.current);
      this.startInterval();
      this.$scope.$digest();
    });

    sound.once('loaderror', () => {
      this.$timeout(() => {
        if (this.isPlaying) {
          this.cancelInterval();
          this.next();
        }
      }, 2500);
      this.$scope.$digest();
    });

    sound.once('end', () => {
      if (this.current && this.current.sound === sound && this.isPlaying) {
        this.cancelInterval();
        this.next();
      }
      this.$scope.$digest();
    });

    sound.play();
    this.isPlaying = true;
  },

  startInterval() {
    const { $interval } = this;

    if (this.pollInterval) {
      $interval.cancel(this.pollInterval);
    }

    this.pollInterval = $interval(() => this.checkAboutToEnd(), 1000);
  },

  cancelInterval() {
    const { $interval } = this;
    if (this.pollInterval) {
      $interval.cancel(this.pollInterval);
      this.pollInterval = null;
    }
  },

  checkAboutToEnd() {
    if (this.current && this.current.sound) {
      let rem;
      try {
        let seek = this.current.sound.seek();
        let duration = this.current.sound.duration();
        rem = duration - seek;
      } catch (e) {}

      if (rem && rem > 0 && rem < this.FADE_TRANSITION_SEC) {
        this.cancelInterval();
        this.next();
      }
    }
  },

  updateCurrent() {
    this.current = this.queue[0];
    this.subsequent = this.queue[1] ? this.queue[1] : null;
  },

  destroySound(sound) {
    const destroy = () => {
      sound.off('fade');
      sound.off('play');
      sound.off('loaderror');
      sound.off('end');
      sound.stop();
      sound.unload();
    };

    if (sound.state() === 'loading') {
      sound.once('load', () => {
        destroy();
      });
    } else {
      destroy();
    }
  },

  fadeAndStop(sound, _cb) {
    const cb = _cb ? _.once(_cb) : _.noop;

    if (!sound) throw new Error('No sound to fadeAndStop');
    sound.fade(this.volume / 100.0, 0, this.FADE_TRANSITION_MSEC);

    const timeout = setTimeout(() => {
      this.destroySound(sound);
      cb();
    }, 2 * this.FADE_TRANSITION_MSEC);

    sound.once('fade', () => {
      clearTimeout(timeout);
      this.destroySound(sound);
      cb();
    });
  },

  next() {
    let currentSeek = 0;
    let shouldStopGracefully = false;

    // TODO: extract shouldStopGracefully to parameter
    if (this.current.sound && this.current.sound.playing()) {
      try {
        currentSeek = this.current.sound.seek();
      } catch (e) {}

      if (currentSeek > this.FADE_TRANSITION_SEC) {
        shouldStopGracefully = true;
      }
    }

    const currentSound = this.current.sound;

    if (currentSound) currentSound.off('end');

    this.appendPrevious(this.queue.shift());

    this.updateCurrent();
    this.play();

    if (this.QUEUE_LENGTH > this.queue.length) {
      this.loadMore(this.QUEUE_LENGTH - this.queue.length)
        .then((tracks) => {
          this.appendToQueue(tracks);
        });
    }

    if (shouldStopGracefully) {
      this.fadeAndStop(currentSound);
    } else {
      this.cleanupPrevious();
    }

    this.updateTimers(true);
  },

  appendPrevious(track) {
    this.previousQueue.push(track);
    if (this.KEEP_PREVIOUS < this.previousQueue.length) {
      this.previousQueue =
        _.drop(this.previousQueue, this.previousQueue.length - this.KEEP_PREVIOUS);
    }
  },

  clickPlay() {
    if (this.isPlaying || !this.isReady) return;

    if (this.current) {
      if (!this.current.sound) {
        this.play();
      } else {
        this.setVolume();
        this.current.sound.play();
      }

      this.isPlaying = true;
    } else if (this.queue.length) {
      this.updateCurrent();
      this.play();
    } else {
      this.start();
    }
    this.startChangingSchedule();
  },

  cleanupPrevious() {
    this.previousQueue.forEach((track) => {
      if (track.sound) this.destroySound(track.sound);
    });
  },

  clickPause() {
    this.current.sound.pause();

    this.cleanupPrevious();
    this.cancelInterval();
    this.isPlaying = false;
    this.stopChangingSchedule();
  },

  setVolume(value) {
    if (typeof value === 'undefined') {
      value = this.volume;
    }
    this.volume = value;
    if (this.current && this.current.sound) {
      this.current.sound.volume(this.volume / 100.0);
    }
    if (this.changingSound) {
      this.changingSound.volume(this.volume / 100.0);
    }
  },

  toggleLike(song) {
    if (song.isBeingLiked) return;
    var previousState = song.isLiked;
    song.isLiked = !song.isLiked;
    song.isBeingLiked = true;
    this.api[song.isLiked ? 'like' : 'unlike'](song)
      .catch(() => {
        song.isLiked = previousState;
      })
      .finally(() => {
        song.isBeingLiked = false;
      });
  },

  onMoodChange(mood) {
    this.currentMood = mood;
    this.reloadQueue();
  },

  reloadQueue(force) {
    return this.loadMore(force ? this.QUEUE_LENGTH : this.QUEUE_LENGTH - 1)
      .then((tracks) => {
        this.queue.splice(force ? 0 : 1);
        this.appendToQueue(tracks);
      });
  },

  preloadImages(tracks) {
    return tracks.map((track) => {
      const original = track.coverImage;

      track.coverImage = this.DEFAULT_COVER_IMAGE;

      if (original) {
        let img = new Image();

        let timeout;

        const cleanup = () => {
          img.onload = null;
          img.onerror = null;
          img = null;
          clearTimeout(timeout);
        };

        timeout = setTimeout(() => {
          cleanup();
        }, 2000);

        img.onerror = () => {
          cleanup();
        };

        img.onload = () => {
          cleanup();
          track.coverImage = original;
          this.$scope.$apply();
        };
        img.src = original;
      }

      return track;
    });
  },

  loadMore(howMany, mostRecent) {
    const opts = {
      count: howMany || 5,
      mood: this.currentMood
    };

    const reject = _(this.queue).concat(this.previousQueue).map('_id').value();
    if (reject.length) {
      opts.reject = reject;
    }

    if (mostRecent) {
      opts.mostRecent = true;
    }

    // TODO: don't allow to query if query is in progress
    return this.api.next(opts)
      .then((tracks) => this.preloadImages(tracks));
  },

  appendToQueue(tracks) {
    tracks.forEach((t) => {
      t.uniqueId = _.uniqueId();
      this.queue.push(t);
    });
    return tracks;
  },

  formatTime(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = Math.floor(secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  },

  stopChangingSchedule() {
    const { $interval } = this;

    if (this.changingInterval) $interval.cancel(this.changingInterval);
    if (this.changingSound) {
      this.changingSound.unload();
      this.changingSound = null;
    }

    this.changingInterval = null;
    this.hasChangingSchedule = false;

    this.stopChangingCountdown();
  },

  playChangingSound() {
    const current = _.get(this, 'current.sound');
    if (current) {
      current.volume((this.volume * 0.5) / 100.0);
    }

    this.changingSound.play();
    this.changingSound.once('end', () => {
      if (current) {
        current.volume(this.volume / 100.0);
      }
    });
  },

  toggleChangingSchedule() {
    return this.hasChangingSchedule ? this.stopChangingSchedule() : this.startChangingSchedule();
  },

  startChangingSchedule(rightAway) {
    const { $rootScope, $interval } = this;
    const changingLang = _.get($rootScope, 'user.changing_voice');
    const changingInterval = _.get($rootScope, 'user.changing_voice_interval', 60);

    this.stopChangingSchedule();

    if (!changingLang) return;

    const changingVoiceUrl = `https://mp3source.s3.amazonaws.com/changing_voices/${changingLang}.mp3`;

    this.changingSound = new Howl({
      src: changingVoiceUrl,
      autoplay: false,
      volume: this.volume / 100.0
    });

    if (rightAway) {
      this.playChangingSound();
    }

    this.startChangingCountdown(changingInterval);
    this.hasChangingSchedule = true;
    this.changingInterval = $interval(() => {
      this.stopChangingCountdown();
      this.playChangingSound();
      this.startChangingCountdown(changingInterval);
    }, changingInterval * 1000);
  },

  startChangingCountdown(changingInterval) {
    const { $interval } = this;
    const interval = 1;

    this.changingCountdown = changingInterval;

    this.changingCountdownInterval = $interval(() => {
      this.changingCountdown -= interval;
    }, interval * 1000);
  },

  stopChangingCountdown() {
    const { $interval } = this;
    this.changingCountdown = null;
    $interval.cancel(this.changingCountdownInterval);
    this.changingCountdownInterval = null;
  }
};
