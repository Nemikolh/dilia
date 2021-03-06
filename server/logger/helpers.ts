import {RequestHandler} from 'express';
import {info as winfo} from 'winston';

export function logRequest(message: string): RequestHandler {
    return (req, _res, next) => {
        winfo(`User: ${req.user && req.user.username} ${message}`);
        next();
    };
}
