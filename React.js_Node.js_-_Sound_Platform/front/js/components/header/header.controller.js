export default class HeaderController {
  constructor(UserService, $uibModal, $timeout, HIDE_TRIAL_DROPDOWN_DELAY, $rootScope,
    HIDE_PP_DROPDOWN_DELAY, ELECTRON_ENV) {
    'ngInject';

    Object.assign(this, {
      UserService,
      $uibModal,
      $timeout,
      HIDE_TRIAL_DROPDOWN_DELAY,
      HIDE_PP_DROPDOWN_DELAY,
      ELECTRON_ENV,
      $rootScope
    });
  }

  $onInit() {
    const { $timeout, HIDE_TRIAL_DROPDOWN_DELAY, UserService, HIDE_PP_DROPDOWN_DELAY } = this;

    UserService.userReadyDfd.promise
      .then((user) => {
        if (user.anonymous) {
          this.anonDropDownShown = true;
        } else if (user.isOnTrial) {
          this.trialDropDownShown = true;

          $timeout(() => {
            this.trialDropDownShown = false;
          }, HIDE_TRIAL_DROPDOWN_DELAY);
        } else if (user.activePaidPeriod &&
          window.moment(user.activePaidPeriod.end).diff(new Date(), 'days') < 31 &&
          !_.get(user, 'lastSubscription.pending')) {
          this.paidPeriodDropDownShown = true;

          $timeout(() => {
            this.paidPeriodDropDownShown = false;
          }, HIDE_PP_DROPDOWN_DELAY);
        }
      });
  }

  logout() {
    const { UserService } = this;

    UserService.logout();
    window.location = '/login';
  }

  changePassword() {
    const { $uibModal } = this;

    $uibModal.open({
      templateUrl: 'changePasswordModal.tpl.html',
      controller: 'ChangePasswordModalCtrl',
      size: 'sm',
      backdrop: 'static'
    });
  }

  clickSubscribe() {
    const { $rootScope } = this;

    this.trialDropDownShown = false;
    $rootScope.$emit('show-subscription-form');
  }
}
