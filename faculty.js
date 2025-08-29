const express = require('express');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all faculty
router.get('/', auth, async (req, res) => {
  try {
    const { department, active } = req.query;
    let filter = {};

    if (department) {
      filter.department = department;
    }
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const faculty = await Faculty.find(filter)
      .populate('department', 'name code')
      .populate('preferredSubjects', 'name code')
      .sort({ name: 1 });

    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get faculty by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('department', 'name code')
      .populate('preferredSubjects', 'name code');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create new faculty (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      employeeId,
      department,
      designation,
      qualification,
      specialization,
      maxHoursPerWeek,
      preferredSubjects
    } = req.body;

    // Check if email or employeeId already exists
    const existingFaculty = await Faculty.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingFaculty) {
      return res.status(400).json({ message: 'Faculty with this email or employee ID already exists' });
    }

    // Check if department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(400).json({ message: 'Department not found' });
    }

    const faculty = new Faculty({
      name,
      email,
      employeeId,
      department,
      designation,
      qualification,
      specialization,
      maxHoursPerWeek,
      preferredSubjects
    });

    await faculty.save();
    await faculty.populate('department', 'name code');
    await faculty.populate('preferredSubjects', 'name code');

    res.status(201).json({
      message: 'Faculty created successfully',
      faculty
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update faculty (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      employeeId,
      department,
      designation,
      qualification,
      specialization,
      maxHoursPerWeek,
      preferredSubjects,
      isActive
    } = req.body;

    // Check if email or employeeId is being changed and if they already exist
    if (email || employeeId) {
      const existingFaculty = await Faculty.findOne({
        $or: [
          { email, _id: { $ne: req.params.id } },
          { employeeId, _id: { $ne: req.params.id } }
        ]
      });
      if (existingFaculty) {
        return res.status(400).json({ message: 'Email or employee ID already exists' });
      }
    }

    // Check if department exists
    if (department) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }

    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        employeeId,
        department,
        designation,
        qualification,
        specialization,
        maxHoursPerWeek,
        preferredSubjects,
        isActive
      },
      { new: true, runValidators: true }
    )
      .populate('department', 'name code')
      .populate('preferredSubjects', 'name code');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({
      message: 'Faculty updated successfully',
      faculty
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete faculty (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({ message: 'Faculty deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add leave for faculty
router.post('/:id/leaves', auth, async (req, res) => {
  try {
    const { date, reason } = req.body;

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    faculty.leaves.push({ date, reason });
    await faculty.save();

    res.json({
      message: 'Leave added successfully',
      leaves: faculty.leaves
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
