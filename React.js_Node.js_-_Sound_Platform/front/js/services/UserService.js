export default class UserService {
  constructor($rootScope, $q, $http, $interval, IS_MRSSPORTY) {
    'ngInject';

    this.authData = {};
    this.userReadyDfd = $q.defer();

    Object.assign(this, {
      $rootScope,
      $q,
      $http,
      $interval
    });

    Object.assign(this, {
      WORKOUT_TYPES: [
        { value: 'fitness_chillout', label: 'Fitness Chill-out (100 bpm)' },
        { value: 'fitness_balance', label: 'Fitness Balance (120 bpm)' },
        { value: 'fitness_max', label: 'Fitness Max (130 bpm)' }
      ],

      CHANGING_VOICES: [
        { value: null, label: 'None' },
        { value: 'german', label: 'In German language' },
        { value: 'italian', label: 'In Italian language' },
        { value: 'polish', label: 'In Polish language' },
        { value: 'dutch', label: 'In Dutch language' }
      ],

      CUSTOMER_AGES: [
        { value: '<20', label: 'Under 20' },
        { value: '<30', label: 'Under 30' },
        { value: '<50', label: 'Under 50' },
        ...IS_MRSSPORTY ? [{ value: '<70', label: 'Under 70' }] : []
      ]
    });
  }

  user() {
    if(this.$rootScope.user) {
      return this.$q.when(this.$rootScope.user);
    }

    this.reloadUser()
      .then((user) => {
        this.$rootScope.user = user;
        this.userReadyDfd.resolve(user);
        this.settingsFields = user.type === 'MrssportyUser' || user.type === 'FitboxUser' ?
          [
            'workout_type',
            'customer_age'
          ] :
          [
            'business_type',
            'music_flavors',
            'customer_age',
            'music_style'
          ];

        // this.startPolling();

        if (window.trackJs && window.trackJs.configure) {
          trackJs.configure({
            userId: user.email
          });
        }

        return user;
      });
  }

  reloadUser() {
    return this.$http.get('/api/user').then((response) => {
      const user = response.data;
      _.assign(this.authData, {
        loggedIn: !user.anonymous,
        user
      });
      return user;
    });
  }

  startPolling() {
    if (this.pollingId) {
      this.$interval.cancel(this.pollingId);
    }

    this.pollingId = this.$interval(() => {
      this.$http.get('/api/my-settings')
        .then((response) => {
          if (!_.isEqual(
              _.pick(this.$rootScope.user, this.settingsFields),
              _.pick(response.data, this.settingsFields)
            )) {
            _.assign(this.$rootScope.user, response.data);
            this.$rootScope.$emit('user:settings-changed');
          }
        });
    }, 1000 * 60 * 5);
  }

  register(user) {
    return this.$http.post('/register', user);
  }

  login(user) {
    return this.$http.post('/login', user);
  }

  logout() {
    return this.$http.post('/logout').then(() => {
      this.$rootScope.user = null;
      this.authData.loggedIn = false;
      this.authData.user = null;
    });
  }

  setPassword(oldPassword, password) {
    return this.$http.post('/api/set-password', {password: password, oldPassword: oldPassword})
      .then((resp) => resp.data);
  }

  userReady() {
    return this.userReadyDfd.promise;
  }

  getLastSubcription() {
    return this.$http.get('/api/user/last_subscription').then((response) => response.data);
  }

  saveUserSettings(update) {
    return this.$http.post('/api/user/settings', update)
      .then((res) => res.data);
  }
}
