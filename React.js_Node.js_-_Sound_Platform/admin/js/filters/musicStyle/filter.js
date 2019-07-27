export default function() {
  var styleMap = {
    charts: 'Charts',
    charts_independent: 'Charts & Independent',
    independent: 'Independent'
  };

  return function(input) {
    return styleMap[input];
  };
};
