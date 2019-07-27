/* global moment */
/* eslint-disable no-underscore-dangle */
import AddPaidPeriodModalController from './addPaidPeriodModal/controller';

const addPaidPeriodModalTemplateUrl =
  'views/user/userEditSubscription/addPaidPeriodModal/template.html';

class UserEditSubscriptionController {
  constructor($state, $stateParams, $uibModal, User) {
    'ngInject';

    Object.assign(this, {
      $state,
      $stateParams,
      $uibModal,
      User
    });
  }

  $onInit() {
    if (this.user.chargebee_id) {
      this.User
        .getChargebeeSubscriptions({ userId: this.user._id })
        .$promise
        .then((list) => {
          this.chargebeeSubscriptions = list;
        });
    }
  }

  getNextPaidPeriodStart(user) {
    switch (user.subscriptionState) {
      case 'PENDING_SUBSCRIPTION':
        if (user.paid_periods.length) {
          return (
            moment(user.lastSubscription.date) >
            moment(_.last(user.paid_periods).end) ?
              moment(user.lastSubscription.date) :
              moment(_.last(user.paid_periods).end)
          ).startOf('day').toDate();
        }
        return moment(user.lastSubscription.date).startOf('day').toDate();
      case 'PAID':
        return moment(_.last(user.paid_periods).end).add(1, 'days').startOf('day').toDate();
      default:
        return moment().startOf('day').toDate();
    }
  }

  async openAddPaidPeriodModal() {
    const start = this.getNextPaidPeriodStart(this.user);

    const modalInstance = this.$uibModal.open({
      templateUrl: addPaidPeriodModalTemplateUrl,
      controller: AddPaidPeriodModalController,
      controllerAs: 'addPaidPeriodModalCtrl',
      size: 'sm',
      resolve: {
        paidPeriod: () => ({
          start,
          end: moment(start).add(1, 'year').endOf('day').toDate()
        })
      }
    });

    try {
      const { paidPeriod, createChargebee } = await modalInstance.result;
      this.createPaidPeriod(paidPeriod);
      if (createChargebee) {
        this.createChargebee(paidPeriod);
      }
    /* eslint-disable no-empty */
    } catch (e) {}
    /* eslint-enable no-empty */
  }

  createPaidPeriod(paidPeriod) {
    this.User
      .createPaidPeriod({ userId: this.user._id }, { paidPeriod })
      .$promise
      .then((user) => {
        Object.assign(this.user, user);
      });
  }

  createChargebee(paidPeriod) {
    this.chargebeeSubscriptions = null;

    this.User
      .createChargebee({ userId: this.user._id }, { paidPeriod })
      .$promise
      .then((list) => {
        this.chargebeeSubscriptions = list;
      });
  }

  removePaidPeriod(period) {
    this.$uibModal.open({
      component: 'confirmationModal',
      resolve: {
        title: () => 'Confirm paid period removal',
        okButton: () => 'Confirm',
        description: () => `You are about to delete paid period
          ${moment(period.start).format('DD/MM/YYYY')} - ${moment(period.end).format('DD/MM/YYYY')}
          from ${this.user.email}`
      }
    }).result.then(() => {
      this.User
        .deletePaidPeriod({ userId: this.user._id, paidPeriodId: period._id })
        .$promise
        .then((user) => {
          Object.assign(this.user, user);
        });
    });
  }

  resetPendingInvoice() {
    this.$uibModal.open({
      component: 'confirmationModal',
      resolve: {
        title: () => 'Confirm pending subscription request removal',
        okButton: () => 'Confirm',
        description: () => `You are about to delete pending subscription request 
          from ${this.user.email}`
      }
    }).result.then(() => {
      this.User
        .resetPendingInvoice({ userId: this.user._id })
        .$promise
        .then((user) => {
          Object.assign(this.user, user);
        });
    });
  }
}

export default UserEditSubscriptionController;
