import controller from './header.controller';

export default angular.module('headerComponent', [])
  .component('headerComponent', {
    templateUrl: 'header/header.tpl.html',
    controllerAs: 'headerComponent',
    controller
  })
  .constant('HIDE_TRIAL_DROPDOWN_DELAY', 5000)
  .constant('HIDE_PP_DROPDOWN_DELAY', 10000);
