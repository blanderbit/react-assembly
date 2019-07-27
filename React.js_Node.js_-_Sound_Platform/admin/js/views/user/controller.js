class UserController {
  constructor($state) {
    'ngInject';
    if ($state.current.name === 'user') {
      $state.go('.core');
    }
  }
}

UserController.resolve = {
  user: (User, $stateParams) => {
    'ngInject';
    return User.get({ userId: $stateParams.userId }).$promise;
  }
};

export default UserController;
