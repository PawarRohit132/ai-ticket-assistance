import express from "express"
import {verifyJWT} from "../middlwares/auth.middlerware.js"
import {createTicket, getTickets, getTicket, ticketSolved} from "../controllers/ticket.controller.js"

const router = express.Router()

router.post("/ticketCreated", verifyJWT, createTicket)
router.get("/", verifyJWT, getTickets)
router.get("/:id", verifyJWT, getTicket)
router.put("/ticketSolved/:id", verifyJWT, ticketSolved)

export default router