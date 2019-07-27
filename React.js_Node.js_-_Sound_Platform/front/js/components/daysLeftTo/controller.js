class DaysLeftTo {
  constructor($interval) {
    'ngInject';

    Object.assign(this, {
      $interval
    });
  }

  update() {
    this.days = Math.max(0, Math.abs(window.moment().diff(window.moment(this.daysLeftTo), 'days')));
  }

  $onInit() {
    const { $interval } = this;

    this.update();
    this.interval = $interval(() => this.update(), 1000 * 60 * 60);
  }

  $onDestroy() {
    const { $interval } = this;
    $interval.cancel(this.interval);
  }
}

export default DaysLeftTo;
