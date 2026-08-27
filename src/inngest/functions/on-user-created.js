import { inngest } from "../client.js";
import { User } from "../../models/user.model.js";
import { NonRetriableError } from "inngest";
import { sendWelcomeEmail } from "../../utils/sendEmail.js";

export const onUserCreated = inngest.createFunction(
  {
    id: "on-user-created",
    retries: 2,
    rateLimit: {
      limit: 5,
      period: "1m",
    },
    triggers: [
      {
        event: "user/created",
      },
    ],
  },

  async ({ event, step }) => {
    try {
      const {email} = event.data;

      const user = await step.run("fetch-user", async () => {
        const userObject = await User.findOne({email});
        if (!userObject) {
          throw new NonRetriableError("user not found");
        }
        return userObject;
      });

      const sendEmail = await step.run("welcome-email-send", async () => {
        
        await sendWelcomeEmail(email);
      });
      return { success: true };
    } catch (error) {
      console.error("❌ Error running step", error.message);
      return { success: false };
    }
  },
);
