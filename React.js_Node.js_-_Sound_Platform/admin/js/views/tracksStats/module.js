import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('tracksStats', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('tracksStats', {
      url: '/tracks-stats',
      component: 'tracksStats'
    });
  })
  .component('tracksStats', component);
