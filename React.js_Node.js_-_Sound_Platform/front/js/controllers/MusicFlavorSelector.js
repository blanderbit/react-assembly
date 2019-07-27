export default function($scope, $rootScope, musicIdService, UserService) {
  'ngInject';

  $scope.flavors = [
    { value: "nyc", label: "Urban Chic / NYC", selected: false},
    { value: "paris", label: "French Bohème / Paris", selected: false},
    { value: "berlin", label: "Modern Minimalist / Berlin", selected: false},
    { value: "stockholm", label: "Scandinavian / Stockholm", selected: false},
    { value: "tropical", label: "Tropical Chic / St. Barths", selected: false},
    { value: "miami", label: "Clubbing / Ibiza", selected: false},
    { value: "new_orleans", label: "Heritage / New Orleans", selected: false },
    { value: "christmas", label: "Christmas Spirit", selected: false }
  ];

  $scope.selectedFlavors = function() {
    return _.get($rootScope.user, 'business_type') === 'fintess_studio_max' ?
      'Clubbing / Ibiza' :
      $scope.flavors.filter(function(g) { return g.selected && !g.inactive; }).map(function(g) { return g.label;}).join(", ");
  };

  $scope.selectionChanged = function() {
    var flavors = $scope.flavors.filter(function selected(g) { return g.selected; }).map(function name(g) { return g.value; });
    musicIdService.updateMusicFlavors(flavors).then(function() {
      $rootScope.$emit('reload-playlist');
      updateLocalUser(flavors);
    });
  };

  $scope.$watch(() => _.get($rootScope, 'user.business_type'), (newVal) => {
    if (newVal) {
      possiblyDisableFlavors();
    }
  });

  UserService.userReady().then(function (u) {
    markUserSelections(u.music_flavors, $scope.flavors);
    $scope.user = $rootScope.user;
    possiblyDisableFlavors();
  });

  $rootScope.$on('user:settings-changed', function() {
    markUserSelections($rootScope.user.music_flavors, $scope.flavors);
    possiblyDisableFlavors();
  });

  function markUserSelections(userFlavors, availableFlavors) {
    availableFlavors.forEach(function markAsSelected(g) {
      g.selected = _.includes(userFlavors, g.value);
    });
  }

  function updateLocalUser(flavors) {
    $rootScope.user.music_flavors.length = 0;
    Array.prototype.push.apply($rootScope.user.music_flavors, flavors);
  }

  function possiblyDisableFlavors() {
    const shouldDisable = $rootScope.user.business_type === 'wellness_spa';

    const flavorsToAffect = [
      'berlin',
      'tropical',
      'miami'
    ];

    flavorsToAffect.forEach((flavorId) => {
      const flavor = _.find($scope.flavors, { value: flavorId });
      if (flavor) {
        flavor.inactive = shouldDisable;
      }
    });
  }
}
