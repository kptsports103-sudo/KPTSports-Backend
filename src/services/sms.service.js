const axios = require('axios');

// Fast2SMS Integration (Better for Indian numbers)
const sendOTP = async (phoneNumber, otp) => {
  try {
    // Check for Fast2SMS credentials first (preferred for Indian numbers)
    const fast2smsApiKey = process.env.FAST2SMS_API_KEY;
    
    if (fast2smsApiKey && fast2smsApiKey !== 'your_fast2sms_api_key_here') {
      console.log(`Sending SMS via Fast2SMS to ${phoneNumber}: ${otp}`);
      
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        new URLSearchParams({
          authorization: fast2smsApiKey,
          route: 'v3',
          sender_id: 'TXTIND', // or your approved sender ID
          message: `Your OTP for KPT Sports account verification is: ${otp}. Valid for 5 minutes.`,
          language: 'english',
          flash: 0,
          numbers: phoneNumber
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log(`Fast2SMS sent successfully to ${phoneNumber}`);
      return { success: true, message: 'OTP sent successfully via Fast2SMS' };
    }
    
    // Fallback to Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber || 
        accountSid === 'YOUR_ACTUAL_ACCOUNT_SID_HERE' || 
        accountSid === 'your_twilio_account_sid_here') {
      console.log(`SMS OTP sent to ${phoneNumber}: ${otp} (using console log - configure SMS provider)`);
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
    return { success: true, message: 'OTP sent successfully via Twilio' };
  } catch (error) {
    console.error('SMS sending error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP via SMS');
  }
};

module.exports = {
  sendOTP,
};