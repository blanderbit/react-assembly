import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('userEdit', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('user.edit', {
      url: '/edit',
      component: 'userEdit'
    });
  })
  .component('userEdit', component);
