'use strict';

const mongoose = require('mongoose');
const moment = require('moment');

const EmailLog = require('./EmailLog');

const SubscriptionExpiringEmailLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_email: { type: String, required: true },
  paid_period_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  expiration_date: { type: Date, required: true }
}, { discriminatorKey: 'type' });


SubscriptionExpiringEmailLogSchema.methods.toEmail = function () {
  return {
    to: process.env.CONTACT_EMAIL,
    subject: `Subsription expiring for user ${this.user_email} is expiring`,
    template: 'subscription_expiring',
    email: this.user_email,
    date: moment(this.expiration_date).format('LL'),
    expires_in: moment(this.expiration_date).diff(moment(), 'days')
  };
};

const SubscriptionExpiringEmailLog =
  EmailLog.discriminator('SubscriptionExpiringEmailLog', SubscriptionExpiringEmailLogSchema);

module.exports = SubscriptionExpiringEmailLog;
