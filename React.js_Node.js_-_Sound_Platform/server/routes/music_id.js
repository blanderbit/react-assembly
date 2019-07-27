'use strict';

const authMiddleware = require('../middleware/auth');
const logger = require('../logger').main;

const router = new require('express').Router();

router.use(authMiddleware.requiredJSON);

const updateUserSetting = (bodyField, userField) => (req, res) => {
  req.user
    .update({ [userField]: req.body[bodyField] }, { runValidators: true })
    .then(() => {
      res.send();
    })
    .catch((err) => {
      res.status(400).send();
      logger.warn(`Failed to update user ${userField}`, err);
    });
};

router.put('/business_type', updateUserSetting('businessType', 'business_type'));
router.put('/music_flavors', updateUserSetting('musicFlavors', 'music_flavors'));
router.put('/customer_age', updateUserSetting('customerAge', 'customer_age'));
router.put('/music_style', updateUserSetting('musicStyle', 'music_style'));

module.exports = router;
