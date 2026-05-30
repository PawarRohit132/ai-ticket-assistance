import { User } from "../../models/user.model.js";
import { Ticket } from "../../models/ticket.model.js";
import { NonRetriableError } from "inngest";
import { inngest } from "../client.js";
import analyzeTicket from "../../utils/ai.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const onTicketCreated = inngest.createFunction(
  {
    id: "on-ticket-created",
    retries: 2,
    rateLimit : {
      limit : 5,
      period : "1m"
    },

    triggers: [
      {
        event: "ticket/created",
      },
    ],
  },

  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      const ticket = await step.run(
        "fetch-ticket",

        async () => {
          const ticketObject = await Ticket.findById(ticketId);

          if (!ticketObject) {
            throw new NonRetriableError("Ticket not found");
          }

          return ticketObject;
        },
      );

      await step.run(
        "update-ticket-status",

        async () => {
          await Ticket.findByIdAndUpdate(ticket._id, {
            status: "TODO",
          });
        },
      );

      await step.sleep("wait-before-ai", "15s");

      const relatedSkills = await step.run(
        "ai-processing",

        async () => {
          const aiResponse = await analyzeTicket(ticket);

          let skills = [];

          if (aiResponse) {
            await Ticket.findByIdAndUpdate(ticket._id, {
              priority: ["low", "medium", "high"].includes(aiResponse.priority)
                ? aiResponse.priority
                : "medium",

              helpfulNotes: aiResponse.helpfulNotes,

              status: "IN_PROGRESS",

              relatedSkills: aiResponse.relatedSkills,
            });

            skills = aiResponse.relatedSkills || [];
          }

          return skills;
        },
      );

      const moderator = await step.run(
        "assign-moderator",

        async () => {
          let user = await User.findOne({
            role: "moderator",

            skills: {
              $elemMatch: {
                $regex: relatedSkills.join("|"),
                $options: "i",
              },
            },
          });

          if (!user) {
            user = await User.findOne({
              role: "admin",
            });
          }

          await Ticket.findByIdAndUpdate(ticket._id, {
            assignedTo: user?._id || null,
          });

          return user;
        },
      );

     

      return { success: true };
    } catch (err) {
      console.log(err.message);

      return { success: false };
    }
  },
);
