'use strict';

/**
 * Simple MIME/text emails from templates using mailgun
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const Mailgun = require('mailgun-js');
const VError = require('verror').VError;

const logger = require('./logger').main;

if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
  logger.error('Please set MAILGUN_API_KEY & MAILGUN_DOMAIN environment variables');
  process.exit(1);
}

const mailgun = new Mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

// pre-cache message templates as functions
const messages = {};
fs.readdirSync(path.join(__dirname, 'views', 'email')).forEach(function(file) {
  var fname = path.basename(file, '.ejs').split('.');
  var name = fname.shift();
  var type = fname.pop();
  messages[ name ] = messages[ name ] || {};
  messages[ name ][ type ] = ejs.compile(fs.readFileSync(path.join(__dirname, 'views', 'email', file)).toString());
});


/**
 * Send an email using mailgun & a template
 * @param  {Object}   options `to`, and `template` are mandatory. `from` defaults to `MAIL_FROM_ADDRESS`
 *                            `template` is the basename of the templates in views/email
 *                            everything else is usable as template-vars
 * @param  {Function} cb      callback(error, response, body)
 */
module.exports = function sendMailgunEmail(options, cb) {
  const message = {
    from: options.from || process.env.MAIL_FROM_ADDRESS,
    to: options.to,
    subject: options.subject || 'No Subject',
    body: messages[options.template].txt(options),
    html: messages[options.template].html(options)
  };

  mailgun.messages().send(message, (err) => (
    cb(err ? new VError(err, 'failed to send mailgun email to %s', options.to) : null)
  ));
};

/**
 * add a user to a mailgun mailing-list
 * @param  {String} list Email address of the list
 * @param  {String} to   Recipient email
 * @param  {String} name Recipient name
 * @param  {Object} vars extra stuff to store with the transaction
 * @param  {Function} cb callback(error, response, body)
 */
module.exports.list = function(list, to, name, vars, cb){
  mailgun.lists(list).members().create({address:to, name:name, subscribed:true, vars:vars}, cb);
}
