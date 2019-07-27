import controller from './controller';

export default {
  restrict: 'E',
  controller,
  controllerAs: 'userCtrl',
  templateUrl: 'views/user/template.html',
  bindings: {
    user: '<'
  }
};
