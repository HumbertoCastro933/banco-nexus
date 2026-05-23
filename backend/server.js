// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;
// URI del Replica Set con 3 nodos y nombre del replica set "rsBanco"
const MONGO_URI = 'mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco';
const DB_NAME = 'banco_nexus';

// Middlewares
app.use(cors());           // Permite peticiones desde cualquier origen
app.use(express.json());   // Parseo de JSON en caso de futuros endpoints POST

// Variable para almacenar la referencia a la base de datos una vez conectado
let db;

// Conexión a MongoDB e inicialización del servidor
async function iniciarServidor() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Conectado a MongoDB (Replica Set rsBanco)');
    db = client.db(DB_NAME);

    // --------------------------------------------------
    // Endpoint: GET /api/cuenta/:cuenta
    // Devuelve la información completa de una cuenta:
    //   - Nombre del cliente
    //   - Número de cuenta
    //   - Saldo actual
    //   - Historial de transacciones
    // --------------------------------------------------
    app.get('/api/cuenta/:cuenta', async (req, res) => {
      try {
        const numeroCuenta = req.params.cuenta;

        // 1. Buscar la cuenta por número
        const cuenta = await db.collection('cuentas').findOne({ numeroCuenta });

        if (!cuenta) {
          return res.status(404).json({ error: 'Cuenta no encontrada' });
        }

        // 2. Buscar el cliente asociado por CURP (llave natural)
        const cliente = await db.collection('clientes').findOne({ curp: cuenta.clienteCURP });

        if (!cliente) {
          return res.status(500).json({ error: 'Cliente asociado no encontrado (inconsistencia de datos)' });
        }

        // 3. Obtener el historial de transacciones de la cuenta
        const transacciones = await db
          .collection('transacciones')
          .find({ cuentaId: cuenta._id })
          .sort({ fecha: -1 }) // más recientes primero
          .toArray();

        // 4. Construir y enviar la respuesta
        const respuesta = {
          nombreCliente: cliente.nombre,
          numeroCuenta: cuenta.numeroCuenta,
          saldo: cuenta.saldo,
          transacciones
        };

        res.json(respuesta);
      } catch (error) {
        console.error('Error al obtener cuenta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    });

    // --------------------------------------------------
    // Endpoint: POST /api/deposito
    // Realiza un depósito en la cuenta especificada
    // --------------------------------------------------
    app.post('/api/deposito', async (req, res) => {
      try {
        const { numeroCuenta, cantidad } = req.body;
        const sucursal = req.body.sucursal || 'Sucursal Web';

        // Validaciones básicas
        if (!numeroCuenta || cantidad === undefined) {
          return res.status(400).json({ error: 'Faltan numeroCuenta o cantidad' });
        }

        const monto = Number(cantidad);
        if (isNaN(monto) || monto <= 0) {
          return res.status(400).json({ error: 'La cantidad debe ser un número positivo' });
        }

        const cuenta = await db.collection('cuentas').findOne({ numeroCuenta });
        if (!cuenta) {
          return res.status(404).json({ error: 'Cuenta no encontrada' });
        }

        // Actualizar saldo con $inc (sumar)
        await db.collection('cuentas').updateOne(
          { _id: cuenta._id },
          { $inc: { saldo: monto } }
        );

        // Insertar transacción
        await db.collection('transacciones').insertOne({
          cuentaId: cuenta._id,
          tipo: 'depósito',
          monto,
          fecha: new Date(),
          descripcion: `Depósito en ${sucursal}`,
          sucursal
        });

        res.json({ mensaje: 'Depósito realizado con éxito' });
      } catch (error) {
        console.error('Error en depósito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    });

    // --------------------------------------------------
    // Endpoint: POST /api/retiro
    // Realiza un retiro atómico para evitar condiciones de carrera
    // --------------------------------------------------
    app.post('/api/retiro', async (req, res) => {
      try {
        const { numeroCuenta, cantidad } = req.body;
        const sucursal = req.body.sucursal || 'Sucursal Web';

        if (!numeroCuenta || cantidad === undefined) {
          return res.status(400).json({ error: 'Faltan numeroCuenta o cantidad' });
        }

        const monto = Number(cantidad);
        if (isNaN(monto) || monto <= 0) {
          return res.status(400).json({ error: 'La cantidad debe ser un número positivo' });
        }

        // Operación atómica: actualizar solo si saldo >= monto
        const resultado = await db.collection('cuentas').updateOne(
          { numeroCuenta, saldo: { $gte: monto } },
          { $inc: { saldo: -monto } }
        );

        // Si no se modificó ningún documento => fondos insuficientes o cuenta no encontrada
        if (resultado.modifiedCount === 0) {
          // Verificar si la cuenta existe para dar el mensaje adecuado
          const existeCuenta = await db.collection('cuentas').findOne({ numeroCuenta });
          if (!existeCuenta) {
            return res.status(404).json({ error: 'Cuenta no encontrada' });
          }
          return res.status(400).json({ error: 'Fondos insuficientes' });
        }

        // Si se modificó, el retiro fue exitoso. Obtenemos el _id de la cuenta
        const cuentaActualizada = await db.collection('cuentas').findOne({ numeroCuenta });

        // Insertar transacción
        await db.collection('transacciones').insertOne({
          cuentaId: cuentaActualizada._id,
          tipo: 'retiro',
          monto,
          fecha: new Date(),
          descripcion: `Retiro en ${sucursal}`,
          sucursal
        });

        res.json({ mensaje: 'Retiro realizado con éxito' });
      } catch (error) {
        console.error('Error en retiro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    });

    // Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
}

iniciarServidor();