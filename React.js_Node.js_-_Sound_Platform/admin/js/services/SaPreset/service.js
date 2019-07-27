class SaPreset {
  constructor($resource) {
    'ngInject';

    return $resource('/admin/api/sa-presets/current', {});
  }
}

export default SaPreset;
