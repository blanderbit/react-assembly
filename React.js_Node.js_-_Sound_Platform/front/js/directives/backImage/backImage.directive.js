export default () => ({
  restrict: 'A',
  link: function(scope, element, attrs) {
    scope.$watch(attrs.backImg, function(value) {
      var url = scope.$eval(attrs.backImg);
      if (url){
        var imgBackground = 'url("' + encodeURI(url) + '")';
        element.css('background-image', imgBackground);
      }
    });
  }
});
