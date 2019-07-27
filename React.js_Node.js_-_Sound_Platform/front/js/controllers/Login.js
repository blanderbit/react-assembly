export default function ($scope, api) {
  'ngInject';

  $scope.user = {};
  $scope.ok = function (user) {
    $scope.hideServerMessages = true;
    api.login(user)
      .then(function () {
        let target = '/play';
        if (window.location.search) {
          const redirectRe = /^\?requested=(.+)$/;
          const match = window.location.search.match(redirectRe);
          if(match && match[1]) {
            target = decodeURIComponent(match[1]);
          }
        }
        document.location = target;
      })
      .catch(function (resp) {
        $scope.form.$setPristine();
        $scope.user.password = '';
        $scope.error = (resp.data == 'Unauthorized') ? "Login incorrect" : resp.data.message.text;
      });
  };
}
