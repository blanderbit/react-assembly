export default angular.module('anonymousSessionLimitInterceptor', [])
  .factory('anonymousSessionLimitInterceptor', function($q, $location, $window) {
    'ngInject';
    return {
      responseError: function(response) {
        if(response.status !== 499) return $q.reject(response);
        console.log('Anonymous session expired, going to register');
        $window.location = '/register';
      }
    };
  });
