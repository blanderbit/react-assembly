import controller from './controller';

export default angular.module('confirmationModal', [])
  .component('confirmationModal', {
    templateUrl: 'components/confirmationModal/confirmationModal.template.html',
    controllerAs: 'confirmationModal',
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    controller
  });
