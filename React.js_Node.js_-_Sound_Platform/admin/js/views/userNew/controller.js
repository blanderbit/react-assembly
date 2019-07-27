export default function UserNewController($state, User) {
  'ngInject';

  this.User = User;

  this.$state = $state;

  this.paidPeriod = {};

  _.assign(this, {
    startDatePickerOpened: false,
    endDatePickerOpened: false,
    hasPaidPeriod: false
  });

  this.user = new User({
    email: '',
    password: '',
    verified: false,
    trial_end: moment().add(1, 'month').endOf('day').toDate()
  });
}

UserNewController.prototype = {
  create: function() {
    this.error = null;

    var ctrl = this;

    if (this.hasPaidPeriod) {
      _.assign(this.user, { paid_periods: [{
        start: this.paidPeriod.start,
        end: moment(this.paidPeriod.end).endOf('day')
      }] });
    }

    this.user.$save()
      .then(function(data) {
        ctrl.$state.go('user', { userId: data._id });
      }, function(resp) {
        ctrl.error = _.get(resp, 'data.error', 'An error occurred');
      });
  },

  toggleDatePicker: function(type) {
    var key = type + 'DatePickerOpened';
    this[key] = !this[key];
  }
};
