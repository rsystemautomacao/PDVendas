import mongoose, { Schema } from 'mongoose';

const sessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  empresaId: { type: String, required: true, index: true },
  tokenJti: { type: String, required: true, unique: true, index: true },
  deviceInfo: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  isValid: { type: Boolean, default: true },
  invalidatedReason: { type: String, enum: ['logout', 'license_exceeded', 'admin_blocked', 'admin_kicked', 'admin_deleted', 'inactivity', null], default: null },
  invalidatedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
  lastActivity: { type: Date, default: Date.now, index: true },
  criadoEm: { type: Date, default: Date.now },
});

// TTL index - MongoDB auto-deletes expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ empresaId: 1, isValid: 1 });
sessionSchema.index({ userId: 1, isValid: 1 });

export const Session = mongoose.model('Session', sessionSchema);
