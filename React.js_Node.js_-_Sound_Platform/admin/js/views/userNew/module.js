import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('userNew', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('userNew', {
      url: '/new-user',
      component: 'userNew'
    });
  })
  .component('userNew', component);
