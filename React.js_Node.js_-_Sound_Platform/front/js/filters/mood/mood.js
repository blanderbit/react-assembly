export default angular.module('moodFilter', [])
  .filter('mood', () => (
    (input) => {
      if (input > 0) {
        return '+' + input;
      } else if (input < 0) {
        return '' + input;
      } else {
        return 'auto';
      }
    }
  ));
