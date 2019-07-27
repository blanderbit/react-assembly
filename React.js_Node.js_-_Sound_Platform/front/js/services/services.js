import AnonInterceptor from './AnonInterceptor/AnonInterceptor';
import Api from './Api/Api';
import DateService from './DateService/DateService';
import MusicId from './MusicId/MusicId';
import PaidPeriodInterceptor from './PaidPeriodInterceptor/PaidPeriodInterceptor';
import UserService from './UserService';

export default angular.module('app.services', [
  AnonInterceptor.name,
  Api.name,
  DateService.name,
  MusicId.name,
  PaidPeriodInterceptor.name
])
.service('UserService', UserService);
