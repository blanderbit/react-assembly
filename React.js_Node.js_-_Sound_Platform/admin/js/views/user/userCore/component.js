import controller from './controller';

export default {
  restrict: 'E',
  controller,
  controllerAs: 'userCoreCtrl',
  templateUrl: 'views/user/userCore/template.html',
  bindings: {
    user: '<'
  }
};
