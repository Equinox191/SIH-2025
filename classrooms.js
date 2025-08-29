const express = require('express');
const Classroom = require('../models/Classroom');
const Department = require('../models/Department');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all classrooms
router.get('/', auth, async (req, res) => {
  try {
    const { type, building, available } = req.query;
    let filter = {};

    if (type) {
      filter.type = type;
    }
    if (building) {
      filter.building = building;
    }
    if (available !== undefined) {
      filter.isActive = available === 'true';
    }

    const classrooms = await Classroom.find(filter)
      .populate('availableFor', 'name code')
      .sort({ building: 1, floor: 1, name: 1 });

    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get classroom by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('availableFor', 'name code');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create new classroom (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name,
      code,
      capacity,
      type,
      building,
      floor,
      facilities,
      availableFor
    } = req.body;

    // Check if classroom code already exists
    const existingClassroom = await Classroom.findOne({ code });
    if (existingClassroom) {
      return res.status(400).json({ message: 'Classroom code already exists' });
    }

    // Validate departments if provided
    if (availableFor && availableFor.length > 0) {
      const departments = await Department.find({ _id: { $in: availableFor } });
      if (departments.length !== availableFor.length) {
        return res.status(400).json({ message: 'One or more departments not found' });
      }
    }

    const classroom = new Classroom({
      name,
      code,
      capacity,
      type,
      building,
      floor,
      facilities,
      availableFor
    });

    await classroom.save();
    await classroom.populate('availableFor', 'name code');

    res.status(201).json({
      message: 'Classroom created successfully',
      classroom
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update classroom (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const {
      name,
      code,
      capacity,
      type,
      building,
      floor,
      facilities,
      availableFor,
      isActive
    } = req.body;

    // Check if code is being changed and if it already exists
    if (code) {
      const existingClassroom = await Classroom.findOne({ 
        code, 
        _id: { $ne: req.params.id } 
      });
      if (existingClassroom) {
        return res.status(400).json({ message: 'Classroom code already exists' });
      }
    }

    // Validate departments if provided
    if (availableFor && availableFor.length > 0) {
      const departments = await Department.find({ _id: { $in: availableFor } });
      if (departments.length !== availableFor.length) {
        return res.status(400).json({ message: 'One or more departments not found' });
      }
    }

    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        capacity,
        type,
        building,
        floor,
        facilities,
        availableFor,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('availableFor', 'name code');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.json({
      message: 'Classroom updated successfully',
      classroom
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete classroom (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.json({ message: 'Classroom deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add unavailable slot for classroom
router.post('/:id/unavailable-slots', adminAuth, async (req, res) => {
  try {
    const { day, timeSlots, reason } = req.body;

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    classroom.unavailableSlots.push({
      day,
      timeSlots,
      reason
    });

    await classroom.save();

    res.json({
      message: 'Unavailable slot added successfully',
      unavailableSlots: classroom.unavailableSlots
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
