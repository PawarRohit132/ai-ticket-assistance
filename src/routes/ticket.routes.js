import express from "express"
import {verifyJWT} from "../middlwares/auth.middlerware.js"
import {createTicket, getTickets, getTicket, ticketSolved, searchTicket} from "../controllers/ticket.controller.js"

const router = express.Router()

router.get("/", verifyJWT, getTickets)
router.post("/ticketCreated", verifyJWT, createTicket)
router.get("/ticketSearch", verifyJWT, searchTicket);
router.get("/:id", verifyJWT, getTicket)
router.put("/ticketSolved/:id", verifyJWT, ticketSolved)

export default router