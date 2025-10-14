import { validate } from "../../src/middleware/validate";
import { Request, Response, NextFunction } from "express";

describe("validate middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: { movie: { title: "Test Movie" } },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("should call next if no validation errors", () => {
    const mockValidator = jest.fn().mockReturnValue([]);

    const middleware = validate(mockValidator, false);
    middleware(req as Request, res as Response, next);

    expect(mockValidator).toHaveBeenCalledWith({ title: "Test Movie" }, false);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("should return 400 if validator returns errors", () => {
    const mockValidator = jest.fn().mockReturnValue(["Title is required"]);

    const middleware = validate(mockValidator, false);
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: ["Title is required"] });
    expect(next).not.toHaveBeenCalled();
  });
});
