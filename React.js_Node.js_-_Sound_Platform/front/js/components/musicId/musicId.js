class MusicIdController {
  constructor(UserService, $rootScope, musicIdService, IS_MRSSPORTY, IS_FITBOX) {
    'ngInject';

    Object.assign(this, {
      UserService,
      $rootScope,
      musicIdService,
      IS_MRSSPORTY,
      IS_FITBOX
    });
  }

  $onInit() {
    const { UserService, $rootScope, IS_MRSSPORTY } = this;

    this.isOpen = false;

    UserService.userReady().then((user) => {
      this.isOpen = user.anonymous || IS_MRSSPORTY;

      if (IS_MRSSPORTY) {
        this.updateSelectionState();
        $rootScope.$on('user:settings-changed', () => {
          this.updateSelectionState();
        });
      }
    });
  }

  updateSelectionState() {
    const { $rootScope } = this;
    this.selectionState = _.pick($rootScope.user, 'workout_type', 'customer_age', 'changing_voice');
    this.form.$setPristine();
  }

  toggleSection($event) {
    const { IS_MRSSPORTY } = this;
    if ($event) $event.stopPropagation();
    if (IS_MRSSPORTY && this.isOpen && this.form.$dirty) this.saveProfile();
    this.isOpen = !this.isOpen;
  }

  toggleItem(collection, item) {
    _.includes(collection, item) ? _.pull(collection, item) : collection.push(item);
  }

  saveProfile() {
    const { $rootScope, UserService } = this;

    const scheduleChangingVoice = this.selectionState.changing_voice !== $rootScope.user.changing_voice;
    UserService.saveUserSettings(this.selectionState)
      .then(() => {
        Object.assign($rootScope.user, this.selectionState);
        this.updateSelectionState();

        if (scheduleChangingVoice) {
          $rootScope.$emit('schedule-changing-voice');
        }

        $rootScope.$emit('reload-playlist');
      })
      .catch(() => {
        throw new Error('Unable to save user settings');
      });
  }
}

export default angular.module('musicId', [])
  .component('musicId', {
    templateUrl: ($element) => {
      'ngInject';
      return $element.injector().get('IS_MRSSPORTY') ?
        'musicId/musicId_mrssporty.tpl.html' :
        'musicId/musicId.tpl.html';
    },
    controllerAs: 'musicId',
    controller: MusicIdController
  });

