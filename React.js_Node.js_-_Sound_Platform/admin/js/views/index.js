import bpm from './bpm/module';
import tracks from './tracks/module';
import tracksStats from './tracksStats/module';
import user from './user/module';
import userNew from './userNew/module';
import users from './users/module';
import searchAlgorithm from './searchAlgorithm/module';

export default angular.module('views', [
  bpm.name,
  tracks.name,
  tracksStats.name,
  user.name,
  userNew.name,
  users.name,
  searchAlgorithm.name
]);
