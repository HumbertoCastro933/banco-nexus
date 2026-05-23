const { MongoClient } = require('mongodb');

async function ejecutarMigracion() {
  const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('banco_nexus');
    const collection = db.collection('transacciones');

    const filtro = { sucursal: { $exists: false } };
    const actualizacion = { $set: { sucursal: 'Sede Central' } };

    const resultado = await collection.updateMany(filtro, actualizacion);

    console.log(`Documentos modificados: ${resultado.modifiedCount}`);
  } catch (error) {
    console.error('Error en la migración:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Conexión cerrada.');
  }
}

ejecutarMigracion().catch(console.error);