import { Ticket } from "../../models/ticket.model.js";
import { NonRetriableError } from "inngest";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { inngest } from "../client.js";

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
        return ticketObject
      });
      await step.run(
        'update-ticket-status',
        async() => {
            await Ticket.findByIdAndUpdate(ticket._id,
                {
                    status : "SOLVED"
                }
            )
        }
      )
      return {success : true}
    } catch (err) {
        console.log(err.message);

      return { success: false };
    }
  },
);
