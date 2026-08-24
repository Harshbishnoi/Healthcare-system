const bcrypt = require('bcryptjs');
const config = require('../config/env');

/**
 * Hash plaintext password using bcrypt
 */
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Compare plaintext password with hashed password
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
