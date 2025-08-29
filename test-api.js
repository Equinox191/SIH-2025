const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('Testing Class Scheduling Platform API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test authentication endpoints
    console.log('\n2. Testing authentication...');
    
    // Try to register a test user
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        username: 'testadmin',
        email: 'test@example.com',
        password: 'test123',
        role: 'admin'
      });
      console.log('✅ User registration:', registerResponse.data.message);
    } catch (registerError) {
      if (registerError.response?.status === 400) {
        console.log('ℹ️  User already exists, trying login...');
      } else {
        throw registerError;
      }
    }

    // Test login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    console.log('✅ Login successful:', loginResponse.data.message);

    const token = loginResponse.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Test protected endpoints
    console.log('\n3. Testing protected endpoints...');
    
    // Test departments endpoint
    const departmentsResponse = await axios.get(`${API_BASE}/departments`);
    console.log('✅ Departments endpoint:', 'Success');

    // Test faculty endpoint
    const facultyResponse = await axios.get(`${API_BASE}/faculty`);
    console.log('✅ Faculty endpoint:', 'Success');

    // Test classrooms endpoint
    const classroomsResponse = await axios.get(`${API_BASE}/classrooms`);
    console.log('✅ Classrooms endpoint:', 'Success');

    // Test courses endpoint
    const coursesResponse = await axios.get(`${API_BASE}/courses`);
    console.log('✅ Courses endpoint:', 'Success');

    // Test timetables endpoint
    const timetablesResponse = await axios.get(`${API_BASE}/timetables`);
    console.log('✅ Timetables endpoint:', 'Success');

    console.log('\n🎉 All API tests passed successfully!');
    console.log('\nThe backend API is working correctly.');
    console.log('You can now start the frontend development server.');

  } catch (error) {
    console.error('❌ API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.log('⚠️  Backend server is not running. Please start it first:');
    console.log('   cd backend && npm run dev');
    return false;
  }
}

async function main() {
  const isServerRunning = await checkServer();
  if (isServerRunning) {
    await testAPI();
  }
}

main();
