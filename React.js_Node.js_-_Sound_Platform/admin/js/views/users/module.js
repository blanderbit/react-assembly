import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('users', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('users', {
      url: '/users',
      component: 'users'
    });
  })
  .component('users', component);
