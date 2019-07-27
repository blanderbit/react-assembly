import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('bpm', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('bpm', {
      url: '/bpm',
      component: 'bpm'
    });
  })
  .component('bpm', component);
