import uiRouter from '@uirouter/angularjs';

import components from './components/components';
import filters from './filters/filters';
import resources from './resources/resources';
import services from './services/services';
import views from './views/index';

import '../templates/templates';

angular
  .module('admin', [
    'xeditable',
    'ngResource',
    uiRouter,
    'ui.bootstrap',
    'templates',
    'infinite-scroll',
    'ngMessages',

    components.name,
    filters.name,
    resources.name,
    services.name,
    views.name
  ])

  .run((editableOptions) => {
    editableOptions.theme = 'bs3';
  })

  .config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/tracks-stats');
  })

  .constant('WORKOUT_TYPES', [
    { value: 'fitness_chillout', label: 'Fitness Chill-out (100 bpm)' },
    { value: 'fitness_balance', label: 'Fitness Balance (120 bpm)' },
    { value: 'fitness_max', label: 'Fitness Max (130 bpm)' }
  ])

  .constant('CHANGING_VOICES', [
    { value: null, label: 'None' },
    { value: 'german', label: 'In German language' },
    { value: 'italian', label: 'In Italian language' },
    { value: 'polish', label: 'In Polish language' },
    { value: 'dutch', label: 'In Dutch language' }
  ]);
