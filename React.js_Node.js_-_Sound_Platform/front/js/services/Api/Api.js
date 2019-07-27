export default angular.module('api', [])
  .factory('api', ($http, dateService, UserService) => {
    'ngInject';

    return {
      next: function (params) {
        params = params || {};

        _.defaults(params, {
          now: dateService.nowAsDateTimeString()
        });

        return $http.get('/api/next', { params })
          .then((res) => res.data);
      },
      mood: function (mood) {
        return $http.post('/api/mood', {mood: mood});
      },
      register: function (user) {
        return UserService.register(user);
      },
      subscribe: function(data) {
        return $http.post('/api/user/subscribe', {data: data})
          .then(function(resp) {
            return resp.data;
          });
      },
      login: function (user) {
        return UserService.login(user);
      },
      like: function(song) {
        return $http.post('/api/like', {songId: song._id});
      },
      unlike: function(song) {
        return $http.post('/api/unlike', {songId: song._id});
      },
      markAsPlayed: function(song) {
        return $http.post('/api/last_played', {songId: song._id});
      }
    };
  });
