export default function() {
  return function(input) {
    return moment(input).fromNow();
  };
};
