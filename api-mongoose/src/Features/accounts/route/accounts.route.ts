import * as express from "express";
        import {Response, Request} from "express";
        import { AccountsController } from "../controllers/accounts.controller";
        const Router = express.Router();

    // ----------------------------------------- USER ROUTES ---------------------------------------------------
    //
    Router.get("/",
    (req: Request, res: Response) => {
        AccountsController.data(req, res)
    }
); 


export default Router;