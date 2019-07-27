'use strict';

const express = require('express');

const router = new express.Router();

// GET/POST /logout - logout, redir to /
function logout(req, res) {
  req.logout();
  return res.message('You have been logged out.', 'success', '/login');
}

router.get('/', logout);
router.post('/', logout);

module.exports = router;
