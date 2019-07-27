'use strict';

const express = require('express');

const router = new express.Router();

const AVAILABLE_LOCALES = {
  en: {
    default: true
  },
  de: {
    default: false,
    detectByGeoIp: true
  }
};

const localizedRoutes = [
  'terms'
];

router.get('/', (req, res, next) => {
  // TODO: refactor to rely on req.getLocale()
  if (req.session.lang) {
    const local = AVAILABLE_LOCALES[req.session.lang];
    if (local) {
      return local.default ? next(null) : res.redirect(req.session.lang);
    }
  }

  if (req.country) {
    const local = AVAILABLE_LOCALES[req.country];
    if (local && local.detectByGeoIp) {
      res.redirect(`${req.country}`);
      return;
    }
  }
  next(null);
});

Object.keys(AVAILABLE_LOCALES)
  .forEach((code) => {
    router.get(`/${code}`, (req, res, next) => {
      req.session.lang = code;
      if (AVAILABLE_LOCALES[code].default) {
        res.redirect('/');
        return;
      }
      next(null);
    });
  });

localizedRoutes.forEach((route) => {
  router.get(`/${route}`, (req, res) => {
    const local = AVAILABLE_LOCALES[req.session.lang];
    res.redirect(local && !local.default ? `${req.session.lang}/${route}.html` : `/${route}.html`);
  });
});

module.exports = router;
