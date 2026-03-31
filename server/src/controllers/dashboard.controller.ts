import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  getKPIs: asyncHandler(async (req: Request, res: Response) => {
    const empresaId = req.user!.empresaId;
    const kpis = await dashboardService.getKPIs(empresaId);
    res.json({ success: true, data: kpis });
  }),
};
