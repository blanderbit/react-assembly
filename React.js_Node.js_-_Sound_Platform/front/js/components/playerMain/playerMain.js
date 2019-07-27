import controller from './playerMain.controller';

export default angular.module('playerMain', [])
  .component('playerMain', {
    templateUrl: 'playerMain/playerMain.tpl.html',
    controllerAs: 'playerMain',
    controller
  });
