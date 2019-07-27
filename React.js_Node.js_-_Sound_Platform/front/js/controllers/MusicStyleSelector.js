export default function($scope, $rootScope, musicIdService, UserService) {
  'ngInject';

  $scope.styles = [
    { value: "charts", label: "Charts"},
    { value: "charts_independent", label: "50% charts 50% indie"},
    { value: "independent", label: "Independent"}
  ];

  $scope.selected = {};

  $scope.selectionChanged = function(i) {
    angular.copy(i, $scope.selected);
    musicIdService.updateMusicStyle($scope.selected.value).then(
      function ok() {
        $rootScope.$emit('reload-playlist');
        updateLocalUser($scope.selected.value);
      }
    )
  };

  $rootScope.$on('user:settings-changed', function() {
    markUserSelections($rootScope.user.music_style, $scope.styles);
  });

  UserService.userReady().then(function (u) {
    markUserSelections(u.music_style, $scope.styles);
  });

  function markUserSelections(userMusicStyle, availableMusicStyles) {
    var found = availableMusicStyles.filter(function(bt) {
      return bt.value === userMusicStyle;
    });
    if(found.length) angular.copy(found[0], $scope.selected);
  }

  function updateLocalUser(newMusicStyle) {
    $rootScope.user.music_style = newMusicStyle;
  }
}
