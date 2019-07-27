export default angular.module('DateService', [])
  .factory('dateService', function() {
    return {
      now: function () {
        return new Date();
      },
      nowAsDateTimeString: function (date) {
        return moment(date || this.now()).format("DD-MM-YYYY HH:mm");
      }
    };
  });
