import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  getKPIs: asyncHandler(async (req: Request, res: Response) => {
    const kpis = await dashboardService.getKPIs();
    res.json({ success: true, data: kpis });
  }),
};
