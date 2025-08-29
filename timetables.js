const express = require('express');
const Timetable = require('../models/Timetable');
const TimetableGenerator = require('../algorithms/timetableGenerator');
const { auth, adminAuth, facultyAuth } = require('../middleware/auth');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Classroom = require('../models/Classroom');

const router = express.Router();

// Get all timetables
router.get('/', auth, async (req, res) => {
  try {
    const { department, semester, academicYear, status } = req.query;
    let filter = {};

    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (status) filter.status = status;

    const timetables = await Timetable.find(filter)
      .populate('department', 'name code')
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(timetables);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get timetable by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('department', 'name code')
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Generate optimized timetable (Admin and Faculty)
router.post('/generate', facultyAuth, async (req, res) => {
  try {
    const { departmentId, semester, academicYear, constraints } = req.body;

    // Fetch courses, faculties, classrooms for the department and semester
    const courses = await Course.find({ department: departmentId, semester, isActive: true });
    const faculties = await Faculty.find({ department: departmentId, isActive: true }).populate('preferredSubjects');
    const classrooms = await Classroom.find({ isActive: true });

    const generator = new TimetableGenerator();
    const optimizedTimetable = await generator.generateTimetable(departmentId, semester, academicYear, courses, faculties, classrooms, constraints);

    // Save timetable draft
    const timetable = new Timetable({
      name: `Timetable - ${departmentId} - Sem ${semester} - ${academicYear}`,
      department: departmentId,
      semester,
      academicYear,
      schedule: optimizedTimetable.schedule,
      constraints: optimizedTimetable.constraints,
      fitnessScore: optimizedTimetable.fitnessScore,
      conflicts: optimizedTimetable.conflicts,
      status: 'draft',
      createdBy: req.user._id,
    });

    await timetable.save();

    res.status(201).json({
      message: 'Optimized timetable generated successfully',
      timetable,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update timetable status (approve/reject) (Admin only)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'pending-approval'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    timetable.status = status;
    timetable.rejectionReason = rejectionReason || '';
    timetable.approvedBy = status === 'approved' ? req.user._id : null;
    timetable.approvedAt = status === 'approved' ? new Date() : null;

    await timetable.save();

    res.json({
      message: `Timetable ${status} successfully`,
      timetable,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
