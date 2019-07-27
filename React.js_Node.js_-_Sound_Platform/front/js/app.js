import components from './components/components';
import controllers from './controllers/controllers';
import directives from './directives/directives';
import filters from './filters/filters';
import services from './services/services';

export default angular.module('app', [
  'ngAnimate',
  'ui.bootstrap',
  'templates',
  'ngMessages',
  components.name,
  controllers.name,
  directives.name,
  filters.name,
  services.name
])

.config(function($httpProvider) {
  'ngInject';

  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  $httpProvider.interceptors.push('anonymousSessionLimitInterceptor');
  $httpProvider.interceptors.push('paidPeriodInterceptor');
})

.config(function() {
  if (window.later) {
    window.later.date.localTime();
  }
})

.constant('IS_MRSSPORTY', window.PLAYER_MODE === 'Mrssporty' || window.PLAYER_MODE === 'Fitbox')
.constant('IS_FITBOX', window.PLAYER_MODE === 'Fitbox')
.constant('ELECTRON_ENV', window.ELECTRON_ENV === true)
.constant('MOBILE', !!window.MOBILE)

.run(($rootScope) => {
  'ngInject';
  $rootScope.inArray = _.includes;
});
