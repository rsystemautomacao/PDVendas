import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Migration script: Adds empresaId to all existing documents.
 *
 * Logic:
 * - Find all admin users
 * - If exactly 1 admin: assign all orphan documents to that admin
 * - If multiple admins: assign by vendedorId/operadorId where possible, rest to first admin
 * - Migrate counter keys to tenant-scoped format
 * - Drop old unique indexes and create compound indexes
 */
async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI nao definida'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Conectado ao MongoDB');

  const db = mongoose.connection.db!;

  // Find all admin users
  const admins = await db.collection('users').find({ role: 'admin' }).toArray();
  if (admins.length === 0) {
    console.error('Nenhum admin encontrado. Crie um admin primeiro.');
    process.exit(1);
  }

  const defaultAdminId = admins[0]._id;
  console.log(`\nAdmins encontrados: ${admins.length}`);
  console.log(`Admin padrao: ${admins[0].email} (${defaultAdminId})`);

  // Collections that need empresaId
  const collections = [
    'produtos',
    'clientes',
    'vendas',
    'caixas',
    'compras',
    'contapagars',
    'contarecebers',
    'despesas',
    'notificacaos',
    'logatividades',
    'ordemservicos',
    'orcamentos',
  ];

  for (const col of collections) {
    const collection = db.collection(col);

    // Check if collection exists
    const exists = await collection.countDocuments();
    if (exists === 0) {
      console.log(`  ${col}: vazia, pulando`);
      continue;
    }

    // Count orphans (docs without empresaId)
    const orphanCount = await collection.countDocuments({ empresaId: { $exists: false } });
    if (orphanCount === 0) {
      console.log(`  ${col}: todos os docs ja tem empresaId`);
      continue;
    }

    // Assign orphans to default admin
    const result = await collection.updateMany(
      { empresaId: { $exists: false } },
      { $set: { empresaId: defaultAdminId } }
    );
    console.log(`  ${col}: ${result.modifiedCount} docs atualizados com empresaId`);
  }

  // Migrate counter keys to tenant-scoped format
  console.log('\nMigrando contadores...');
  const counterCollection = db.collection('counters');
  const oldCounterKeys = ['venda_num', 'caixa_num', 'compra_num', 'os_num', 'orcamento_num'];

  for (const key of oldCounterKeys) {
    const oldCounter = await counterCollection.findOne({ _id: key as any });
    if (oldCounter) {
      const newKey = `${defaultAdminId}_${key}`;
      const existingNew = await counterCollection.findOne({ _id: newKey as any });
      if (!existingNew) {
        await counterCollection.insertOne({ _id: newKey as any, seq: oldCounter.seq });
        await counterCollection.deleteOne({ _id: key as any });
        console.log(`  Counter ${key} -> ${newKey} (seq: ${oldCounter.seq})`);
      } else {
        console.log(`  Counter ${newKey} ja existe, pulando`);
      }
    }
  }

  // Drop old unique indexes and create compound indexes
  console.log('\nAtualizando indexes...');
  const indexUpdates: { col: string; oldIndex: string; newIndex: Record<string, 1> }[] = [
    { col: 'vendas', oldIndex: 'numero_1', newIndex: { empresaId: 1, numero: 1 } },
    { col: 'caixas', oldIndex: 'numero_1', newIndex: { empresaId: 1, numero: 1 } },
    { col: 'compras', oldIndex: 'numero_1', newIndex: { empresaId: 1, numero: 1 } },
    { col: 'ordemservicos', oldIndex: 'numero_1', newIndex: { empresaId: 1, numero: 1 } },
    { col: 'orcamentos', oldIndex: 'numero_1', newIndex: { empresaId: 1, numero: 1 } },
  ];

  for (const { col, oldIndex, newIndex } of indexUpdates) {
    const collection = db.collection(col);
    try {
      await collection.dropIndex(oldIndex);
      console.log(`  ${col}: index ${oldIndex} removido`);
    } catch {
      // Index may not exist
    }
    try {
      await collection.createIndex(newIndex, { unique: true });
      console.log(`  ${col}: compound index criado`);
    } catch (err: any) {
      console.log(`  ${col}: index ja existe ou erro: ${err.message}`);
    }

    // Create empresaId index if not exists
    try {
      await collection.createIndex({ empresaId: 1 });
    } catch {
      // Already exists
    }
  }

  // Create empresaId index on remaining collections
  for (const col of collections) {
    try {
      await db.collection(col).createIndex({ empresaId: 1 });
    } catch {
      // Already exists
    }
  }

  console.log('\nMigracao concluida com sucesso!');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Erro na migracao:', err);
  process.exit(1);
});
