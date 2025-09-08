import { Request, Response, NextFunction } from "express";

export const validate = (validator: (data: any) => string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validator(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    next();
  };
};