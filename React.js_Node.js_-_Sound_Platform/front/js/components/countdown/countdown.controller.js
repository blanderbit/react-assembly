export default class HeaderController {
  constructor($interval) {
    'ngInject';

    Object.assign(this, {
      $interval
    });
  }

  $onInit() {
    const { $interval } = this;
    this.interval = $interval(() => {
      this.update();
    }, 500);

    this.update();
  }

  $onDestroy() {
    const { $interval } = this;
    $interval.cancel(this.interval);
  }

  update() {
    const now = new Date();
    const minutesLeft = Math.max(0, window.moment(this.to).diff(now, 'minutes'));
    this.minutesLeft = minutesLeft.toString();
    if (this.minutesLeft.length < 2) this.minutesLeft = `0${this.minutesLeft}`;
    this.secondsLeft = Math.max(0, window.moment(this.to).diff(now, 'seconds') -
      (this.minutesLeft * 60));
  }
}
