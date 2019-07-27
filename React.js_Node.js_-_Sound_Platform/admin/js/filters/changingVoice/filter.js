export default (CHANGING_VOICES) => {
  'ngInject';
  return (input) => _.get(_.find(CHANGING_VOICES, { value: input }), 'label', 'N/A');
};
