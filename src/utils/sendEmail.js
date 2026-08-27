import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

export const sendOTPEmail = async (email, otp) => {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "AI Ticket Assistance",
        email: process.env.BREVO_FROM_EMAIL,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: "Verify your email - AI Ticket Assistance",

      htmlContent: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Email Verification</h2>

          <p>Your OTP is:</p>

          <h1 style="letter-spacing: 5px;">${otp}</h1>

          <p>This OTP will expire in 5 minutes.</p>

          <p>Thank you for using AI Ticket Assistance.</p>
        </div>
      `,
    });

    console.log("OTP email sent:", result.messageId);

    return result;
  } catch (error) {
    console.error("OTP Email Error:", error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email) => {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "AI Ticket Assistance",
        email: process.env.BREVO_FROM_EMAIL,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: `welcome to ai-ticket-assistance`,

      htmlContent :`Hi,
                \n\n
                Thanks for signing up. We're glad to have you onboard!
                `
      
      
    }
    
  );

    console.log("Welcome email sent:", result.messageId);

    return result;
  } catch (error) {
    console.error("OTP Email Error:", error);
    throw error;
  }
};

export const sendAssignEmail = async (email, title) => {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "AI Ticket Assistance",
        email: process.env.BREVO_FROM_EMAIL,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: `You have assign new ticket`,

      htmlContent :`Hi ${email},
                \n\n
                A new ticket is assigned to you ${title}
                Thank You !
                `
      
      
    }
    
  );

    console.log("Assingment email sent:", result.messageId);

    return result;
  } catch (error) {
    console.error("Assingment Email Error:", error);
    throw error;
  }
}

export const sendSolvedTicketEmail = async (email, title) => {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "AI Ticket Assistance",
        email: process.env.BREVO_FROM_EMAIL,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: `Your Ticket is Solved`,

      htmlContent :`Hi ${email},
                \n\n
                ${title} Your ticket solved successfully
                Thank You !
                `
      
      
    }
    
  );

    console.log("Solved email sent:", result.messageId);

    return result;
  } catch (error) {
    console.error("Solved Email Error:", error);
    throw error;
  }
}
