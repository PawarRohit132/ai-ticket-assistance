import nodemailer from "nodemailer";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
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



// import { BrevoClient } from "@getbrevo/brevo";

// const brevo = new BrevoClient({
//   apiKey: process.env.BREVO_API_KEY,
// });

// export const sendOTPEmail = async (email, otp) => {
//   try {
//     const result = await brevo.transactionalEmails.sendTransacEmail({
//       sender: {
//         name: "AI Ticket Assistance",
//         email: process.env.BREVO_FROM_EMAIL,
//       },

//       to: [
//         {
//           email: email,
//         },
//       ],

//       subject: "Verify your email - AI Ticket Assistance",

//       htmlContent: `
//         <div style="font-family: Arial, sans-serif;">
//           <h2>Email Verification</h2>

//           <p>Your OTP is:</p>

//           <h1 style="letter-spacing: 5px;">${otp}</h1>

//           <p>This OTP will expire in 5 minutes.</p>

//           <p>Thank you for using AI Ticket Assistance.</p>
//         </div>
//       `,
//     });

//     console.log("OTP email sent:", result.messageId);

//     return result;
//   } catch (error) {
//     console.error("OTP Email Error:", error);
//     throw error;
//   }
// };
