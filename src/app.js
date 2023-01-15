import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Joi from "joi";
import { MongoClient } from "mongodb";

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
    name: Joi.string().min(1).required(),
    lastStatus: Joi.number().required()
})

const messageJoi = Joi.object({
    from: Joi.string().min(1).required(),
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.string().min(1).required(),
})
const participants= db.collection("participants");
const messages = db.collection("messages");

const port = 5000;


app.listen(port, ()=> console.log(`Server running on port: ${port}`));