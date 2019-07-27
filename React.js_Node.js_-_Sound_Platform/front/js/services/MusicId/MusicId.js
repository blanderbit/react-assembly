export default angular.module('musicIdService', [])
  .service('musicIdService', function($http, $q) {
    'ngInject';

    function updateBusinessType(newType) {
      return $http.put('/api/business_type', { businessType: newType }).catch(errorHandler('Could not update business type'));
    }

    function updateMusicFlavors(newFlavors) {
      return $http.put('/api/music_flavors', { musicFlavors: newFlavors }).catch(errorHandler('Could not update music flavors'));
    }

    function updateCustomerAges(newAges) {
      return $http.put('/api/customer_age', { customerAge: newAges }).catch(errorHandler('Could not update customer ages'));
    }

    function updateMusicStyle(newStyle) {
      return $http.put('/api/music_style', { musicStyle: newStyle }).catch(errorHandler('Could not update music style'));
    }

    function errorHandler(msg) {
      return function(response) {
        console.error(msg, response.status);
        $q.reject(new Error(msg));
      }
    }

    return {
      updateBusinessType,
      updateMusicFlavors,
      updateCustomerAges,
      updateMusicStyle
    };
  });
