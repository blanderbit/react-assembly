class BpmService {
  constructor($resource) {
    'ngInject';

    Object.assign(this, {
      $resource
    });
  }

  table() {
    const { $resource } = this;

    return $resource('/admin/api/bpm_table/:business_type', {
      business_type: '@business_type'
    });
  }
}

export default BpmService;
