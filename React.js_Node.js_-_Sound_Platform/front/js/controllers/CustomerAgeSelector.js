export default function($scope, $rootScope, musicIdService, UserService, IS_MRSSPORTY) {
  'ngInject';

  $scope.ranges = [
    { value: "<20", label: "Under 20", selected: false},
    { value: "<30", label: "Under 30", selected: false},
    { value: "<50", label: "Under 50", selected: false}
  ];

  if (IS_MRSSPORTY) {
    $scope.ranges.push({ value: "<70", label: "Under 70", selected: false});
  }

  $scope.selectedRanges = function() {
    return $scope.ranges.filter(function(g) { return g.selected; }).map(function(g) { return g.label;}).join(", ");
  };

  $scope.selectionChanged = function() {
    var ranges = $scope.ranges.filter(function selected(g) { return g.selected; }).map(function name(g) { return g.value; });
    musicIdService.updateCustomerAges(ranges).then(function() {
      updateLocalUser(ranges);
      $rootScope.$emit('reload-playlist');
    });
  };


  UserService.userReady().then(function (u) {
    u.customer_age = u.customer_age || [];
    markUserSelections(u.customer_age, $scope.ranges);
  });

  $rootScope.$on('user:settings-changed', function() {
    markUserSelections($rootScope.user.customer_age, $scope.ranges);
  });

  function markUserSelections(userRanges, availableRanges) {
    availableRanges.forEach(function markAsSelected(g) {
      g.selected = _.includes(userRanges, g.value);
    });
  }

  function updateLocalUser(ranges) {
    $rootScope.user.customer_age.length = 0;
    Array.prototype.push.apply($rootScope.user.customer_age, ranges);
  }
}
