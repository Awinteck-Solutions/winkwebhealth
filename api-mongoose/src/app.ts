
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


import { processRenewalInvoices, processExpiredSubscriptions } from "./helpers/billingService";

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
const host = process.env.BIND_HOST || "0.0.0.0";

connectToDatabase().then(() => { 
    app.listen(port, host, ()=> console.log(`Server running on ${host}:${port}`))

    const runBillingRenewals = () =>
      processRenewalInvoices()
        .then((n) => { if (n > 0) console.log(`Billing: created ${n} renewal invoice(s)`); })
        .catch((err) => console.error("Billing renewal error:", err));

    const runExpiredSubscriptions = () =>
      processExpiredSubscriptions()
        .then((n) => { if (n > 0) console.log(`Billing: expired ${n} cancelled subscription(s)`); })
        .catch((err) => console.error("Billing expiry error:", err));

    const runBillingJobs = () => {
      runBillingRenewals();
      runExpiredSubscriptions();
    };

    setTimeout(runBillingJobs, 30_000);
    setInterval(runBillingJobs, 6 * 60 * 60 * 1000);
}).catch((error) => {
    console.log('error :>> ', error);
})
