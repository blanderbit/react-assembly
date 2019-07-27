export default function bpmController(BpmService, $window) {
  'ngInject';

  var ctrl = this;

  this.bpmTables = [];

  this.saveTable = function(table) {
    table.$save(function() {
      activate();
    });
  };

  this.reset = function(table) {
    $window.alert('Not yet implemented');
  };

  this.TIME_SLOTS = [
    '22:00 - 24:00',
    '00:00 - 06:00',
    '06:00 - 09:00',
    '09:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 17:00',
    '17:00 - 20:00',
    '20:00 - 22:00'
  ];

  activate();

  function activate() {
    ctrl.bpmTables = BpmService.table().query();
  }
}
