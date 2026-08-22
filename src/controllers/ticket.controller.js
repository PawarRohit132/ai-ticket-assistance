import { inngest } from "../inngest/client.js";
import { Ticket } from "../models/ticket.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      throw new ApiError(401, "tittle and description are required");
    }

    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

    await inngest.send({
      name: "ticket/created",
      data: {
        ticketId: newTicket._id.toString(),
        title,
        description,
        createdBy: req.user._id.toString(),
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          newTicket,
          "Ticket created and processing started",
        ),
      );
  } catch (error) {
    // throw new ApiError(500, {}, "interal server error while creating ticket");
    console.log("CREATE TICKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTickets = async (req, res) => {
  try {
    const user = req.user;

    let tickets = [];
    if (user.role === "admin") {
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .populate("createdBy", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else if (user.role == "moderator") {
      tickets = await Ticket.find({ assignedTo: user._id })
        .populate("assignedTo", ["email", "_id"])
        .populate("createdBy", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ createdBy: user._id })
        .populate("createdBy", ["email", "_id"])
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tickets, "All tickets fetched successfully"));
  } catch (error) {
    throw new ApiError(500, {}, "interal server error while get all tickets");
  }
};

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.role !== "user") {
      ticket = await Ticket.findById(req.params.id)
        .populate("assignedTo", ["email", "_id"])
        .populate("createdBy", ["email", "_id"]);
    } else {
      ticket = await Ticket.findOne({
        createdBy: user._id,
        _id: req.params.id,
      })
        .select("title description status createdAt")
        .populate("assignedTo", ["email", "_id"]);
    }
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }
    return res.status(200).json(new ApiResponse(200, { ticket }));
  } catch (error) {
    throw new ApiError(500, "interal server error while get all tickets");
  }
};

export const ticketSolved = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await inngest.send({
      name: "ticket/solved",
      data: {
        ticketId: ticket._id.toString(),
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, ticket, "Your ticket is solved"));
  } catch (error) {
    throw new ApiError(500, "interal server error while creating ticket");
  }
};

export const searchTicket = async (req, res) => {
  try {
    const { search } = req.query;
    const user = req.user;
    let tickets = [];

    if (user.role === "admin") {
      tickets = await Ticket.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { priority: { $regex: search, $options: "i" } },
        ],
      });
    } else if (user.role === "moderator") {
      tickets = await Ticket.find({
        assignedTo: user._id,
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { priority: { $regex: search, $options: "i" } },
        ],
      });
    } else {
      tickets = await Ticket.find({
        createdBy: user._id,
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { priority: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (!tickets) {
      return res.status(400).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json(new ApiResponse(200, tickets, ""));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
