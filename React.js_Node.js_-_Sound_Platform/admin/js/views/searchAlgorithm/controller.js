class SearchAlgorithmController {
  constructor(SaPresetService) {
    'ngInject';

    Object.assign(this, {
      SaPresetService
    });
  }

  $onInit() {
    const { SaPresetService } = this;

    this.preset = SaPresetService.get();
  }

  save() {
    this.error = null;

    this.preset.$save()
      .then(() => {
        this.form.$setPristine();
      })
      .catch((resp) => {
        this.error = resp.data && resp.data.error ? resp.data.error : resp.statusText;
      });
  }
}

export default SearchAlgorithmController;
