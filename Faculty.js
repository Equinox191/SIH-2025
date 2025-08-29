const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  designation: {
    type: String,
    required: true,
    trim: true,
  },
  qualification: {
    type: String,
    trim: true,
  },
  specialization: {
    type: String,
    trim: true,
  },
  maxHoursPerWeek: {
    type: Number,
    default: 40,
    min: 0,
    max: 60,
  },
  preferredSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  unavailableSlots: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    },
    timeSlots: [{
      start: String,
      end: String,
    }],
  }],
  leaves: [{
    date: Date,
    reason: String,
    isApproved: {
      type: Boolean,
      default: false,
    },
  }],
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
facultySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total leaves count
facultySchema.virtual('totalLeaves').get(function () {
  return this.leaves.filter(leave => leave.isApproved).length;
});

module.exports = mongoose.model('Faculty', facultySchema);
