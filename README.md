# Class Scheduling Optimization Platform

A comprehensive web-based platform for optimizing class schedules in higher education institutions, developed for the Government of Jharkhand's Department of Higher and Technical Education under the Smart Education initiative.

## Features

- **User Authentication**: Role-based access control (Admin, Faculty, Staff)
- **Department Management**: Create and manage academic departments
- **Faculty Management**: Manage teaching staff with preferences and availability
- **Classroom Management**: Track classrooms, labs, and their facilities
- **Course Management**: Define courses, prerequisites, and requirements
- **Timetable Generation**: AI-powered optimization using genetic algorithms
- **Approval Workflow**: Multi-level approval system for timetables
- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Multi-Department Support**: Handle multiple departments and shifts

## Technology Stack

### Frontend
- React.js 18
- Material-UI (MUI)
- React Router
- Axios for API calls

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT Authentication
- Genetic Algorithm for optimization

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd class-scheduling-platform/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy and edit the .env file with your configuration
cp .env.example .env
```

4. Start MongoDB service

5. Run the backend server:
```bash
npm run dev
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd class-scheduling-platform/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on http://localhost:3000

## Default Admin Account

After setting up the database, create an admin user through the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@college.edu",
    "password": "admin123",
    "role": "admin"
  }'
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department (Admin only)
- `PUT /api/departments/:id` - Update department (Admin only)

### Faculty
- `GET /api/faculty` - Get all faculty
- `POST /api/faculty` - Create faculty (Admin only)
- `PUT /api/faculty/:id` - Update faculty (Admin only)

### Classrooms
- `GET /api/classrooms` - Get all classrooms
- `POST /api/classrooms` - Create classroom (Admin only)
- `PUT /api/classrooms/:id` - Update classroom (Admin only)

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Admin only)
- `PUT /api/courses/:id` - Update course (Admin only)

### Timetables
- `GET /api/timetables` - Get all timetables
- `POST /api/timetables/generate` - Generate optimized timetable
- `PUT /api/timetables/:id/status` - Approve/reject timetable

## Optimization Algorithm

The timetable generation uses a genetic algorithm that considers:
- Faculty availability and preferences
- Classroom capacity and facilities
- Course requirements and prerequisites
- Department constraints
- Time slot optimization
- Conflict minimization

## Deployment

### Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Set NODE_ENV to production in backend .env file

3. Use process managers like PM2 for backend:
```bash
npm install -g pm2
pm2 start index.js --name "class-scheduler"
```

### Docker Deployment

Docker configuration files will be added in future updates for containerized deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is developed for the Government of Jharkhand under the Smart Education initiative.

## Support

For support and queries, contact the Department of Higher and Technical Education, Government of Jharkhand.

## Acknowledgments

- National Education Policy (NEP) 2020
- Government of Jharkhand
- Department of Higher and Technical Education
- Smart Education Initiative
