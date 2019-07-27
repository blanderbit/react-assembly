import trackEditModal from './trackEditModal/module';
import trackDeleteModal from './trackDeleteModal/module';
import confirmationModal from './confirmationModal/module';

export default angular.module('components', [
  trackDeleteModal.name,
  trackEditModal.name,
  confirmationModal.name
]);
