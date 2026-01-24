const axios = require('axios');

async function testOTP() {
  try {
    const response = await axios.post('http://localhost:4000/api/v1/auth/verify-otp', {
      email: 'kptsports103@gmail.com',
      otp: '970654'
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testOTP();
