import { Router, type NextFunction, type Request, type Response } from "express";

import type { Database } from "../db/client";
import { DevSchema } from "../db/schema";

type Operation = "createAll" | "dropAll" | "resetAll";

const OPERATION_TO_PATH: Record<Operation, string> = {
  resetAll: "reset",
  dropAll: "drop",
  createAll: "create",
};

const respond = (res: Response, operation: Operation) => {
  const action = OPERATION_TO_PATH[operation];
  res.status(200).json({ status: "ok", action });
};

const runOperation = (operation: Operation, db: Database) => {
  switch (operation) {
    case "resetAll":
      return DevSchema.resetAll(db);
    case "dropAll":
      return DevSchema.dropAll(db);
    case "createAll":
      return DevSchema.createAll(db);
    default: {
      const exhaustiveCheck: never = operation;
      throw new Error(`Unsupported operation: ${exhaustiveCheck}`);
    }
  }
};

export const createDevSchemaRouter = (db: Database): Router => {
  const router = Router();

  const operations: Operation[] = ["resetAll", "dropAll", "createAll"];

  for (const operation of operations) {
    const pathSegment = OPERATION_TO_PATH[operation];
    router.post(`/${pathSegment}`, async (req: Request, res: Response, next: NextFunction) => {
      try {
        await runOperation(operation, db);
        respond(res, operation);
      } catch (error) {
        next(error);
      }
    });
  }

  return router;
};
