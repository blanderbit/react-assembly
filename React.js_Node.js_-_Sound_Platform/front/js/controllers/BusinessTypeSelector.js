export default function($scope, UserService, musicIdService, $rootScope) {
  'ngInject';

  $scope.businessTypes = [
    { value: "wellness_spa", label: "Wellness & Spa" },
    { value: "restaurant", label: "Restaurant" },
    { value: "hotel", label: "Hotel" },
    { value: "cafe", label: "Café" },
    { value: "design_store", label: "Design store" },
    { value: "hair_salon", label: "Hair & Beauty" },
    { value: "fashion_boutique", label: "Fashion & Retail" },
    { value: "bar", label: "Bar" },
    { value: "event", label: "Event" },
    { value: "fintess_studio", label: "Fitness Studio Balance" },
    { value: "fintess_studio_max", label: "Fitness Studio Max" }
  ];

  $scope.selected = {};

  $scope.selectionChanged = function(i) {
    angular.copy(i, $scope.selected);
    musicIdService.updateBusinessType($scope.selected.value).then(
      function ok() {
        $rootScope.$emit('reload-playlist');
        updateLocalUser($scope.selected.value);
      }
    )
  };

  $rootScope.$on('user:settings-changed', function() {
    markUserSelections($rootScope.user.business_type, $scope.businessTypes);
  });

  UserService.userReady().then(function (u) {
    markUserSelections(u.business_type, $scope.businessTypes);
  });

  function markUserSelections(userBusinessType, availableBusinessTypes) {
    var found = availableBusinessTypes.filter(function(bt) {
      return bt.value === userBusinessType;
    });
    if(found.length) angular.copy(found[0], $scope.selected);
  }

  function updateLocalUser(newBusinessType) {
    $rootScope.user.business_type = newBusinessType;
  }
}
