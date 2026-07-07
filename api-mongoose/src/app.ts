
import { Express, Request, Response } from "express"
import * as express from 'express';
import * as bodyParser from "body-parser";
import { Router } from "./routes/all.routes";
import "reflect-metadata";
import * as dotenv from 'dotenv';
import { errorHandler } from "./middlewares/errorHandler.middleware";
import * as cors from 'cors';
import path = require("path");
import connectToDatabase from "./database/data-source";
import billingWebhookRoutes from "./Features/billing/route/billing.webhook.route";
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json"); 


dotenv.config();
const app = express();
app.use(cors())

// Stripe webhook needs raw body — mount before json parser
app.use("/billing", billingWebhookRoutes);

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(Router)


app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req: Request, res: Response) => { 
    res.json({
        message: 'Welcome to WinkWebHealth API'
    })
})

app.use(errorHandler)

const port = Number(process.env.PORT) || 4545;

connectToDatabase().then(() => { 
    app.listen(port, '0.0.0.0', ()=> console.log(`Server running on port ${port}`))
}).catch((error) => {
    console.log('error :>> ', error);
})
