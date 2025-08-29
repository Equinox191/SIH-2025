const express = require('express');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', auth, async (req, res) => {
  try {
    const { department, semester, type, active } = req.query;
    let filter = {};

    if (department) {
      filter.department = department;
    }
    if (semester) {
      filter.semester = semester;
    }
    if (type) {
      filter.type = type;
    }
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const courses = await Course.find(filter)
      .populate('department', 'name code')
      .populate('prerequisites', 'name code')
      .populate('corequisites', 'name code')
      .populate('facultyPreferences.faculty', 'name email')
      .sort({ semester: 1, code: 1 });

    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get course by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'name code')
      .populate('prerequisites', 'name code')
      .populate('corequisites', 'name code')
      .populate('facultyPreferences.faculty', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create new course (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      semester,
      credits,
      type,
      hoursPerWeek,
      batchSize,
      prerequisites,
      corequisites,
      facultyPreferences,
      roomRequirements,
      isLabRequired
    } = req.body;

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    // Validate department
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(400).json({ message: 'Department not found' });
    }

    // Validate prerequisites and corequisites if provided
    if (prerequisites && prerequisites.length > 0) {
      const prereqCourses = await Course.find({ _id: { $in: prerequisites } });
      if (prereqCourses.length !== prerequisites.length) {
        return res.status(400).json({ message: 'One or more prerequisites not found' });
      }
    }

    if (corequisites && corequisites.length > 0) {
      const coreqCourses = await Course.find({ _id: { $in: corequisites } });
      if (coreqCourses.length !== corequisites.length) {
        return res.status(400).json({ message: 'One or more corequisites not found' });
      }
    }

    // Validate faculty preferences if provided
    if (facultyPreferences && facultyPreferences.length > 0) {
      const facultyIds = facultyPreferences.map(fp => fp.faculty);
      const faculties = await Faculty.find({ _id: { $in: facultyIds } });
      if (faculties.length !== facultyIds.length) {
        return res.status(400).json({ message: 'One or more faculty members not found' });
      }
    }

    const course = new Course({
      name,
      code,
      department,
      semester,
      credits,
      type,
      hoursPerWeek,
      batchSize,
      prerequisites,
      corequisites,
      facultyPreferences,
      roomRequirements,
      isLabRequired
    });

    await course.save();
    await course.populate('department', 'name code');
    await course.populate('prerequisites', 'name code');
    await course.populate('corequisites', 'name code');
    await course.populate('facultyPreferences.faculty', 'name email');

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update course (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      semester,
      credits,
      type,
      hoursPerWeek,
      batchSize,
      prerequisites,
      corequisites,
      facultyPreferences,
      roomRequirements,
      isLabRequired,
      isActive
    } = req.body;

    // Check if code is being changed and if it already exists
    if (code) {
      const existingCourse = await Course.findOne({ 
        code, 
        _id: { $ne: req.params.id } 
      });
      if (existingCourse) {
        return res.status(400).json({ message: 'Course code already exists' });
      }
    }

    // Validate department if provided
    if (department) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }

    // Validate prerequisites and corequisites if provided
    if (prerequisites && prerequisites.length > 0) {
      const prereqCourses = await Course.find({ _id: { $in: prerequisites } });
      if (prereqCourses.length !== prerequisites.length) {
        return res.status(400).json({ message: 'One or more prerequisites not found' });
      }
    }

    if (corequisites && corequisites.length > 0) {
      const coreqCourses = await Course.find({ _id: { $in: corequisites } });
      if (coreqCourses.length !== corequisites.length) {
        return res.status(400).json({ message: 'One or more corequisites not found' });
      }
    }

    // Validate faculty preferences if provided
    if (facultyPreferences && facultyPreferences.length > 0) {
      const facultyIds = facultyPreferences.map(fp => fp.faculty);
      const faculties = await Faculty.find({ _id: { $in: facultyIds } });
      if (faculties.length !== facultyIds.length) {
        return res.status(400).json({ message: 'One or more faculty members not found' });
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        department,
        semester,
        credits,
        type,
        hoursPerWeek,
        batchSize,
        prerequisites,
        corequisites,
        facultyPreferences,
        roomRequirements,
        isLabRequired,
        isActive
      },
      { new: true, runValidators: true }
    )
      .populate('department', 'name code')
      .populate('prerequisites', 'name code')
      .populate('corequisites', 'name code')
      .populate('facultyPreferences.faculty', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      message: 'Course updated successfully',
      course
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete course (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
