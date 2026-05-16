import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarConsulta = async (e) => {
    e.preventDefault();
    const cuenta = numeroCuenta.trim();
    if (!cuenta) {
      setError('Ingresa un número de cuenta.');
      return;
    }

    setCargando(true);
    setError('');
    setDatosCuenta(null);

    try {
      const respuesta = await fetch(`http://localhost:3000/api/cuenta/${cuenta}`);
      if (!respuesta.ok) {
        const errData = await respuesta.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${respuesta.status}`);
      }
      const datos = await respuesta.json();
      setDatosCuenta(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para calcular la evolución del saldo a partir de las transacciones
  const calcularEvolucionSaldo = (saldoActual, transacciones) => {
    if (!transacciones || transacciones.length === 0) return [];

    // Ordenar transacciones por fecha ascendente (vienen descendentes del backend)
    const ordenadas = [...transacciones].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Reconstruir el saldo hacia atrás para obtener el saldo inicial antes de la primera transacción
    let saldo = saldoActual;
    // Recorremos desde la más reciente a la más antigua para deshacer los movimientos
    for (let i = transacciones.length - 1; i >= 0; i--) {
      const t = transacciones[i]; // La más reciente en el índice mayor si orden descendente original, pero tenemos orden ascendente ahora.
      // Nota: transacciones originales vienen en orden descendente. Así que iteramos sobre el array original (no ordenado) o sobre el ordenado.
      // Mejor usar el array original en orden descendente para deshacer desde la más reciente a la más antigua.
    }
    // Estrategia más clara: tomar las transacciones originales (orden descendente) y deshacer una a una.
    const transOriginales = [...transacciones]; // ya están descendentes
    const puntos = [];
    let saldoActualIterator = saldoActual;
    // Creamos un punto para el momento actual (último movimiento)
    puntos.push({ fecha: new Date(), saldo: saldoActualIterator });
    for (const t of transOriginales) {
      const fecha = new Date(t.fecha);
      // Deshacer el efecto de la transacción para obtener el saldo anterior
      if (t.tipo === 'depósito') {
        saldoActualIterator -= t.monto;
      } else if (t.tipo === 'retiro' || t.tipo === 'transferencia') {
        saldoActualIterator += t.monto;
      }
      puntos.push({ fecha, saldo: saldoActualIterator });
    }
    // Invertir para que quede en orden cronológico
    puntos.reverse();
    return puntos;
  };

  // Preparar datos para la gráfica si hay datos de cuenta
  const datosGrafica = datosCuenta
    ? calcularEvolucionSaldo(datosCuenta.saldo, datosCuenta.transacciones)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
            Banco <span className="text-blue-600">Nexus</span>
          </h1>
          <p className="text-gray-500 mt-1">Dashboard Financiero</p>
        </header>

        {/* Formulario de consulta */}
        <form onSubmit={manejarConsulta} className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={numeroCuenta}
              onChange={(e) => setNumeroCuenta(e.target.value)}
              placeholder="Número de cuenta (10 dígitos)"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
            <button
              type="submit"
              disabled={cargando}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {cargando ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
        </form>

        {/* Resultados de la consulta */}
        {datosCuenta && (
          <div className="space-y-8">
            {/* Tarjeta de información del cliente y saldo */}
            <div className="bg-white rounded-xl shadow-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Cliente</p>
                <p className="text-xl font-bold text-gray-800">{datosCuenta.nombreCliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Saldo actual</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${datosCuenta.saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Gráfica de evolución del saldo */}
            {datosGrafica.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Evolución del saldo</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datosGrafica}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={(fecha) =>
                        new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                      }
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip
                      labelFormatter={(fecha) => new Date(fecha).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Saldo']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      name="Saldo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tabla de historial de movimientos */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Historial de movimientos</h2>
              {datosCuenta.transacciones.length === 0 ? (
                <p className="text-gray-500">No hay movimientos registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">Fecha</th>
                        <th className="px-4 py-2">Tipo</th>
                        <th className="px-4 py-2">Monto</th>
                        <th className="px-4 py-2">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {datosCuenta.transacciones.map((t, index) => {
                        const esDeposito = t.tipo === 'depósito';
                        const esTransferencia = t.tipo === 'transferencia';
                        const colorMonto = esDeposito
                          ? 'text-green-600'
                          : 'text-red-600';
                        const signo = esDeposito ? '+' : '-';
                        return (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                              {new Date(t.fecha).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                  esDeposito
                                    ? 'bg-green-100 text-green-800'
                                    : esTransferencia
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {t.tipo}
                              </span>
                            </td>
                            <td className={`px-4 py-2 font-semibold ${colorMonto}`}>
                              {signo}${t.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2 text-gray-500">{t.descripcion}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;