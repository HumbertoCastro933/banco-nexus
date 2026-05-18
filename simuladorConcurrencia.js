const sucursales = ['Sede Central (La Paz)', 'CDMX', 'GDL', 'MTY', 'Sucursal Web'];

async function simularRetiro(sucursal) {
  try {
    const res = await fetch('http://localhost:3000/api/retiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numeroCuenta: '2474555371',
        cantidad: 500,
        sucursal
      })
    });

    const data = await res.json();

    if (res.ok) {
      return { sucursal, estado: 'Aprobado', mensaje: data.mensaje };
    } else {
      return { sucursal, estado: 'Rechazado', mensaje: data.error };
    }
  } catch (err) {
    return { sucursal, estado: 'Error', mensaje: err.message };
  }
}

(async () => {
  console.log('Iniciando prueba de concurrencia...\n');

  const promesas = sucursales.map(s => simularRetiro(s));
  const resultados = await Promise.all(promesas);

  console.table(resultados);
})();