import controller from './controller';

export default {
  restrict: 'E',
  controller,
  controllerAs: 'userEditSubscriptionCtrl',
  templateUrl: 'views/user/userEditSubscription/template.html',
  bindings: {
    user: '<'
  }
};
