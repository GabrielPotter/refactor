import { Router } from "express";

import { CommandInterpreter } from "../services/CommandInterpreter";

export const createConsoleRouter = (): Router => {
    const router = Router();

    router.post("/", async (req, res) => {
        const { command } = req.body ?? {};

        if (typeof command !== "string" || command.trim().length === 0) {
            res.status(400).json({ status: "error", message: "The command field must be a non-empty string." });
            return;
        }

        const logs: string[] = [];
        const logHandler = (entry: string) => {
            logs.push(entry);
        };

        try {
            const result = await CommandInterpreter.getInstance().executeScripts(command, logHandler);
            res.status(200).json({ status: "ok", logs, result });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            res.status(400).json({ status: "error", message, logs, result: [] });
        }
    });

    return router;
};
