'use strict';

const MrssportyUserSchema = require('./shared_schemas/MrssportyUserSchema');
const User = require('./User');

const MrssportyUser = User.discriminator('MrssportyUser', MrssportyUserSchema.clone());

module.exports = MrssportyUser;
