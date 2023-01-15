import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Joi from "joi";
import { MongoClient } from "mongodb";

//Start

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();


//MongoDB


const port = 5000;


app.listen(port, ()=> console.log(`Server running on port: ${port}`));