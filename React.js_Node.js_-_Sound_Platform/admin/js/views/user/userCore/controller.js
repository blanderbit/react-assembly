class UserController {
  constructor($uibModal, $window, Event, SoundcloudSong, Song, PitchedTrack, User, $state) {
    'ngInject';

    Object.assign(this, {
      Song,
      SoundcloudSong,
      PitchedTrack,
      $uibModal,
      $window,
      Event,
      User,
      $state
    });
  }

  $onInit() {
    this.IS_MRSSPORTY = this.user.type === 'MrssportyUser';
    this.IS_FITBOX = this.user.type === 'FitboxUser';
    this.IS_REGULAR = _.isNil(this.user.type);

    this.request = {
      startDate: moment().startOf('day').toDate(),
      endDate: moment().endOf('day').toDate(),
      client: {
        stream: true,
        web: true,
        sonos: true
      }
    };

    this.searchPerformed = false;
  }

  toggleDatePicker(type) {
    this[`${type}DatePickerOpened`] = !this[`${type}DatePickerOpened`];
  }

  getQueryParams() {
    return {
      startDate: moment(this.request.startDate).format(),
      endDate: moment(this.request.endDate).format(),
      client: _.keys(this.request.client).filter((k) => !!this.request.client[k])
    };
  }

  showEvents() {
    const { Event } = this;

    this.isLoading = true;
    this.searchPerformed = true;
    Event.query(
      _.assign(this.getQueryParams(), {
        userId: this.user._id
      }),
    (_events) => {
      this.isLoading = false;
      this.events = _events;
    }, () => {
      this.events = [];
      this.isLoading = false;
    });
  }

  download(format) {
    const { $window } = this;
    const url = '/admin/api/users/' + this.user._id + '/events/' + format + '?' + queryString.stringify(this.getQueryParams());
    $window.open(url);
  }

  openEditModal(event) {
    const { $uibModal } = this;
    $uibModal.open({
      templateUrl: 'track_edit_modal.tpl.html',
      controller: 'TrackEditModalController',
      controllerAs: 'trackEditCtrl',
      size: 'md',
      resolve: {
        track: () => {
          const provider = this[event.trackType];
          return provider.get({ trackId: event.trackId }).$promise;
        },
        onCancel: () => _.noop,
        onSave: () => (_track) => _track.$save()
      }
    });
  }

  convertToRegular() {
    const { $uibModal, user } = this;

    $uibModal.open({
      component: 'confirmationModal',
      resolve: {
        title: () => 'Confirm changing user type',
        okButton: () => 'Confirm',
        description: () => `You are about to switch ${user.email} to Regular type.
          All user-specific settings will be reset to defaults specified for Regular type.`
      }
    })
    .result
    .then(() => {
      this.changeUserType('User');
    }, _.noop);
  }

  convertToSportySubclass(subclass) {
    const { $uibModal, user } = this;

    $uibModal.open({
      component: 'confirmationModal',
      resolve: {
        title: () => 'Confirm changing user type',
        okButton: () => 'Confirm',
        description: () => `You are about to switch ${user.email} to ${subclass} type.
          All user-specific settings will be reset to defaults specified for ${subclass} type.`
      }
    })
    .result
    .then(() => {
      this.changeUserType(`${subclass}User`);
    }, _.noop);
  }

  changeUserType(type) {
    const { User, $state, user } = this;
    return User.changeType({ userId: user.id }, { type })
      .$promise
      .then(() => {
        $state.reload();
      })
      .catch(() => {
        alert('Something went wrong');
      });
  }
}

export default UserController;
