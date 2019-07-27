export default angular.module('mapFilter', [])
  .filter('map', () => (
    (input, map) => (
      _.isArray(input) ?
        _(map).filter((el) => _.includes(input, el.value)).map('label').join(', ') :
        _.get(_.find(map, { value: input }), 'label', input)
    )
  ));
