import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('userCore', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('user.core', {
      url: '/core',
      component: 'userCore'
    });
  })
  .component('userCore', component);
