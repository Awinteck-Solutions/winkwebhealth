import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    currentUser?: {
      id?: string;
      _id?: string;
      email?: string;
      firstname?: string;
      lastname?: string;
      role?: string;
    };
    workspaceOwnerId?: string;
    teamRole?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  }
}
