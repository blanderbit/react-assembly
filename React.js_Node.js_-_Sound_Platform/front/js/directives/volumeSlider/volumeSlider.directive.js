export default function($compile, $window) {
  'ngInject';
	/**
 * @ngdoc directive
 * @name materialSlider
 * @module material.components.slider
 * @restrict E
 *
 * @description
 * Slider directive!
 *
 */

  var MIN_VALUE_CSS = 'material-slider-min';
  var ACTIVE_CSS = 'material-active';

  function rangeSettings(rangeEle) {
    return {
      min: parseInt( rangeEle.min !== "" ? rangeEle.min : 0, 10 ),
      max: parseInt( rangeEle.max !== "" ? rangeEle.max : 100, 10 ),
      step: parseInt( rangeEle.step !== "" ? rangeEle.step : 1, 10 )
    };
  }

  

  // **********************************************************
  // Private Methods
  // **********************************************************

  function link(scope, element, attr) {
    var input = element.find('input');
    var icon = element.find('i');

    var ngModelCtrl = angular.element(input).controller('ngModel');
    if(!ngModelCtrl || input[0].type !== 'range') return;

    var rangeEle = input[0];
    var trackEle = angular.element( element[0].querySelector('.material-track') );

    trackEle.append('<div class="material-fill"><div class="material-thumb"></div></div>');
    var fillEle = trackEle[0].querySelector('.material-fill');

    // if(input.attr('step')) {
    //   var settings = rangeSettings(rangeEle);
    //   var tickCount = (settings.max - settings.min) / settings.step;
    //   var tickMarkersEle = angular.element('<div class="material-tick-markers material-display-flex"></div>');
    //   // for(var i=0; i<tickCount; i++) {
    //   //   tickMarkersEle.append('<div class="material-tick material-flex"></div>');
    //   // }
    //   trackEle.append(tickMarkersEle);
    // }

    input.on('mousedown touchstart', function(e){
      trackEle.addClass(ACTIVE_CSS);
    });

    input.on('mouseup touchend', function(e){
      trackEle.removeClass(ACTIVE_CSS);
    });

    var timeout;
    icon
      .on('mouseover', function() {
        trackEle.show();
      })
      .on('mouseout', function() {
        timeout = setTimeout(function() {
          trackEle.hide();
        }, 100);
      });

    trackEle
      .on('mouseover', function() {
        clearTimeout(timeout);
        trackEle.show();
      })
      .on('mouseout', function() {
        trackEle.hide();
      });

    function render() {
      var settings = rangeSettings(rangeEle);
      var adjustedValue = parseInt(ngModelCtrl.$viewValue, 10) - settings.min;
      var fillRatio = (adjustedValue / (settings.max - settings.min));
	    // scope.level = parseInt(ngModelCtrl.$viewValue, 10);
      fillEle.style.width = (fillRatio * 100) + '%';

      if(fillRatio <= 0) {
        element.addClass(MIN_VALUE_CSS);
      } else {
        element.removeClass(MIN_VALUE_CSS);
      }

    }

    scope.$watch( function () { return ngModelCtrl.$viewValue; }, render );
  }
  return {
    restrict: 'A',
    scope: true,
    transclude: true,
    template: '<div class="material-track" ng-transclude></div><i class="icon-speaker"></i>',
    link
  };
}
