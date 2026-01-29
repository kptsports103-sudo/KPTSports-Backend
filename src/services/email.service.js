const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service configuration error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

const sendOTP = async (email, otp) => {
  try {
    console.log(`Attempting to send OTP to ${email}`);
    console.log(`Email user: ${process.env.EMAIL_USER}`);
    console.log(`Email pass configured: ${process.env.EMAIL_PASS ? 'Yes' : 'No'}`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code - KPT Sports',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">KPT Sports - OTP Verification</h2>
          <p>Your OTP code is:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</span>
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${email}`);
    console.log('Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending OTP - Full error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

module.exports = {
  sendOTP,
};