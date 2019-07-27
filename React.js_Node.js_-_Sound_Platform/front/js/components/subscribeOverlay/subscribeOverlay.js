import controller from './subscribeOverlay.controller';

export default angular.module('subscribeOverlay', [])
  .component('subscribeOverlay', {
    templateUrl: 'subscribeOverlay/subscribeOverlay.tpl.html',
    controller,
    controllerAs: 'subscribeOverlay'
  });
