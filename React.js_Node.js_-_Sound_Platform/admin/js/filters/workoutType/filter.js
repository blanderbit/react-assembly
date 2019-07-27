export default (WORKOUT_TYPES) => {
  'ngInject';
  return (input) => _.find(WORKOUT_TYPES, { value: input }, { label: 'N/A' }).label;
};
