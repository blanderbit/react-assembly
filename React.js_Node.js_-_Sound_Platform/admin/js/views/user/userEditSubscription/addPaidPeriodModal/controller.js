
export default class AddPaidPeriodModalController {
  constructor($uibModalInstance, paidPeriod) {
    'ngInject';
    Object.assign(this, {
      $uibModalInstance,
      paidPeriod
    });
  }
  toggleDatePicker(type) {
    this[`${type}DatePickerOpened`] = !this[`${type}DatePickerOpened`];
  }

  submit() {
    this.$uibModalInstance.close({
      paidPeriod: this.paidPeriod,
      createChargebee: this.createChargebee
    });
  }

  cancel() {
    this.$uibModalInstance.dismiss();
  }
}
