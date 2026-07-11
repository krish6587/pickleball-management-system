const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'exai7897@gmail.com',
    pass: 'qvxt klkl tedx klrs',
  },
});

const mailOptions = {
  from: '"Pickleball App" <exai7897@gmail.com>',
  to: 'exai7897@gmail.com',
  subject: 'Test OTP - 123456',
  html: '<h1>Your OTP is: 123456</h1><p>This is a test email from the Pickleball app.</p>',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('EMAIL SEND FAILED:', error.message);
    console.log('Full error:', error);
  } else {
    console.log('EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  }
  process.exit(0);
});
