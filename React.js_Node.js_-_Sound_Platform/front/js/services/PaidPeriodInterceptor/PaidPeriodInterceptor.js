export default angular.module('paidPeriodInterceptor', [])
  .factory('paidPeriodInterceptor', ($q, $rootScope) => {
    'ngInject';
    return {
      responseError: function paidPeriodInterceptorResp(response) {
        if (response.status === 498) $rootScope.$emit('unable-to-play');
        return $q.reject(response);
      }
    };
  });
