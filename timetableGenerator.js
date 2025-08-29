class TimetableGenerator {
  constructor() {
    this.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    this.timeSlots = this.generateTimeSlots('08:00', '17:00', 60); // 1-hour slots from 8 AM to 5 PM
  }

  generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    let currentTime = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    while (currentTime < end) {
      const startStr = this.formatTime(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + duration);
      const endStr = this.formatTime(currentTime);
      
      if (currentTime <= end) {
        slots.push({ start: startStr, end: endStr });
      }
    }

    return slots;
  }

  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  formatTime(date) {
    return date.toTimeString().slice(0, 5);
  }

  async generateTimetable(departmentId, semester, academicYear, courses, faculties, classrooms, constraints) {
    const timetable = {
      department: departmentId,
      semester,
      academicYear,
      schedule: this.days.map(day => ({
        day,
        timeSlots: []
      })),
      constraints: constraints || {
        maxClassesPerDay: 6,
        minGapBetweenClasses: 10,
        workingHours: { start: '08:00', end: '17:00' },
        lunchBreak: { start: '12:00', end: '13:00' }
      },
      fitnessScore: 0,
      conflicts: []
    };

    // Filter courses for the specific semester
    const semesterCourses = courses.filter(course => course.semester === semester);
    
    // Generate initial population of timetables
    const population = this.generateInitialPopulation(timetable, semesterCourses, faculties, classrooms);
    
    // Evolve the population using genetic algorithm
    const bestTimetable = await this.evolvePopulation(population, 100); // 100 generations

    return bestTimetable;
  }

  generateInitialPopulation(baseTimetable, courses, faculties, classrooms, populationSize = 50) {
    const population = [];

    for (let i = 0; i < populationSize; i++) {
      const timetable = JSON.parse(JSON.stringify(baseTimetable));
      
      // Randomly assign courses to time slots
      for (const course of courses) {
        this.assignCourseRandomly(timetable, course, faculties, classrooms);
      }

      // Calculate fitness score
      timetable.fitnessScore = this.calculateFitness(timetable);
      population.push(timetable);
    }

    return population;
  }

  assignCourseRandomly(timetable, course, faculties, classrooms) {
    const requiredSlots = Math.ceil(course.hoursPerWeek / (course.type === 'practical' ? 2 : 1));
    let assignedSlots = 0;

    while (assignedSlots < requiredSlots) {
      const randomDay = this.days[Math.floor(Math.random() * this.days.length)];
      const daySchedule = timetable.schedule.find(s => s.day === randomDay);
      
      if (daySchedule.timeSlots.length < timetable.constraints.maxClassesPerDay) {
        const availableSlots = this.getAvailableSlots(daySchedule, timetable.constraints);
        
        if (availableSlots.length > 0) {
          const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
          const faculty = this.selectFacultyForCourse(course, faculties);
          const classroom = this.selectClassroomForCourse(course, classrooms);

          daySchedule.timeSlots.push({
            startTime: randomSlot.start,
            endTime: randomSlot.end,
            course: course._id,
            faculty: faculty ? faculty._id : null,
            classroom: classroom ? classroom._id : null,
            batch: course.batchSize > 60 ? this.splitBatch(course.batchSize) : 'A',
            isLabSession: course.type === 'practical'
          });

          assignedSlots++;
        }
      }
    }
  }

  getAvailableSlots(daySchedule, constraints) {
    const usedSlots = daySchedule.timeSlots.map(slot => ({
      start: this.parseTime(slot.startTime),
      end: this.parseTime(slot.endTime)
    }));

    return this.timeSlots.filter(slot => {
      const slotStart = this.parseTime(slot.start);
      const slotEnd = this.parseTime(slot.end);

      // Check if slot overlaps with any existing class
      const hasOverlap = usedSlots.some(used => 
        slotStart < this.parseTime(used.end) && this.parseTime(used.start) < slotEnd
      );

      // Check if slot is during lunch break
      const isLunchBreak = constraints.lunchBreak && 
        slotStart >= this.parseTime(constraints.lunchBreak.start) && 
        slotEnd <= this.parseTime(constraints.lunchBreak.end);

      return !hasOverlap && !isLunchBreak;
    });
  }

  selectFacultyForCourse(course, faculties) {
    // Prioritize faculty with preferences for this course
    const preferredFaculty = faculties.find(f => 
      f.preferredSubjects?.some(ps => ps.toString() === course._id.toString())
    );

    if (preferredFaculty) {
      return preferredFaculty;
    }

    // Select faculty with least workload
    return faculties
      .filter(f => f.department.toString() === course.department.toString())
      .sort((a, b) => this.calculateFacultyWorkload(a) - this.calculateFacultyWorkload(b))[0];
  }

  calculateFacultyWorkload(faculty) {
    // This would be calculated based on existing assignments
    return 0; // Placeholder
  }

  selectClassroomForCourse(course, classrooms) {
    return classrooms
      .filter(c => 
        c.capacity >= course.batchSize &&
        c.type === (course.isLabRequired ? 'laboratory' : 'classroom') &&
        c.availableFor?.some(dept => dept.toString() === course.department.toString())
      )
      .sort((a, b) => a.capacity - b.capacity)[0]; // Prefer smaller classrooms first
  }

  splitBatch(batchSize) {
    const batches = Math.ceil(batchSize / 60);
    return batches > 1 ? 'Multiple' : 'A';
  }

  calculateFitness(timetable) {
    let score = 100;

    // Deduct points for conflicts
    const conflicts = this.detectConflicts(timetable);
    timetable.conflicts = conflicts;

    // Deduct 10 points for each conflict
    score -= conflicts.length * 10;

    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }

  detectConflicts(timetable) {
    const conflicts = [];

    // Check for faculty conflicts
    const facultyAssignments = new Map();
    for (const day of timetable.schedule) {
      for (const slot of day.timeSlots) {
        if (slot.faculty) {
          const key = `${slot.faculty}-${day.day}-${slot.startTime}`;
          if (facultyAssignments.has(key)) {
            conflicts.push({
              type: 'faculty-conflict',
              description: `Faculty assigned to multiple classes at same time`,
              severity: 'high'
            });
          }
          facultyAssignments.set(key, true);
        }
      }
    }

    // Check for room conflicts
    const roomAssignments = new Map();
    for (const day of timetable.schedule) {
      for (const slot of day.timeSlots) {
        if (slot.classroom) {
          const key = `${slot.classroom}-${day.day}-${slot.startTime}`;
          if (roomAssignments.has(key)) {
            conflicts.push({
              type: 'room-conflict',
              description: `Room double booked at same time`,
              severity: 'high'
            });
          }
          roomAssignments.set(key, true);
        }
      }
    }

    return conflicts;
  }

  async evolvePopulation(population, generations) {
    for (let gen = 0; gen < generations; gen++) {
      // Select parents (tournament selection)
      const parents = this.selectParents(population);
      
      // Create new generation through crossover and mutation
      const newGeneration = [];
      
      while (newGeneration.length < population.length) {
        const parent1 = parents[Math.floor(Math.random() * parents.length)];
        const parent2 = parents[Math.floor(Math.random() * parents.length)];
        
        const child = this.crossover(parent1, parent2);
        this.mutate(child);
        child.fitnessScore = this.calculateFitness(child);
        
        newGeneration.push(child);
      }
      
      population = newGeneration;
    }

    // Return the best timetable
    return population.sort((a, b) => b.fitnessScore - a.fitnessScore)[0];
  }

  selectParents(population) {
    // Tournament selection
    const tournamentSize = 3;
    const parents = [];

    while (parents.length < population.length / 2) {
      const tournament = [];
      for (let i = 0; i < tournamentSize; i++) {
        tournament.push(population[Math.floor(Math.random() * population.length)]);
      }
      parents.push(tournament.sort((a, b) => b.fitnessScore - a.fitnessScore)[0]);
    }

    return parents;
  }

  crossover(parent1, parent2) {
    // Single-point crossover
    const crossoverPoint = Math.floor(Math.random() * this.days.length);
    const child = JSON.parse(JSON.stringify(parent1));

    for (let i = crossoverPoint; i < this.days.length; i++) {
      child.schedule[i].timeSlots = JSON.parse(JSON.stringify(parent2.schedule[i].timeSlots));
    }

    return child;
  }

  mutate(timetable) {
    // Random mutation
    if (Math.random() < 0.1) { // 10% mutation rate
      const randomDay = this.days[Math.floor(Math.random() * this.days.length)];
      const daySchedule = timetable.schedule.find(s => s.day === randomDay);
      
      if (daySchedule.timeSlots.length > 0) {
        const randomSlotIndex = Math.floor(Math.random() * daySchedule.timeSlots.length);
        const slot = daySchedule.timeSlots[randomSlotIndex];
        
        // Mutate time slot
        const availableSlots = this.getAvailableSlots(daySchedule, timetable.constraints);
        if (availableSlots.length > 0) {
          const newSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
          slot.startTime = newSlot.start;
          slot.endTime = newSlot.end;
        }
      }
    }
  }
}

module.exports = TimetableGenerator;
