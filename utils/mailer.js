import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER.trim(),  // Added .trim() to remove any accidental spaces
        pass: process.env.EMAIL_PASS.trim()  // Added .trim() here too
    },
    tls: {
        rejectUnauthorized: false
    }
});



export const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: `"Vartika Hotel" <${process.env.EMAIL_USER.trim()}>`,
        to: email,
        subject: 'Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #5b3016;">Password Reset Request</h2>
                <p>Your OTP for password reset is:</p>
                <h3 style="background: #f5f5f5; padding: 10px; display: inline-block; border-radius: 4px;">${otp}</h3>
                <p>This OTP is valid for 5 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `,
        // Add text version for email clients that don't support HTML
        text: `Your password reset OTP is: ${otp}\nThis OTP is valid for 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

export default transporter;





export const sendPasswordChangeEmail = async (email, otp) => {
    const mailOptions = {
      from: `"Vartika Hotel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Change OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5b3016;">Password Change Request</h2>
          <p>Your OTP for changing password is:</p>
          <h3 style="background: #f5f5f5; padding: 10px; display: inline-block; border-radius: 4px;">${otp}</h3>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you didn't request this change, please secure your account immediately.</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
  };
  
  export const sendPasswordChangedNotification = async (email) => {
    const mailOptions = {
      from: `"Vartika Hotel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5b3016;">Password Updated</h2>
          <p>Your password has been successfully changed.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
  };