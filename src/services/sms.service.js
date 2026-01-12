const axios = require('axios');

// Twilio SMS Integration
const sendOTP = async (phoneNumber, otp) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber || accountSid === 'your_twilio_account_sid_here') {
      console.log(`SMS OTP sent to ${phoneNumber}: ${otp} (using console log - configure Twilio for real SMS)`);
      return { success: true, message: 'OTP sent successfully (development mode)' };
    }

    // Format phone number for international format if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: formattedNumber,
        From: fromNumber,
        Body: `Your OTP for KPT Sports account verification is: ${otp}. Valid for 5 minutes.`
      }),
      {
        auth: {
          username: accountSid,
          password: authToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log(`SMS sent successfully to ${phoneNumber}, SID: ${response.data.sid}`);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('SMS sending error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP via SMS');
  }
};

module.exports = {
  sendOTP,
};