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
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.string().min(1).required().valid("message", "private_message")
})
const participants = db.collection("participants");
const messages = db.collection("messages");

//GET and POST 

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
            res.status(422).send(validationError);
            return;
        }

        await participants.insertOne({ name, lastStatus: Date.now() });

        const CurrentTimeFormatted = dayjs().format("HH:mm:ss");

        await messages.insertOne({from: name, to: "Todos", text: "entra na sala...", type: "status", time: CurrentTimeFormatted});
        res.sendStatus(201);
    } catch (err){
        console.log(err);
        res.sendStatus(500);
    }
})


app.get("/participants",async(req,res)=>{
    try{
        const RenderParticipants = await participants.find({}).toArray();
        res.send(RenderParticipants);
    } catch (err){
        console.log(err);
        res.sendStatus(400);
    }
})

app.post("/messages", async(req, res)=>{
    const { to, text, type } = req.body;
    const { user } = req.headers;
    try {
        const userLogged = await participants.findOne({name: user})
        if (!userLogged){
            res.status(422).send({message: "User is not logged in"});
            return;
        }

        const messageValidation = messageJoi.validate({to, text, type}, {abortEarly: false});
        if (messageValidation.error){
            const msgValidationError = messageValidation.error.details.map((err)=>err.message);
            res.status(422).send(msgValidationError);
            return;
        }
        const CurrentTimeFormatted = dayjs().format("HH:mm:ss");
        await messages.insertOne({
            from: user,
            to,
            text,
            type,
            time: CurrentTimeFormatted
        });
        res.status(201).send({message:"OK"});
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.get("/messages", async (req, res)=>{
    const limit = Number(req.query.limit);
    const { user } = req.headers;
    try{
        const userMessages = await messages.find({$or:[{from: user}, {to: {$in: [user,"Todos"]}},{type:"message"}]}).limit(limit).toArray();
        if (userMessages.length===0){
            res.status(404).send("Can't find any messages");
        }
        res.status(200).send(userMessages)
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

app.post("/status", async (req,res)=>{
    const user = req.headers;
    try{
        const userConnected= await participants.findOne({ name: user })
        if(!userConnected){
            res.status(404).send({message:"User not Found"});
            return;
        }
        await participants.updateOne({name: user},{ $set: {lastStatus: Date.now()}});
        res.sendStatus(200)
    } catch (err) { 
        console.log(err)
        res.sendStatus(500);
    }
});

setInterval(async ()=>{
    const CurrentTimeFormatted = dayjs().format("HH:mm:ss");
    const CheckUserInactive= Date.now() - 10000;
    try{
        const FilteredUsers = await participants.find({ lastStatus: {$lt: CheckUserInactive}}).toArray();

        if(FilteredUsers.length>0){
            FilteredUsers.map(async(u)=> {
                const ExitMessage = {
                    from: u.name,
                    to: "Todos",
                    text: "sai da sala...",
                    type: "status",
                    time: CurrentTimeFormatted
                }
                await messages.insertOne(ExitMessage);
                await participants.deleteOne({name: u.name})
                
            })
        }


    } catch (error){
        console.log(error);
        res.sendStatus(500);
    }
},15000);

const port = 5000;

app.listen(port, ()=> console.log(`Server running on port: ${port}`));