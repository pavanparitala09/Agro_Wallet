const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true
    },
    vendorName: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: [true,"Amount is required"]
    },
    billDate: {
      type: Date,
      required: [true,"Bill date is required"],
      index: true
    },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partial_paid'],
      default: 'unpaid',
      index: true
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    interestEnabled: {
      type: Boolean,
      default: false
    },
    interestType: {
      type: String,
      enum: ['simple', 'compound'],
      default: 'simple'
    },
    interestFrequency: {
      type: String,
      enum: ['daily', 'monthly'],
      default: 'monthly'
    },
    interestRate: {
      type: Number,
      default: 0 // percentage per period
    },
    interestStartDate: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    imageUrl: {
      type: String
    },
    notes: {
      type: String
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

billSchema.index({ userId: 1, billDate: 1 });
billSchema.index({ userId: 1, status: 1 });
billSchema.index({ userId: 1, sectionId: 1 });

module.exports = mongoose.model('Bill', billSchema);


