import controller from './countdown.controller';

export default angular.module('countdown', [])
  .component('countdown', {
    templateUrl: 'countdown/countdown.tpl.html',
    controllerAs: 'countdown',
    bindings: {
      to: '<'
    },
    controller
  });
