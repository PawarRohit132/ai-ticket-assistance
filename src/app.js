import express from "express"
import cors from "cors"
import {serve} from "inngest/express"
import {inngest}  from "./inngest/client.js"
import {onTicketCreated} from "./inngest/functions/on-ticket-created.js"
import {onTicketSolved} from "./inngest/functions/on-ticket-solved.js"
import cookieParser from "cookie-parser";



const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));

app.use(express.json());
app.use(cookieParser());

app.use(express.json({limit : '16kb'}))

import userRouter from "../src/routes/user.routes.js"
import ticketRouter from "../src/routes/ticket.routes.js"

app.use("/api/v1/users", userRouter )
app.use("/api/v1/tickets", ticketRouter)
app.use("/api/v1/inngest", serve({
    client : inngest,
    functions : [onTicketCreated, onTicketSolved]
}))


export {app}