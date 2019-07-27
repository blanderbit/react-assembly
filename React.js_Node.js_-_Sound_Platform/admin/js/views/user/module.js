import uiRouter from '@uirouter/angularjs';
import component from './component';
import controller from './controller';

import userCore from './userCore/module';
import userEdit from './userEdit/module';
import userEditSubscription from './userEditSubscription/module';

export default angular
  .module('user', [
    uiRouter,
    userCore.name,
    userEdit.name,
    userEditSubscription.name
  ])
  .config(($stateProvider) => {
    $stateProvider.state('user', {
      url: '/user/{userId:[0-9a-fA-F]{24}}',
      component: 'user',
      resolve: controller.resolve
    });
  })
  .component('user', component);
