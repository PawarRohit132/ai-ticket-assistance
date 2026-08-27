import { Ticket } from "../../models/ticket.model.js";
import { User } from "../../models/user.model.js";
import { NonRetriableError } from "inngest";
import { inngest } from "../client.js";
import { sendSolvedTicketEmail } from "../../utils/sendEmail.js";

export const onTicketSolved = inngest.createFunction(
  {
    id: "on-ticket-solved",
    retries: 2,
    rateLimit: {
      limit: 5,
      period: "1m",
    },
    triggers: [
      {
        event: "ticket/solved",
      },
    ],
  },

  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });
      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticket._id, {
          status: "SOLVED",
        });
      });
      await step.run("send-ticketSolved-notification", async () => {
        const finalTicket = await Ticket.findById(ticket._id);
        const user = await User.findById(finalTicket.createdBy);

        await sendSolvedTicketEmail(user.email, finalTicket.title);
      });
      return { success: true };
    } catch (err) {
      console.log(err.message);

      return { success: false };
    }
  },
);
