import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Verify your email - AI Ticket Assistance",
      html: `
            <h2>Email Verification</h2>

            <p>Your OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP will expire in 5 minutes.</p>

            <p>Thank you for using AI Ticket Assistance.</p>
        `,
    });
  } catch (error) {
    console.error("OTP Email Error:", error);
    throw error;
  }
};
