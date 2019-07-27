import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('userEditSubscription', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('user.editSubscription', {
      url: '/edit-subscription',
      component: 'userEditSubscription'
    });
  })
  .component('userEditSubscription', component);
