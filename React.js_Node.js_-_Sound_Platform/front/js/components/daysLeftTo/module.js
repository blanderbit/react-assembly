import controller from './controller';

export default angular.module('daysLeftTo', [])
  .component('daysLeft', {
    templateUrl: 'daysLeftTo/daysLeftTo.tpl.html',
    controller,
    controllerAs: 'daysLeftTo',
    bindings: {
      daysLeftTo: '<to'
    }
  });
