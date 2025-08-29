const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
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
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  type: {
    type: String,
    enum: ['classroom', 'laboratory', 'seminar-hall', 'auditorium'],
    default: 'classroom',
  },
  building: {
    type: String,
    required: true,
    trim: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  facilities: [{
    type: String,
    trim: true,
  }],
  availableFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  }],
  unavailableSlots: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    },
    timeSlots: [{
      start: String,
      end: String,
      reason: String,
    }],
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
classroomSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Classroom', classroomSchema);
