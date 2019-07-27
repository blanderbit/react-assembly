export default class RegisterController {
  constructor(api) {
    'ngInject';

    Object.assign(this, {
      api
    });
  }

  submit() {
    const { api } = this;

    this.reset();

    this.disabled = true;

    api.register(this.user)
      .then((resp) => {
        this.form.$setPristine();
        this.user = {};
        location.href = '/register/confirmation';
      })
      .catch((resp) => {
        this.user.password = null;
        this.error = resp.data.message.text;
        this.form.$setPristine();
      })
      .finally(() => {
        this.disabled = false;
      });
  }

  reset() {
    Object.assign(this, {
      success: null,
      error: null
    });
  }
}
