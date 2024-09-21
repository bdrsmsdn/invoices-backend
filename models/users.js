const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
  },
  {
    collection: 'users',
  }
);

module.exports = mongoose.model('Users', userSchema);