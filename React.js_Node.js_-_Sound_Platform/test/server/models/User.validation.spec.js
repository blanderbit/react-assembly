'use strict';

const helper = require('../test_helper');

const moment = require('moment');
const Promise = require('bluebird');

const expect = helper.expect;
const ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');

const User = require('../../../server/models').User;

describe('User fields validation', function() {
  describe('business_type', () => {
    it('validates correct business_types', () => {
      [
        'cafe',
        'restaurant',
        'hotel',
        'design_store',
        'hair_salon',
        'fashion_boutique',
        'bar',
        'fintess_studio',
        'fintess_studio_max'
      ].forEach((bt) => {
        expect(new User({ business_type: bt }).validateSync()).be.undefined;
      });
    });

    it('validates incorrect business_type', () => {
      expect(new User({ business_type: 'noneexistent' }).validateSync()).exists;
    });

    it('sets default to cafe', () => {
      expect(new User().business_type).equal('cafe');
    });

    it('user without business_type is invalid', () => {
      expect(new User({ business_type: null }).validateSync()).exists;
    });
  });

  describe('music_style', () => {
    it('validates correct music_style', () => {
      [
        'charts',
        'charts_independent',
        'independent'
      ].forEach((bt) => {
        expect(new User({ music_style: bt }).validateSync()).be.undefined;
      });
    });

    it('validates incorrect music_style', () => {
      expect(new User({ music_style: 'noneexistent' }).validateSync()).exists;
    });

    it('sets default to charts_independent', () => {
      expect(new User().music_style).equal('charts_independent');
    });

    it('user without music_style is invalid', () => {
      expect(new User({ music_style: null }).validateSync()).exists;
    });
  });

  describe('music_flavors', () => {
    it('validates correct music_flavors', () => {
      [
        'classic_mix',
        'nyc',
        'new_orleans',
        'paris',
        'stockholm',
        'berlin',
        'christmas',
        'miami',
        [
          'miami',
          'new_orleans'
        ],
        []
      ].forEach((mf) => {
        const user = new User({ music_flavors: mf });
        expect(user.validateSync()).be.undefined;
        expect(user.music_flavors.toObject()).eql(_.isArray(mf) ? mf : [mf]);
      });
    });

    it('validates incorrect music_flavors', () => {
      expect(new User({ music_flavors: 'noneexistent' }).validateSync()).exists;
      expect(new User({ music_flavors: ['noneexistent', 'nyc'] }).validateSync()).exists;
    });

    it('sets default music_flavors', () => {
      expect(new User().music_flavors.toObject()).eql(['classic_mix']);
    });

    it('user without music_flavors is invalid', () => {
      expect(new User({ music_flavors: null }).validateSync()).exists;
    });
  });

  describe('customer_age', () => {
    it('validates correct customer_age', () => {
      [
        '<20',
        '<30',
        '<50',
        [
          '<30',
          '<50'
        ],
        []
      ].forEach((mf) => {
        const user = new User({ customer_age: mf });
        expect(user.validateSync()).be.undefined;
        expect(user.customer_age.toObject()).eql(_.isArray(mf) ? mf : [mf]);
      });
    });

    it('validates incorrect customer_age', () => {
      expect(new User({ customer_age: 'noneexistent' }).validateSync()).exists;
      expect(new User({ customer_age: ['noneexistent', '<20'] }).validateSync()).exists;
    });

    it('sets default customer_age', () => {
      expect(new User().customer_age.toObject()).eql(['<30']);
    });

    it('user without customer_age is invalid', () => {
      expect(new User({ customer_age: null }).validateSync()).exists;
    });
  });
});
