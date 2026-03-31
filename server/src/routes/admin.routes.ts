import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superadmin';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { asyncHandler } from '../middleware/asyncHandler';
import mongoose from 'mongoose';

const router = Router();

// All admin routes require authentication + superadmin check
router.use(authenticate, requireSuperAdmin);

// GET /admin/verify
router.get('/verify', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { superadmin: true } });
}));

// GET /admin/stats
router.get('/stats', asyncHandler(async (_req, res) => {
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ ativo: true });
  const inactiveUsers = await User.countDocuments({ ativo: false });
  const totalActiveSessions = await Session.countDocuments({ isValid: true });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRegistrations = await User.aggregate([
    { $match: { role: 'admin', criadoEm: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$criadoEm' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: { totalAdmins, totalUsers, activeUsers, inactiveUsers, totalActiveSessions, monthlyRegistrations },
  });
}));

// GET /admin/tenants
router.get('/tenants', asyncHandler(async (_req, res) => {
  const admins = await User.find({ role: 'admin' })
    .select('nome email empresa ativo criadoEm ultimoLogin maxLicencas')
    .sort({ criadoEm: -1 })
    .lean();

  const tenantsWithCounts = await Promise.all(
    admins.map(async (admin) => {
      const subUserCount = await User.countDocuments({ adminId: admin._id });
      const activeSessions = await Session.countDocuments({ empresaId: admin._id.toString(), isValid: true });
      return {
        ...admin,
        _id: admin._id.toString(),
        subUserCount,
        activeSessions,
        maxLicencas: (admin as any).maxLicencas || 1,
      };
    })
  );

  res.json({ success: true, data: tenantsWithCounts });
}));

// GET /admin/tenants/:id
router.get('/tenants/:id', asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id)
    .select('nome email empresa ativo criadoEm ultimoLogin permissoes maxLicencas')
    .lean();

  if (!admin) return res.status(404).json({ success: false, error: 'Tenant não encontrado' });

  const subUsers = await User.find({ adminId: req.params.id })
    .select('nome email role ativo criadoEm ultimoLogin')
    .lean();

  const sessions = await Session.find({ empresaId: req.params.id, isValid: true })
    .sort({ criadoEm: -1 })
    .lean();

  // Map sessions with user info
  const sessionUsers = await User.find({
    _id: { $in: sessions.map(s => s.userId) }
  }).select('nome email').lean();

  const userMap = new Map(sessionUsers.map(u => [u._id.toString(), u]));

  const activeSessions = sessions.map(s => ({
    _id: s._id.toString(),
    userId: s.userId.toString(),
    userName: userMap.get(s.userId.toString())?.nome || '—',
    userEmail: userMap.get(s.userId.toString())?.email || '—',
    deviceInfo: s.deviceInfo,
    ipAddress: s.ipAddress,
    criadoEm: s.criadoEm,
  }));

  res.json({
    success: true,
    data: {
      ...admin,
      _id: admin._id.toString(),
      maxLicencas: (admin as any).maxLicencas || 1,
      activeSessions,
      subUsers: subUsers.map(u => ({ ...u, _id: u._id.toString() })),
    },
  });
}));

// PATCH /admin/tenants/:id/toggle
router.patch('/tenants/:id/toggle', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'Tenant não encontrado' });

  user.ativo = !user.ativo;
  await user.save();
  await User.updateMany({ adminId: req.params.id }, { ativo: user.ativo });

  // If deactivating, invalidate all sessions
  if (!user.ativo) {
    await Session.updateMany(
      { empresaId: req.params.id, isValid: true },
      { isValid: false, invalidatedReason: 'admin_blocked', invalidatedAt: new Date() }
    );
  }

  res.json({ success: true, data: { ativo: user.ativo } });
}));

// PATCH /admin/tenants/:id/licenses
router.patch('/tenants/:id/licenses', asyncHandler(async (req, res) => {
  const { maxLicencas } = req.body;
  if (!maxLicencas || maxLicencas < 1) {
    return res.status(400).json({ success: false, error: 'maxLicencas deve ser >= 1' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'Tenant não encontrado' });

  (user as any).maxLicencas = maxLicencas;
  await user.save();

  res.json({ success: true, data: { maxLicencas } });
}));

// PATCH /admin/tenants/:id/reset-password
router.patch('/tenants/:id/reset-password', asyncHandler(async (req, res) => {
  const { novaSenha } = req.body;
  if (!novaSenha || novaSenha.length < 6) {
    return res.status(400).json({ success: false, error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  const user = await User.findById(req.params.id).select('+senha');
  if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

  user.senha = novaSenha;
  await user.save();

  res.json({ success: true, data: { message: 'Senha alterada com sucesso' } });
}));

// DELETE /admin/tenants/:id
router.delete('/tenants/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'Tenant não encontrado' });

  const empresaId = req.params.id;

  // Invalidate all sessions
  await Session.updateMany(
    { empresaId, isValid: true },
    { isValid: false, invalidatedReason: 'admin_deleted', invalidatedAt: new Date() }
  );

  // Delete all sub-users
  await User.deleteMany({ adminId: empresaId });

  // Delete business data from all collections
  const db = mongoose.connection.db;
  if (db) {
    const collections = ['produtos', 'clientes', 'vendas', 'caixas', 'compras',
      'contaspagars', 'contasrecebers', 'despesas', 'notificacaos',
      'ordensservicos', 'orcamentos'];
    for (const col of collections) {
      try {
        await db.collection(col).deleteMany({ empresaId });
      } catch {
        // Collection may not exist yet
      }
    }
  }

  // Delete the admin user
  await User.findByIdAndDelete(empresaId);

  res.json({ success: true, data: { message: 'Tenant e todos os dados excluídos' } });
}));

// POST /admin/sessions/:id/kick
router.post('/sessions/:id/kick', asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Sessão não encontrada' });

  session.isValid = false;
  session.invalidatedReason = 'admin_kicked';
  session.invalidatedAt = new Date();
  await session.save();

  res.json({ success: true, data: { message: 'Sessão encerrada' } });
}));

export default router;
