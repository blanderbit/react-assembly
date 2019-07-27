class PlaylistController {
  constructor($scope) {
    Object.assign(this, {
      $scope
    });
  }

  $onInit() {
    this.padQueue();
    this.$scope.$watchCollection(() => this.queue, (newVal, oldVal) => {
      if (newVal !== oldVal) this.padQueue();
    });
  }

  generateFakeItems(n) {
    const res = [];
    for (let i = 0; i < n; i++) {
      res.push({
        uniqueId: _.uniqueId(),
        dummy: true
      });
    }
    return res;
  }

  padQueue() {
    const numPreviousItems = this.previous.length;
    const numQueue = this.queue.length;

    const MIN_PART = 7;

    const alignedLength = Math.max(MIN_PART, numQueue - 1, numPreviousItems);
    const leftPart = [...this.generateFakeItems(alignedLength - numPreviousItems), ...this.previous];
    const rightPart = [...this.queue, ...this.generateFakeItems(alignedLength - numQueue + 1)];

    this.paddedQueue = [...leftPart, ...rightPart];
  }
}

export default angular.module('playlist', [])
  .component('playlist', {
    templateUrl: 'playlist/playlist.tpl.html',
    controllerAs: 'playlist',
    bindings: {
      queue: '<',
      previous: '<',
      toggleLike: '&'
    },
    controller: PlaylistController
  });

