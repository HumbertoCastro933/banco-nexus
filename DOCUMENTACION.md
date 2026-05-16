# Práctica Distribuida: Banco Nexus - Etapa 1

## Control de Roles del Equipo
* *Integrante 1: Jesus Daniel Vega Olachea* - Arquitecto de Base de Datos (Diseño de esquemas y scripts).
* *Integrante 2 y 3: Jose Humberto Castro Garcia* - Programador Fullstack (Desarrollo de la API REST Backend e Interfaz de usuario Frontend).
* *Integrante 4: Nestor Arce* - DevOps / Control de Entorno (Instalación, red local y pruebas).

## 1. Modelo de Datos (MongoDB)

## 2. Diseño del Modelo de Datos (MongoDB)
La base de datos se denomina banco_nexus. Al ser una base de datos NoSQL orientada a documentos, se optó por una estructura normalizada mediante referencias (utilizando el CURP y IDs) para garantizar la consistencia en futuras etapas distribuidas.

### 2.1 Colección: clientes
Almacena la información de identidad de los cuentahabientes.
* _id: ObjectId (Autogenerado por MongoDB)
* nombre: String (Nombre completo del cliente)
* curp: String (Clave Única de Registro de Población, funciona como llave única)

### 2.2 Colección: cuentas
Almacena los productos financieros asociados a cada cliente.
* _id: ObjectId
* numero_cuenta: String (Identificador único de la cuenta)
* curp_cliente: String (Referencia/Llave foránea al CURP del cliente)
* saldo: Decimal / Number (Saldo disponible actual)
* tipo_cuenta: String ("Ahorro" o "Cheques")

### 2.3 Colección: transacciones
Registra el historial de movimientos económicos.
* _id: ObjectId
* numero_cuenta: String (Referencia a la cuenta que realiza el movimiento)
* tipo: String ("Depósito" o "Retiro")
* monto: Number (Cantidad de la transacción)
* fecha: Date (Fecha y hora exacta del movimiento)


## 3. Bitácora de Trabajo Compartida

| Fecha | Integrante | Rol Asignado | Actividad Realizada | Estado |

| 15/05/2026 | [Jesus Daniel Vega Olachea] | 1. Arquitecto de Base de Datos | Diseño del modelo de datos, relaciones y creación del script de inicialización (`crearBaseDeDatos.js`). | Completado |

| 15/05/2026 | José Humberto Castro García | 2. Programador Backend | Configuración del servidor Node.js, conexión a MongoDB y desarrollo de la ruta `/api/cuenta/:cuenta`. | Completado |

| 15/05/2026 | José Humberto Castro García | 3. Programador Frontend | Construcción de la interfaz gráfica en React, formulario de consulta y conexión con el backend. | Completado |

| DD/MM/2026 | Nestor Aimar Arce Nuñez | 4. DevOps / Sincronización | Instalación de MongoDB local en los 4 nodos, pruebas de acceso y documentación de resolución de problemas. | Pendiente |

## 4. Pruebas y Entorno Local
## 4.1 Manual de Instalación y Entorno Local (Guía DevOps)
Para asegurar que los nodos (las computadoras de los integrantes) operen de forma idéntica, se siguió este proceso:

1.  *Instalación:* Se instaló MongoDB Community Server y MongoDB Compass en cada equipo.
2.  *Verificación de Conexión:* Se comprobó el acceso local mediante la URI estándar: mongodb://localhost:27017.
3.  *Población de Datos:* Se ejecutó el script de inicialización (crearBaseDeDatos.js) para cargar los clientes simulados con CURPs realistas, garantizando que el equipo realice pruebas sobre el mismo set de datos.