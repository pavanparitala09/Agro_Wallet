const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Invalid email address'
      }
    },
    password: {
      type: String,
      required: false,
      default: null,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return value.length >= 6;
        },
        message: 'Password must be at least 6 characters long'
      }
    },
    googleId: {
      type: String,
      sparse: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);


