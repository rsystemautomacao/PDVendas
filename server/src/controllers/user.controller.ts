import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { userService } from '../services/user.service';

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.list(req.user!._id);
    res.json({ success: true, data: users });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.user!._id, req.params.id as string);
    res.json({ success: true, data: user });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create(req.user!._id, req.body);
    res.status(201).json({ success: true, data: user });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(req.user!._id, req.params.id as string, req.body);
    res.json({ success: true, data: user });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.remove(req.user!._id, req.params.id as string);
    res.json({ success: true, data: result });
  }),
};
