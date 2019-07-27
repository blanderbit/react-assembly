import uiRouter from '@uirouter/angularjs';
import component from './component';

export default angular
  .module('searchAlgorithm', [
    uiRouter
  ])
  .config(($stateProvider) => {
    $stateProvider.state('searchAlgorithm', {
      url: '/search-algorithm',
      component: 'searchAlgorithm'
    });
  })
  .component('searchAlgorithm', component);
