const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb://localhost:27017';
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
    console.log('Conectado a MongoDB');
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