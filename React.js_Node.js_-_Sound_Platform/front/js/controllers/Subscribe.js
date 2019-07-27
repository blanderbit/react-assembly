export default function ($scope, api, UserService) {
  'ngInject';

  UserService.getLastSubcription()
    .then((lastSubscr) => {
      if (lastSubscr) {
        $scope.data = $scope.data || {};
        Object.assign($scope.data, lastSubscr);
      }
    });

  UserService.user();
  UserService.userReadyDfd.promise
    .then((user) => {
      if (user.company_name) {
        $scope.data = $scope.data || {};
        $scope.data.company = user.company_name;
      }
    });

  $scope.ok = function(e) {
    e.preventDefault();
    $scope.success = null;
    $scope.error = null;

    api.subscribe($scope.data)
      .then(
        function(data) {
          $scope.success = data;
          $scope.data = null;
          $scope.form.$setPristine();
          let target;
          if (window.location.search) {
            const redirectRe = /^\?requested=(.+)$/;
            const match = window.location.search.match(redirectRe);
            if (match && match[1]) {
              target = decodeURIComponent(match[1]);
            }
          }
          if (target) {
            setTimeout(() => {
              document.location = target;
            }, 3000);
          }
        },
        function (resp) {
          $scope.error = _.isString(resp.data) ? resp.data :
            'Something went wrong. Please try again later.' ;
        }
      );
  };
}
