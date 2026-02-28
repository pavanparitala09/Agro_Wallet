const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sectionName: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

sectionSchema.index({ userId: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);


