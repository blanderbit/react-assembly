export default function() {
  return function(input) {
    return (input || [])
      .map(function(group) {
        return group.replace('<', 'Under ');
      })
      .join(', ');
  };
};
