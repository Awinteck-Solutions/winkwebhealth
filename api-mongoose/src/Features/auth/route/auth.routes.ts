import * as express from "express"; 
import {Response, Request} from "express"; 
import * as multer from 'multer';
import path = require("path");
import { Roles } from "../enums/roles.enum";
import { AuthController } from "../controllers/auth.controller";
import { authentification } from "../../../middlewares/authentication.middleware";
import { Notification } from "../enums/notification.enum";
import { upload } from "../../../helpers/uploader";


const Router = express.Router();

// ----------------------------------------- USER ROUTES ---------------------------------------------------
//
// AUTH
Router.post("/signup",
    (req: Request, res: Response) => { 
        AuthController.signup(req, res)
    }
);

Router.post("/login",
    (req: Request, res: Response) => { 
        AuthController.login(req, res)
    }
);


// FORGET PASSWORD
Router.post("/forgot-password",
    // notification(Notification.FORGOT_PASSWORD),
    (req: Request, res: Response) => { 
        AuthController.forgotPassword(req,res)
    }
);

// RESET PASSWORD
Router.post("/reset-password",
    (req: Request, res: Response) => { 
        AuthController.resetPassword(req,res)
    }
);

Router.get("/reset-password/:token",
    (req: Request, res: Response) => { 
        AuthController.validateResetToken(req,res)
    }
);

export default Router;