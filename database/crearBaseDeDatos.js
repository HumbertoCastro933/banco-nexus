const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------
// Función auxiliar para calcular el dígito verificador del CURP
// (algoritmo oficial de la RENAPO, usando módulo 10)
// -------------------------------------------------------------------
function calcularDigitoVerificador(curp17) {
  const caracteres = curp17.split('');
  let suma = 0;
  for (let i = 0; i < 17; i++) {
    const char = caracteres[i];
    let valor;
    if (/[0-9]/.test(char)) {
      valor = parseInt(char, 10);
    } else {
      // A = 10, B = 11, ..., Z = 35
      valor = char.charCodeAt(0) - 55;
    }
    suma += valor * (i + 1); // pesos: 1,2,...,17
  }
  const residuo = suma % 10;
  const digito = (10 - residuo) % 10;
  return digito.toString();
}

// -------------------------------------------------------------------
// Generador de CURP con formato realista
// -------------------------------------------------------------------
function generarCURP(nombre, apellidoPaterno, apellidoMaterno, fecha, sexo, estado) {
  // Limpiar y pasar a mayúsculas (sin acentos, reemplazar Ñ por X)
  const limpiar = (str) => str.toUpperCase().replace(/Ñ/g, 'X').replace(/[^A-Z]/g, '');
  const nom = limpiar(nombre);
  const apePat = limpiar(apellidoPaterno);
  const apeMat = limpiar(apellidoMaterno);

  // 1) Primera letra del apellido paterno
  const letra1 = apePat.charAt(0);
  // 2) Primera vocal interna del apellido paterno
  const vocales = 'AEIOU';
  let letra2 = 'X';
  for (let i = 1; i < apePat.length; i++) {
    if (vocales.includes(apePat.charAt(i))) {
      letra2 = apePat.charAt(i);
      break;
    }
  }
  // 3) Primera letra del apellido materno
  const letra3 = apeMat.charAt(0) || 'X';
  // 4) Primera letra del nombre
  const letra4 = nom.charAt(0) || 'X';

  // 5) Fecha de nacimiento (YYMMDD)
  const yy = fecha.getFullYear().toString().slice(-2);
  const mm = ('0' + (fecha.getMonth() + 1)).slice(-2);
  const dd = ('0' + fecha.getDate()).slice(-2);
  const fechaStr = yy + mm + dd;

  // 6) Sexo
  const sexoChar = sexo;

  // 7) Clave de entidad federativa (dos letras)
  const estadoStr = estado;

  // 8) Primeras consonantes internas de cada apellido y del nombre
  const consonantes = 'BCDFGHJKLMNPQRSTVWXYZ';
  function primeraConsonanteInterna(str) {
    for (let i = 1; i < str.length; i++) {
      const c = str.charAt(i);
      if (consonantes.includes(c)) return c;
    }
    return 'X';
  }
  const conPat = primeraConsonanteInterna(apePat);
  const conMat = primeraConsonanteInterna(apeMat);
  const conNom = primeraConsonanteInterna(nom);

  // 9) Construir base de 16 caracteres
  const base16 = letra1 + letra2 + letra3 + letra4 + fechaStr + sexoChar + estadoStr + conPat + conMat + conNom;

  // 10) Homoclave: dígito aleatorio (0-9)
  const homoclave = Math.floor(Math.random() * 10).toString();

  // 11) Dígito verificador sobre los 17 caracteres
  const digito = calcularDigitoVerificador(base16 + homoclave);

  return base16 + homoclave + digito;
}

// -------------------------------------------------------------------
// Generador de nombres completos y datos para clientes
// -------------------------------------------------------------------
const nombres = ['María', 'José', 'Juan', 'Luis', 'Ana', 'Pedro', 'Rosa', 'Miguel', 'Elena', 'Carlos',
  'Guadalupe', 'Francisco', 'Alejandro', 'Sofía', 'Ricardo', 'Patricia', 'Fernando', 'Gabriela'];
const apellidos = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez',
  'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Morales', 'Jiménez', 'Vázquez', 'Ortiz', 'Ríos', 'Castillo'];
const estadosMexico = ['AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DF', 'DG', 'GT', 'GR', 'HG',
  'JC', 'MC', 'MN', 'MS', 'NT', 'NL', 'OC', 'PL', 'QT', 'QR', 'SP', 'SL', 'SR', 'TC', 'TL', 'TS', 'VZ', 'YN', 'ZS', 'NE'];

function generarFechaNacimiento() {
  // Entre 1950 y 2005
  const inicio = new Date(1950, 0, 1).getTime();
  const fin = new Date(2005, 11, 31).getTime();
  return new Date(inicio + Math.random() * (fin - inicio));
}

function generarCliente() {
  const nombrePila = nombres[Math.floor(Math.random() * nombres.length)];
  const apePat = apellidos[Math.floor(Math.random() * apellidos.length)];
  const apeMat = apellidos[Math.floor(Math.random() * apellidos.length)];
  const nombreCompleto = `${nombrePila} ${apePat} ${apeMat}`;
  const fechaNac = generarFechaNacimiento();
  const sexo = Math.random() < 0.5 ? 'H' : 'M';
  const estado = estadosMexico[Math.floor(Math.random() * estadosMexico.length)];

  const curp = generarCURP(nombrePila, apePat, apeMat, fechaNac, sexo, estado);
  return { nombre: nombreCompleto, curp };
}

// -------------------------------------------------------------------
// SCRIPT PRINCIPAL
// -------------------------------------------------------------------
async function main() {
  // URI actualizada para conectar al Replica Set rsBanco
  const url = 'mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco';
  const client = new MongoClient(url);

  try {
    // Conexión al servidor del Replica Set
    await client.connect();
    console.log('Conectado a MongoDB (Replica Set rsBanco)');

    const db = client.db('banco_nexus');

    // ---------- 1. COLECCIÓN clientes ----------
    const numClientes = Math.floor(Math.random() * 6) + 10; // entre 10 y 15
    console.log(`Generando ${numClientes} clientes...`);
    const clientes = [];
    for (let i = 0; i < numClientes; i++) {
      clientes.push(generarCliente());
    }
    const resultadoClientes = await db.collection('clientes').insertMany(clientes);
    console.log(`Insertados ${resultadoClientes.insertedCount} clientes.`);
    // Recuperamos los documentos insertados con sus _id
    const clientesDocs = await db.collection('clientes').find({}).toArray();

    // ---------- 2. COLECCIÓN cuentas ----------
    const tiposCuenta = ['Ahorro', 'Corriente', 'Inversión'];
    const cuentas = [];
    for (const cliente of clientesDocs) {
      const numCuentas = Math.floor(Math.random() * 3) + 1; // 1 a 3 cuentas por cliente
      for (let j = 0; j < numCuentas; j++) {
        const numero = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 dígitos
        cuentas.push({
          numeroCuenta: numero,
          tipo: tiposCuenta[Math.floor(Math.random() * tiposCuenta.length)],
          saldo: parseFloat((Math.random() * 99000 + 1000).toFixed(2)), // entre 1,000 y 100,000
          moneda: 'MXN',
          clienteCURP: cliente.curp  // Relación con cliente usando CURP como llave natural
        });
      }
    }
    const resultadoCuentas = await db.collection('cuentas').insertMany(cuentas);
    console.log(`Insertadas ${resultadoCuentas.insertedCount} cuentas.`);
    const cuentasDocs = await db.collection('cuentas').find({}).toArray();

    // ---------- 3. COLECCIÓN transacciones ----------
    const transacciones = [];

    // Transacciones básicas (depósitos y retiros) para cada cuenta
    for (const cuenta of cuentasDocs) {
      const numTrans = Math.floor(Math.random() * 16) + 5; // entre 5 y 20
      for (let k = 0; k < numTrans; k++) {
        const esDeposito = Math.random() < 0.7; // 70% depósito, 30% retiro
        const tipo = esDeposito ? 'depósito' : 'retiro';
        const monto = parseFloat((Math.random() * 5000 + 100).toFixed(2));
        // Fecha aleatoria en el último año
        const diasAleatorios = Math.floor(Math.random() * 365);
        const fecha = new Date(Date.now() - diasAleatorios * 24 * 60 * 60 * 1000);

        transacciones.push({
          cuentaId: cuenta._id,            // Relación con cuenta
          tipo,
          monto,
          fecha,
          descripcion: `Transacción ${tipo} automática`
        });
      }
    }

    // Transferencias adicionales para garantizar operaciones entre cuentas
    const numTransferencias = Math.floor(Math.random() * 11) + 5; // entre 5 y 15
    for (let t = 0; t < numTransferencias; t++) {
      const idxOrigen = Math.floor(Math.random() * cuentasDocs.length);
      let idxDestino = Math.floor(Math.random() * cuentasDocs.length);
      // Asegurar que origen y destino sean diferentes
      while (idxDestino === idxOrigen) {
        idxDestino = Math.floor(Math.random() * cuentasDocs.length);
      }
      const cuentaOrigen = cuentasDocs[idxOrigen];
      const cuentaDestino = cuentasDocs[idxDestino];

      const monto = parseFloat((Math.random() * 3000 + 500).toFixed(2));
      const diasAleatorios = Math.floor(Math.random() * 365);
      const fecha = new Date(Date.now() - diasAleatorios * 24 * 60 * 60 * 1000);

      transacciones.push({
        cuentaId: cuentaOrigen._id,
        cuentaDestinoId: cuentaDestino._id,  // Referencia a la cuenta destino (solo para transferencias)
        tipo: 'transferencia',
        monto,
        fecha,
        descripcion: 'Transferencia entre cuentas'
      });
    }

    const resultadoTransacciones = await db.collection('transacciones').insertMany(transacciones);
    console.log(`Insertadas ${resultadoTransacciones.insertedCount} transacciones.`);

    console.log('Base de datos "banco_nexus" inicializada correctamente en el Replica Set.');

  } catch (error) {
    console.error('Error durante la inicialización:', error);
    throw error;
  } finally {
    // Cerrar conexión
    await client.close();
    console.log('Conexión cerrada.');
  }
}

// Ejecutar el script
main().catch(console.error);