import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Joi from "joi";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";

//Start

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());


//MongoDB
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try{
    await mongoClient.connect();
    console.log("MongoClient connected sucessfully")

} catch (err){
    console.log(err);
}
db = mongoClient.db();

const participantJoi = Joi.object({
    name: Joi.string().min(1).required()
})

const messageJoi = Joi.object({
    from: Joi.string().min(1).required(),
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.string().min(1).required(),
})
const participants = db.collection("participants");
const messages = db.collection("messages");

const port = 5000;


app.post("/participants", async (req,res)=>{
    const { name } = req.body;
    try{
        const CheckParticipant = await participants.findOne({name});

        if(CheckParticipant){
            res.status(409).send({message:"User already exists"});
            return;
        }
        const participantValidation = participantJoi.validate({name}, {abortEarly: false});

        if (participantValidation.error){
            const validationError = participantValidation.error.details.map(
                (err) => err.message
            );
            return res.status(400).send(validationError)
        }

        await participants.insertOne({ name, lastStatus: Date.now() });

        const CurrentTimeFormatted = dayjs().format("HH:mm:ss");

        await messages.insertOne({from: name, to: "Todos", text: "entra na sala...", type: "status", time: CurrentTimeFormatted});
        res.sendStatus(201);
    } catch (err){
        console.log(err);

    }
})


app.listen(port, ()=> console.log(`Server running on port: ${port}`));