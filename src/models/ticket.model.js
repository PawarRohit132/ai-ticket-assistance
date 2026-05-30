import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    title : String,
    description : String,
    status : {
        type : String,
        default : "TODO"
    },
    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        default : "null"
    },
    assignedTo: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        default : null 
    },
    priority : String,
    deadline : String,
    helpfulNotes : String,
    relatedSkills : [String],
    createdAt : {type : Date, default : Date.now}
})

export const Ticket = mongoose.model("Ticket", ticketSchema);