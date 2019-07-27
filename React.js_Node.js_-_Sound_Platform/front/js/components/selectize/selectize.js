export default angular.module('selectize', [])
  .directive('selectize', function() {

    function selectize(el, scope) {

      var cont = $(el);
      var sel = $('.js-selectize-current', cont);
      var opts = $('.js-selectize-options', cont);

      sel.on('click', function() {
        if (!scope.ngDisabled && !opts.hasClass('visible')) {
          opts.addClass('visible');
        } else {
          opts.removeClass('visible');
        }
        $('.js-selectize-options').not(opts).removeClass('visible');
      });

      cont.on('click', function(e) {
        e.stopPropagation();
      });

      opts.on('click', function(e) {
        if (scope.closeOnClick) opts.removeClass('visible');
      });

      $('html').on('click', function() {
        $('.js-selectize-options').removeClass('visible');
      });
    }

    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: 'selectize/selectize.tpl.html',
      scope: {
        onIconClick: '&',
        selected: '=',
        defaultLabel: '@',
        iconClass: '@',
        direction: '@',
        tooltipText: '@',
        ngDisabled: '<',
        closeOnClick: '<'
      },
      link: function(scope, el) {
        selectize(el, scope);
      }
    }

  });
