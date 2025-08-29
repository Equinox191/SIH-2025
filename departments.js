const express = require('express');
const Department = require('../models/Department');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all departments
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('headOfDepartment', 'name email')
      .sort({ name: 1 });

    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get department by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('headOfDepartment', 'name email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create new department (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, code, description, headOfDepartment, shift } = req.body;

    // Check if department code already exists
    const existingDepartment = await Department.findOne({ code });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department code already exists' });
    }

    const department = new Department({
      name,
      code,
      description,
      headOfDepartment,
      shift
    });

    await department.save();
    await department.populate('headOfDepartment', 'name email');

    res.status(201).json({
      message: 'Department created successfully',
      department
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update department (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, code, description, headOfDepartment, shift, isActive } = req.body;

    // Check if code is being changed and if it already exists
    if (code) {
      const existingDepartment = await Department.findOne({ 
        code, 
        _id: { $ne: req.params.id } 
      });
      if (existingDepartment) {
        return res.status(400).json({ message: 'Department code already exists' });
      }
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, description, headOfDepartment, shift, isActive },
      { new: true, runValidators: true }
    ).populate('headOfDepartment', 'name email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({
      message: 'Department updated successfully',
      department
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete department (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
