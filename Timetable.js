const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  academicYear: {
    type: String,
    required: true,
    trim: true,
  },
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true,
    },
    timeSlots: [{
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
      },
      classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
      },
      batch: {
        type: String,
        trim: true,
      },
      isLabSession: {
        type: Boolean,
        default: false,
      },
    }],
  }],
  constraints: {
    maxClassesPerDay: {
      type: Number,
      default: 6,
    },
    minGapBetweenClasses: {
      type: Number,
      default: 10, // minutes
    },
    lunchBreak: {
      start: String,
      end: String,
    },
    workingHours: {
      start: String,
      end: String,
    },
  },
  status: {
    type: String,
    enum: ['draft', 'pending-approval', 'approved', 'rejected'],
    default: 'draft',
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fitnessScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  conflicts: [{
    type: {
      type: String,
      enum: ['faculty-conflict', 'room-conflict', 'student-conflict', 'time-conflict'],
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
  }],
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
timetableSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total classes per week
timetableSchema.virtual('totalClasses').get(function () {
  return this.schedule.reduce((total, day) => total + day.timeSlots.length, 0);
});

// Virtual for utilization rate
timetableSchema.virtual('utilizationRate').get(function () {
  const totalSlots = this.schedule.length * this.constraints.maxClassesPerDay;
  return totalSlots > 0 ? (this.totalClasses / totalSlots) * 100 : 0;
});

module.exports = mongoose.model('Timetable', timetableSchema);
