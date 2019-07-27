var mailing = (function () {

  var form = {
    create: function () {
      var self = this;
      Object.keys(this.el).forEach(function (k) {
        var elKey = '$' + k;
        var el = self.el[k];
        self.el[elKey] = $(el);
      });
    },

    init: function () {
      var self = this;
      this.create();
      if(!this.el.$form.length) {
        return;
      }
      this.el.$result.hide();
      this.el.$form.on('submit', function (e) {
        self.send();
        e.preventDefault();
      });
    },

    sendSuccess: function (msg) {
      this.el.$result.addClass('alert-success').text(msg || this.successMsg).show();
    },

    sendFailure: function (msg) {
      this.el.$result.addClass('alert-danger').text(msg || this.failureMsg).show();
    },

    send: function () {
      var self = this;
      var body = this.buildRequestBody();
      $.post(this.url, body, function () {
        self.sendSuccess();
        self.clearForm();
      }).fail(function (data) {
        var msg;
        if(data && data.status === 400) {
          msg = data.responseJSON.error;
        }
        self.sendFailure(msg);
      });
    },

    clearForm: function () {
      var self = this;
      Object.keys(this.el)
        .filter(function (k) {
          return k.indexOf('$') === 0;
        })
        .forEach(function (k) {
           if(typeof self.el[k].val === 'function') {
             self.el[k].val('');
           }
        });
    }
  };

  //subscriptionForm
  var subscriptionForm = Object.create(form);
  subscriptionForm.url = '/subscribe';
  subscriptionForm.el = {
    form: '.js-subscription-form',
    result: '.js-subscription-result',
    name: '.js-subscription-form .js-subscription-name',
    email: '.js-subscription-form .js-subscription-email'
  };
  subscriptionForm.buildRequestBody = function () {
    return {
      name: this.el.$name.val(),
      email: this.el.$email.val()
    };
  };
  subscriptionForm.successMsg = 'You have been subscribed to our list. Thanks.';
  subscriptionForm.failureMsg = 'Could not subscribe you to our list.';

  //contactForm
  var contactForm = Object.create(form);
  contactForm.url = '/contact';
  contactForm.el = {
    form: '.js-contact-form',
    result: '.js-contact-result',
    subject: '.js-contact-form .js-contact-subject',
    email: '.js-contact-form .js-contact-email',
    name: '.js-contact-form .js-contact-name',
    msg: '.js-contact-form .js-contact-message'
  };
  contactForm.buildRequestBody = function () {
    return {
      subject: this.el.$subject.val(),
      authorEmail: this.el.$email.val(),
      authorName: this.el.$name.val(),
      message: this.el.$msg.val()
    };
  };
  contactForm.successMsg = 'Your message has been sent. Thanks.';
  contactForm.failureMsg = 'Could not send your message.';

  //requestForm
  var requestForm = Object.create(form);
  requestForm.url = '/subscribe';
  requestForm.el = {
    form: '.js-request-form',
    result: '.js-request-result',
    name: '.js-request-form .js-request-name',
    email: '.js-request-form .js-request-email'
  };
  requestForm.buildRequestBody = function () {
    return {
      name: this.el.$name.val(),
      email: this.el.$email.val()
    };
  };
  requestForm.successMsg = 'Your message has been sent. Thanks.';
  requestForm.failureMsg = 'Could not send your message.';

  return {
    contactForm: contactForm,
    subscriptionForm: subscriptionForm,
    requestForm: requestForm
  }

})();

mailing.contactForm.init();
mailing.subscriptionForm.init();
mailing.requestForm.init();
