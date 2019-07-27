class MoodControlsController {
  constructor($rootScope) {
    'ngInject';

    Object.assign(this, {
      $rootScope
    });

    this.MOOD_LOW = -3;
    this.MOOD_HIGH = 3;
    this.current = parseInt(this.initial || 0, 10);
  }

  isDisabled() {
    return _.get(this.$rootScope, 'user.business_type') === 'fintess_studio_max';
  }

  updateBy(delta) {
    if (this.MOOD_LOW < this.current < this.MOOD_HIGH) {
      this.current = this.current + delta;
      this.onChange({ mood: this.current });
    }
    return this.current;
  }
}

export default angular.module('moodControls', [])
  .component('moodControls', {
    bindings: {
      initial: '<',
      onChange: '&'
    },
    templateUrl: 'moodControls/moodControls.tpl.html',
    controllerAs: 'moodControls',
    controller: MoodControlsController
  });
