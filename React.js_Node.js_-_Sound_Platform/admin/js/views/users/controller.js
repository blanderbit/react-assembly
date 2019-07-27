const DEFAULT_QUERY_OPTS = {
  sortKey: 'created',
  sortDirection: -1,
  includeAnon: false,
  search: ''
};

class UsersController {
  constructor(User, $uibModal, $timeout) {
    'ngInject';

    Object.assign(this, {
      User,
      $uibModal,
      $timeout
    });
  }

  $onInit() {
    this.users = [];

    _.defaults(this, DEFAULT_QUERY_OPTS, {
      totalUsers: null,
      noMoreToLoad: false,
      isLoading: false
    });

    this.loadUsersStats();
    this.reload();
  }

  getQueryOpts() {
    return {
      sortKey: this.sortKey,
      sortDirection: this.sortDirection,
      showAnonymous: this.includeAnon || null,
      search: this.search || null,
      skip: this.users.length
    };
  }

  loadUsersStats() {
    const { User } = this;

    User.stats((resp) => {
      this.totalUsers = resp.count;
    });
  }

  loadMoreUsers() {
    if (this.isLoading) return null;

    const { User } = this;

    this.isLoading = true;

    return User.query(this.getQueryOpts()).$promise
      .then((users) => {
        if (users && users.length) {
          this.users = this.users.concat(users);
        } else {
          this.noMoreToLoad = true;
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  reload() {
    const { User } = this;
    this.noMoreToLoad = false;
    this.users = [];
    this.isLoading = true;
    User.query(this.getQueryOpts()).$promise
      .then((users) => {
        this.users = users;
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  toggleSort(sortKey) {
    if (this.sortKey === sortKey) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortKey = sortKey;
      this.sortDirection = -1;
    }

    this.reload();
  }

  resetPendingInvoice(user) {
    const { $uibModal } = this;

    $uibModal.open({
      component: 'confirmationModal',
      resolve: {
        title: () => 'Confirm pending invoice reset',
        okButton: () => 'Confirm reset',
        description: () => `You are about to cancel pending invoice status of ${user.email}.
         The user will be unable to play if doesn't have active paid period and trial has already
         expired.`
      }
    })
    .result.then(() => {
      user.$resetPendingInvoice();
    }, _.noop);
  }
}

export default UsersController;
