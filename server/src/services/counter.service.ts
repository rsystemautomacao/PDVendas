import { Counter } from '../models/Counter';

export async function getNextSequence(name: string, empresaId?: string): Promise<number> {
  const key = empresaId ? `${empresaId}_${name}` : name;
  const counter = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter!.seq;
}
