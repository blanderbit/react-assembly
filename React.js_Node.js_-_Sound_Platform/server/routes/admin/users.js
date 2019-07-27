'use strict';

const express = require('express');
const moment = require('moment');
const json2csv = require('json2csv');
const Excel = require('exceljs');
const tmp = require('tmp');
const _ = require('lodash');

const models = require('../../models');
const getPlayedEventsQuery = require('../../middleware/get_played_events_query');
const logger = require('../../logger').main;
const { getSubscriptions, importSubscription } = require('../../lib/chargebee');

const router = new express.Router();

router.get('/', (req, res) => {
  const skip = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 50;
  const search = req.query.search;

  const sortObj = {};

  if (req.query.sortKey) {
    sortObj[req.query.sortKey] = req.query.sortDirection || 1;
  }

  let query = models.User.find();

  if (!req.query.showAnonymous) {
    query = query.where({ anonymous: false });
  }

  if (search) {
    const re = new RegExp(search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));

    query = query.or([
      { name: re },
      { email: re }
    ]);
  }

  query
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .exec((err, users) => {
      if (err) {
        console.error(err.stack);
        res.status(500).send();
        return;
      }
      res.json((users || []).map((u) => u.toView(true)));
    });
});

router.post('/', (req, res) => {
  const user = models.User.buildByAdmin(req.body);

  models.User.register(user, req.body.password, (err, account) => {
    if (err) {
      res.status(400).json({
        error: err.message
      });
      return;
    }

    res.status(201).json(account.toView(true));
  });
});

router.get('/stats', (req, res) => {
  models.User.count()
    .exec((err, count) => {
      if (err) {
        console.error(err.stack);
        return res.status(500).send();
      }
      res.json({
        count
      });
    });
});

const getUser = (req, res, next) => {
  models.User.findById(req.params.userId)
    .exec((err, user) => {
      if (err) {
        console.error(err.stack);
        return res.status(500).send();
      }
      if (!user) return res.status(400).send();
      req.requestedUser = user;
      next(null);
    });
};

router.get('/:userId', getUser, (req, res) => {
  res.json(req.requestedUser.toView(true));
});

router.post('/:userId', getUser, (req, res) => {
  const update = _.pick(req.body, 'verified', 'music_style',
    'music_flavors', 'business_type', 'customer_age', 'trial_end', 'company_name',
    'customer_number', 'workout_type', 'changing_voice');
  _.assign(req.requestedUser, update);
  req.requestedUser.save((err, savedUser) => {
    if (err) {
      res.status(400).send();
      return;
    }

    res.json(savedUser.toView(true));
  });
});

router.post('/:userId/reset_pending_invoice', getUser, async (req, res) => {
  try {
    const savedUser = await req.requestedUser.resetPendingInvoice();
    res.json(savedUser.toView(true));
  } catch (err) {
    logger.error(`Failed to reset_pending_invoice for user: ${req.requestedUser.email}:`, err);
    res.status(500).send();
    return;
  }
});

router.get('/:userId/chargebee_subscriptions', getUser, async (req, res) => {
  if (!req.requestedUser.chargebee_id) {
    res.json([]);
    return;
  }

  try {
    res.json(await getSubscriptions(req.requestedUser));
  } catch (e) {
    logger.error(`Failed to get chargebee subscriptions for ${req.requestedUser.email}`, e);
    res.status(500).send();
  }
});

router.post('/:userId/chargebee_subscriptions', getUser, async (req, res) => {
  await importSubscription(req.requestedUser, { date: new Date(req.body.paidPeriod.start) });

  try {
    res.json(await getSubscriptions(req.requestedUser));
  } catch (e) {
    logger.error(`Failed to get chargebee subscriptoins for ${req.requestedUser.email}`, e);
    res.status(500).send();
  }
});

router.post('/:userId/paid_periods', getUser, async (req, res) => {
  const { paidPeriod } = req.body;
  if (!paidPeriod.start || !paidPeriod.end ||
    !moment(paidPeriod.end).isAfter(paidPeriod.start)) {
    res.status(400).send();
  }

  req.requestedUser.paid_periods.push(paidPeriod);
  const savedUser = await req.requestedUser.save();
  if (savedUser.subscriptionState === 'PENDING_SUBSCRIPTION') {
    await savedUser.resetPendingInvoice();
  }
  res.send(savedUser.toView(true));
});

router.delete('/:userId/paid_periods/:paidPeriodId', getUser, async (req, res) => {
  req.requestedUser.paid_periods.pull(req.params.paidPeriodId);
  const savedUser = await req.requestedUser.save();
  res.send(savedUser.toView(true));
});

router.post('/:userId/type', getUser, (req, res) => {
  const newType = req.body.type;

  req.requestedUser.convertTo(newType)
    .then(() => {
      res.send();
    })
    .catch((err) => {
      logger.error(`Failed to set type ${req.body.type} for user ${req.requestedUser.email}:`, err);
      res.status(500).send();
    });
});

const matchingEvents = (req, res, next) => {
  const skip = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 1000;

  const sortObj = {};

  if (req.query.sortKey) {
    sortObj[req.query.sortKey] = req.query.sortDirection || 1;
  }

  const queryObj = models.UserPlayEvent.find(req.playedEventsQuery)
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  if (req.requestedUser) {
    queryObj.lean();
  } else {
    queryObj.populate('user', 'email');
  }

  queryObj
    .exec((err, events) => {
      if (err) {
        console.error(err.stack);
        return res.status(500).send();
      }

      req.events = events;
      next(null);
    });
};

router.get('/:userId/events', getUser, getPlayedEventsQuery, matchingEvents, (req, res) => {
  res.json(req.events);
});

router.get('/:userId/events/csv',
  getUser,
  getPlayedEventsQuery,
  matchingEvents,

  (req, res) => {
    const data = req.events.map((event) => ({
      date: moment(event.date).format('HH:mm:ss DD/MM/YYYY'),
      trackName: event.trackName,
      trackType: event.trackType === 'Song' ? 'S3' : 'Soundcloud',
      client: event.client
    }));

    json2csv({
      fields: ['date', 'trackName', 'trackType', 'client'],
      fieldNames: ['Date & Time', 'Track Name', 'Track Type', 'Played using'],
      data
    }, (err, csv) => {
      if (err) {
        console.error(err.stack);
        res.status(500).send();
        return;
      }

      res.type('csv');
      res.set('Content-Disposition', `filename="songs_played_${req.requestedUser.email}.csv"`);
      res.send(csv);
    });
  }
);

router.get('/:userId/events/xlsx',
  getUser,
  getPlayedEventsQuery,
  matchingEvents,

  (req, res) => {
    const workbook = new Excel.Workbook();

    const sheet = workbook.addWorksheet('Played tracks');

    sheet.columns = [
      {
        header: 'Date',
        key: 'date',
        width: 20,
        style: {
          numFmt: 'HH:mm:ss DD/MM/YYYY',
          alignment: {
            horizontal: 'left'
          }
        }
      },

      {
        header: 'Track Name',
        key: 'trackName',
        width: 60
      },

      {
        header: 'Track Type',
        key: 'trackType',
        width: 15
      },

      {
        header: 'Played using',
        key: 'client',
        width: 15
      }
    ];

    req.events.forEach((event) => {
      sheet.addRow({
        date: event.date,
        trackName: event.trackName,
        trackType: event.trackType === 'Song' ? 'S3' : 'Soundcloud',
        client: event.client
      });
    });

    sheet.getRow(1).font = { bold: true };

    tmp.tmpName((err, path) => {
      if (err) {
        console.error('Error creating tmp filename:\n', err.stack);
        res.status(500).send();
        return;
      }

      workbook.xlsx.writeFile(path)
        .then(
          () => {
            res.download(path, `songs_played_${req.requestedUser.email}.xlsx`);
          },
          (err) => {
            console.error('Error writing xlsx workbook:\n', err.stack);
            res.status(500).send();
          }
        );
    });
  }
);

module.exports = router;
