import * as express from "express"; 
import {Response, Request} from "express"; 
import { UserController } from "../controllers/user.controller";
import { Roles } from "../enums/roles.enum";
import multer from "multer";
import { authentification } from "../../../middlewares/authentication.middleware";
import { authorization } from "../../../middlewares/authorization.middleware";

interface MulterRequest extends Request {
  file: multer.File;
}

const Router = express.Router();
 
Router.delete("/delete-user/:id",
    authentification,
    (req: Request, res: Response) => { 
        UserController.deleteUser(req,res)
    }
);

Router.get("/", 
    authentification,
    authorization([Roles.ADMIN, Roles.HR, Roles.PAYROLL, Roles.PROJECTS]),
    (req: Request, res: Response) => { 
        UserController.getAllUsers(req, res)
    }
);

Router.get("/profile",
    authentification,
    (req: Request, res: Response) => { 
       UserController.profile(req,res)
    }
);

Router.get("/:id", 
    (req: Request, res: Response) => { 
        UserController.getOneUser(req, res)
    }
);

Router.patch("/update-user/:id",
    authentification,
    (req: MulterRequest, res: Response) => { 
        UserController.updateUser(req,res)
    }
);

Router.patch("/update-user",
    authentification,
    (req: MulterRequest, res: Response) => { 
       UserController.updateUser(req,res)
    }
);

Router.patch("/change-password",
    authentification,
    (req: Request, res: Response) => { 
       UserController.changePassword(req,res)
    }
);

export default Router;
