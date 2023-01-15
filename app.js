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
    db = mongoClient.db();

} catch (err){
    console.log(err);
}

const participantsCollection = db.collection("participants");
const messagesCollection = db.collection("messages");

const port = 5000;


app.listen(port, ()=> console.log(`Server running on port: ${port}`));