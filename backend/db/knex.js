const knexConfig = require('../knexfile');
const env = process.env.NODE_ENV || 'development';

const knex = require('knex')(knexConfig[env]);

// Test connection
knex.raw('SELECT 1')
  .then(() => console.log('Database connected successfully'))
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = knex;