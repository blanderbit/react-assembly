class WorkoutTypeSelectorController {
  constructor($scope, $rootScope, musicIdService, UserService) {
    'ngInject';

    Object.assign(this, {
      $scope,
      $rootScope,
      musicIdService,
      UserService
    });
  }

  $onInit() {
    const { UserService, $rootScope } = this;

    UserService.userReady()
      .then((u) => {
        if (u.workout_type) {
          this.markUserSelections(u.workout_type);
        }
      });

    $rootScope.$on('user:settings-changed', () => {
      if ($rootScope.user.workout_type) {
        this.markUserSelections($rootScope.user.workout_type);
      }
    });
  }

  selectedTypes() {
    return this.selected ? this.selected.label : null;
  }

  updateLocalUser(value) {
    const { $rootScope } = this;

    $rootScope.user.workout_type = value;
  }

  markUserSelections(selection) {
    this.selected = _.find(this.types, { value: selection });
  }
}
export default WorkoutTypeSelectorController;
