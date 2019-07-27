import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('tracks', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('tracks', {
      url: '/tracks',
      component: 'tracks'
    });
  })
  .component('tracks', component);
