export default function TracksStatsController(PlayEvent) {
  'ngInject';
  this.PlayEvent = PlayEvent;
  this.init();
}

TracksStatsController.prototype.init = function() {
  var defaultParams = {
    request: {
      startDate: moment().startOf('day').toDate(),
      endDate: moment().endOf('day').toDate(),
      client: {
        stream: true,
        web: true,
        sonos: true
      },
      sortKey: 'num',
      sortDirection: -1
    },
    startDatePickerOpened: false,
    endDatePickerOpened: false,
    isLoading: false,

    events: []
  };
  _.merge(this, defaultParams);
};

TracksStatsController.prototype.toggleDatePicker = function(type) {
  var key = type + 'DatePickerOpened';
  this[key] = !this[key];
};

TracksStatsController.prototype.getQueryParams = function() {
  var self = this;
  return _.assign(
    {
      startDate: moment(this.request.startDate).format(),
      endDate: moment(this.request.endDate).format(),
      client: _.keys(this.request.client).filter(function(k) {
        return !!self.request.client[k];
      })
    },
    _.pick(this.request, 'sortKey', 'sortDirection')
  );
};

TracksStatsController.prototype.show = function() {
  var ctrl = this;
  ctrl.isLoading = true;
  this.PlayEvent.query(this.getQueryParams(), function(_events) {
    ctrl.isLoading = false;
    ctrl.events = _events;
  }, function() {
    ctrl.events = [];
    ctrl.isLoading = false;
  });
};

TracksStatsController.prototype.toggleSort = function(key) {
  if (this.request.sortKey === key) {
    this.request.sortDirection = -this.request.sortDirection;
    return;
  }
  this.request.sortKey = key;
};

TracksStatsController.prototype.downloadLink = function(format) {
  return '/admin/api/play_events/' + format + '?' + queryString.stringify(this.getQueryParams());
};
