export default angular.module('pwCheck', [])
  .directive('pwCheck', function() {
    return {
      require: 'ngModel',
      scope: {
        otherValue: '='
      },
      link: function(scope, elem, attrs, ctrl) {
        ctrl.$parsers.push(function(newVal) {
          ctrl.$setValidity('pwCheck', !newVal && !scope.otherValue || newVal === scope.otherValue);
          return newVal;
        });

        scope.$watch('otherValue', function() {
          var value = ctrl.$modelValue;
          ctrl.$setValidity('pwCheck', value && !scope.otherValue || value === scope.otherValue);
        });
      }
    };
  });
