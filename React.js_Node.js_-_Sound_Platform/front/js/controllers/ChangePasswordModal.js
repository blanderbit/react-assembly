export default function($scope, $uibModalInstance, UserService, $timeout) {
  'ngInject';

  $scope.alerts = [];

  $scope.submitted = false;
  $scope.loading = false;

  $scope.data = {
    password: '',
    password_confirmation: '',
    old_password: ''
  };

  $scope.noMatch = function() {
    console.log($scope.data.password, $scope.data.password_confirmation)
    return $scope.data.password !== $scope.data.password_confirmation;
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.submit = function() {
    if ($scope.submitted) return false;
    $scope.submitted = true;
    $scope.loading = true;
    $scope.alerts.splice(0);
    UserService.setPassword($scope.data.old_password, $scope.data.password)
      .then(function() {
        $scope.alerts.push({
          type: 'success',
          msg: 'Password has been changed'
        });
      },
      function(resp) {
        $scope.submitted = false;
        var msg = _.get(resp, 'data.error', 'Unexpected error occured. Please try again later.');
        $scope.alerts.push({
          type: 'danger',
          msg: msg
        });
      })
      .finally(function() {
        $scope.loading = false;
      });
  };
}
