export default function subscribeOverlayController($scope, $rootScope, api, $timeout, UserService, IS_MRSSPORTY) {
  'ngInject';

  Object.assign(this, {
    success: '',
    error: '',
    isShown: false,
    data: {}
  });

  Object.assign(this, {
    $scope,
    api,
    $rootScope,
    $timeout,
    UserService,
    IS_MRSSPORTY
  });

  var ctrl = this;

  $rootScope.$on('unable-to-play', function() {
    ctrl.show();
    $rootScope.$emit('player-stop');
  });

  $rootScope.$on('show-subscription-form', () => {
    ctrl.suggestionMode = true;
    ctrl.show();
  });

  this.price = IS_MRSSPORTY ? 25 : 29;
}

subscribeOverlayController.prototype.show = function() {
  this.isShown = true;
  this.data.company = _.get(this.$rootScope, 'user.company_name');
  this.UserService.getLastSubcription()
    .then((lastSubscr) => {
      if (lastSubscr) {
        Object.assign(this.data, lastSubscr);
      }
    });
};

subscribeOverlayController.prototype.submit = function(e) {
  var ctrl = this;

  e.preventDefault();
  this.success = null;
  this.error = null;

  this.api.subscribe(this.data)
    .then(
      function(data) {
        ctrl.success = data;
        ctrl.data = null;
        ctrl.form.$setPristine();

        if (!ctrl.suggestionMode) {
          ctrl.$rootScope.$emit('subscription-sent');
        }

        ctrl.UserService.reloadUser();

        ctrl.$timeout(function() {
          Object.assign(ctrl, {
            success: '',
            error: '',
            isShown: false
          });
        }, 2000);
      },
      function (resp) {
        if (resp.status === 404) {
          location.reload(true);
        }
        ctrl.error = _.isString(resp.data) ? resp.data :
          'Something went wrong. Please try again later.';
      }
    );
};
