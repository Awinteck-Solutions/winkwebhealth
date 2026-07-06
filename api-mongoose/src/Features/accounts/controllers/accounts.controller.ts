import { Request, Response } from "express";
     import Accounts from "../schema/accounts.schema";

        export class AccountsController {

            static async data(req: Request, res: Response) {
                try{
                  let response = await Accounts.find()

                  return res.status(200).json({
                    success: true,
                    message: "Accounts successful response",
                    response
                  });
                }catch(e){
                  return res.status(500).json({
                      success: false,
                      message: "System error"
                  });
                }
            }

        }