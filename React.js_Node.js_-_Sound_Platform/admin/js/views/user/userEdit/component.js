import controller from './controller';

export default {
  restrict: 'E',
  controller,
  controllerAs: 'userEditCtrl',
  templateUrl: 'views/user/userEdit/template.html',
  bindings: {
    user: '<'
  }
};
