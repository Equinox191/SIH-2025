const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  type: {
    type: String,
    enum: ['theory', 'practical', 'tutorial', 'project'],
    default: 'theory',
  },
  hoursPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  batchSize: {
    type: Number,
    default: 60,
    min: 1,
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  corequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  facultyPreferences: [{
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    priority: {
      type: Number,
      min: 1,
      max: 5,
    },
  }],
  roomRequirements: [{
    type: String,
    trim: true,
  }],
  isLabRequired: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp before saving
courseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total contact hours
courseSchema.virtual('totalContactHours').get(function () {
  return this.hoursPerWeek * 15; // Assuming 15 weeks per semester
});

module.exports = mongoose.model('Course', courseSchema);
