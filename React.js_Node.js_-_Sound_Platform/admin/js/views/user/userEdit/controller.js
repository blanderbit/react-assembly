var ALL_BUSINESS_TYPES = [
  { value: 'wellness_spa', label: 'Wellness & Spa' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'cafe', label: 'Café' },
  { value: 'design_store', label: 'Design store' },
  { value: 'hair_salon', label: 'Hair & Beauty' },
  { value: 'fashion_boutique', label: 'Fashion & Retail' },
  { value: 'bar', label: 'Bar' },
  { value: 'event', label: 'Event' },
  { value: 'fintess_studio', label: 'Fitness Studio Balance' },
  { value: 'fintess_studio_max', label: 'Fitness Studio Max' }
];

var ALL_CUSTOMER_AGES = [
  { value: '<20', label: 'Under 20' },
  { value: '<30', label: 'Under 30' },
  { value: '<50', label: 'Under 50' }
];

var MRSSPORTY_CUSTOMER_AGES = [
  { value: '<20', label: 'Under 20' },
  { value: '<30', label: 'Under 30' },
  { value: '<50', label: 'Under 50' },
  { value: '<70', label: 'Under 70' }
];

const MRSSPORTY_WORKOUT_TYPES = [
  { value: 'fitness_chillout', label: 'Fitness Chill-out (100 bpm)' },
  { value: 'fitness_balance', label: 'Fitness Balance (120 bpm)' },
  { value: 'fitness_max', label: 'Fitness Max (130 bpm)' }
];

const MRSSPORTY_SWITCHING_VOICES = [
  { value: null, label: 'None' },
  { value: 'german', label: 'In German language' },
  { value: 'italian', label: 'In Italian language' },
  { value: 'polish', label: 'In Polish language' },
  { value: 'dutch', label: 'In Dutch language' }
];

var ALL_MUSIC_STYLES = [
  { value: 'charts', label: 'Charts' },
  { value: 'charts_independent', label: '50% charts 50% indie' },
  { value: 'independent', label: 'Independent' }
];

var ALL_MUSIC_FLAVORS = [
  { value: 'nyc', label: 'Urban Chic / NYC' },
  { value: 'paris', label: 'French Bohème / Paris' },
  { value: 'berlin', label: 'Modern Minimalist / Berlin' },
  { value: 'stockholm', label: 'Scandinavian / Stockholm' },
  { value: 'miami', label: 'Clubbing / Ibiza' },
  { value: 'new_orleans', label: 'Heritage / New Orleans' },
  { value: 'christmas', label: 'Christmas Spirit' },
  { value: 'tropical', label: 'Tropical Chic / St. Barths' }
];

class UserEditController {
  constructor($state, $stateParams, User) {
    'ngInject';

    Object.assign(this, {
      $state,
      $stateParams,
      User
    });
  }

  $onInit() {
    this.IS_MRSSPORTY = this.user.type === 'MrssportyUser';
    this.IS_FITBOX = this.user.type === 'FitboxUser';
    this.IS_REGULAR = _.isNil(this.user.type);

    Object.assign(this, {
      startDatePickerOpened: false,
      endDatePickerOpened: false,
      hasPaidPeriod: false,
      isSaving: false,
      businessTypes: ALL_BUSINESS_TYPES,
      musicFlavors: ALL_MUSIC_FLAVORS,
      customerAges: (this.IS_MRSSPORTY || this.IS_FITBOX) ? MRSSPORTY_CUSTOMER_AGES : ALL_CUSTOMER_AGES,
      workoutTypes: (this.IS_MRSSPORTY || this.IS_FITBOX) ? MRSSPORTY_WORKOUT_TYPES : null,
      musicStyles: ALL_MUSIC_STYLES,
      MRSSPORTY_SWITCHING_VOICES
    });

    this.parseDates();
    this.setMusicFlavors();
    this.setCustomerAges();
  }

  reloadUser() {
    const { User, $stateParams } = this;

    this.user = null;

    User.get({ userId: $stateParams.userId })
      .$promise
      .then((user) => {
        this.user = user;
      });
  }

  parseDates() {
    if (this.user.trial_end) {
      this.user.trial_end = new Date(this.user.trial_end);
    }
  }

  setMusicFlavors() {
    var user = this.user;
    this.musicFlavors.forEach((flavor) => {
      flavor.selected = _.includes(user.music_flavors, flavor.value);
    });
  }

  updateMusicFlavors() {
    this.user.music_flavors = _(this.musicFlavors).filter('selected').map('value');
  }

  setCustomerAges() {
    var user = this.user;
    this.customerAges.forEach((age) => {
      age.selected = _.includes(user.customer_age, age.value);
    });
  }

  updateCustomerAges() {
    this.user.customer_age = _(this.customerAges).filter('selected').map('value');
  }

  save() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.user.$save()
      .then(() => {
        this.reloadUser();
      })
      .catch(() => {
        alert('Failed to save user');
      })
      .finally(() => {
        this.isSaving = false;
      });
  }
}

export default UserEditController;
