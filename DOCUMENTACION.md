# Práctica Distribuida: Banco Nexus - Etapa 1

## Control de Roles del Equipo
* **Integrante 1: Jesus Daniel Vega Olachea** - Arquitecto de Base de Datos (Diseño de esquemas y scripts de inicialización).
* **Integrante 2 y 3: Jose Humberto Castro Garcia** - Programador Fullstack (Desarrollo de la API REST Backend e Interfaz de usuario Frontend).
* **Integrante 4: Nestor Aimar Arce Nuñez** - DevOps / Control de Entorno (Instalación en nodos, entorno local y pruebas).

---

## 1. Diseño del Modelo de Datos (MongoDB)
La base de datos se denomina `banco_nexus`. Al ser una base de datos NoSQL orientada a documentos, se optó por una estructura híbrida que combina llaves naturales únicas (CURP) y llaves subrogadas basadas en el identificador único de MongoDB (`_id`) para garantizar el rendimiento y la consistencia en futuras etapas de replicación distribuida.

### 1.1 Colección: `clientes`
Almacena la información de identidad oficial de los cuentahabientes del banco.
* `_id`: `ObjectId` – Identificador único autogenerado por MongoDB.
* `nombre`: `String` – Nombre completo del cliente (generado de manera realista mediante diccionarios de nombres comunes).
* `curp`: `String` – Clave Única de Registro de Población válida (18 caracteres estructurados legalmente bajo el algoritmo de la RENAPO), la cual actúa como llave primaria natural para los clientes.

### 1.2 Colección: `cuentas`
Almacena los diferentes productos financieros vinculados a los usuarios.
* `_id`: `ObjectId` – Identificador único de la cuenta.
* `numeroCuenta`: `String` – Identificador numérico único de la cuenta (fijo a 10 dígitos).
* `tipo`: `String` – Categoría del producto financiero ("Ahorro", "Corriente" o "Inversión").
* `saldo`: `Number / Double` – Saldo monetario disponible en la cuenta (valores flotantes entre $1,000.00 y $100,000.00 MXN).
* `moneda`: `String` – Divisa de la cuenta (fijada de manera estándar en "MXN").
* `clienteCURP`: `String` – Referencia directa al campo `curp` de la colección `clientes` (Llave foránea natural).

### 1.3 Colección: `transacciones` (Actualizada Etapa 2)
Registra el historial exhaustivo de movimientos económicos y transferencias interbancarias directas, preparado para concurrencia distribuida.
* `_id`: `ObjectId` – Identificador único del movimiento.
* `cuentaId`: `ObjectId` – Referencia al `_id` de la cuenta origen que ejecuta la operación (Llave foránea).
* `cuentaDestinoId`: `ObjectId` *(Opcional)* – Referencia al `_id` de la cuenta destino (utilizado de manera exclusiva para operaciones de tipo 'transferencia').
* `tipo`: `String` – Naturaleza del movimiento realizado ('depósito', 'retiro' o 'transferencia').
* `monto`: `Number / Double` – Volumen económico de la transacción.
* `fecha`: `Date` – Registro temporal exacto (Timestamp / ISODate) en el que se efectuó la operación. Fundamental para resolver conflictos de concurrencia y ordenar el historial cronológicamente.
* `descripcion`: `String` – Nota textual automatizada sobre el concepto del movimiento.
* `sucursal`: `String` – **[NUEVO ETAPA 2]** Identificador de la sucursal de origen de la transacción (ej. 'Sede Central', 'CDMX', 'GDL', 'Web'). Permite el rastreo distribuido de las operaciones concurrentes que ingresan al sistema.

---

## 2. Bitácora de Trabajo Compartida

| Fecha | Integrante | Rol Asignado | Actividad Realizada | Estado |
| :--- | :--- | :--- | :--- | :--- |
| 15/05/2026 | Jesus Daniel Vega Olachea | 1. Arquitecto de Base de Datos | Diseño formal de esquemas, normalización de colecciones y desarrollo del script generador con algoritmo CURP (`crearBaseDeDatos.js`). | Completado |
| 15/05/2026 | José Humberto Castro García | 2. Programador Backend | Inicialización del entorno Node.js, configuración del driver de MongoDB, habilitación de CORS y despliegue del endpoint `/api/cuenta/:cuenta`. | Completado |
| 15/05/2026 | José Humberto Castro García | 3. Programador Frontend | Inicialización de la SPA en React vía Vite, configuración del cliente de peticiones HTTP, instalación de `recharts` y maquetado del Dashboard Financiero. | Completado |
| 15/05/2026 | Nestor Aimar Arce Nuñez | 4. DevOps / Entorno | Instalación de dependencias locales en los 4 nodos del sistema, verificación de consistencia de datos y desarrollo del manual técnico de resolución de fallos. | Completado |

---

## 3. Pruebas y Entorno Local (Reporte DevOps)

### 3.1 Manual de Instalación y Homogeneización de Entornos
Para garantizar que las computadoras del equipo (nodos del clúster de simulación) operen de forma idéntica en el manejo de datos locales, se estableció el siguiente proceso mandatorio de infraestructura:
1. **Instalación del Motor:** Instalación local de *MongoDB Community Server* configurado de manera nativa en el puerto estándar `27017`.
2. **Interfaz Gráfica:** Instalación de *MongoDB Compass* para realizar auditorías visuales sobre las colecciones sin depender de consultas en terminal externa.
3. **Población de Datos Homogénea:** Ejecución centralizada del script mediante el comando `node database/crearBaseDeDatos.js`, generando de manera controlada un set idéntico de entre 10 y 15 clientes estables junto con sus historiales transaccionales, asegurando consistencia de pruebas en todos los nodos.

### 3.2 Registro de Incidencias Técnicas y Resoluciones
Durante el ciclo de desarrollo e integración de los componentes en el nodo local, se presentaron los siguientes fallos de acceso y entorno, los cuales fueron solventados con éxito:

* **Incidencia DevOps 01: Falla de Conexión de Red Local (`MongoServerSelectionError / ECONNREFUSED`).**
  * *Diagnóstico:* El microservicio del backend en Node.js intentó conectarse al puerto `27017`, pero la petición fue rechazada debido a que el motor de la base de datos de MongoDB no se encontraba activo o corriendo en los servicios del sistema operativo.
  * *Solución:* Se ingresó al administrador de servicios del sistema operativo de fondo (Windows Services) para arrancar de forma manual el proceso `MongoDB Server`, restaurando inmediatamente el canal de comunicación.

* **Incidencia DevOps 02: Error de Inyección de Módulos (`MODULE_NOT_FOUND` de MongoDB).**
  * *Diagnóstico:* El script de inicialización fallaba al intentar importar el objeto `MongoClient` debido a que el driver nativo de base de datos no se encontraba disponible localmente dentro de las dependencias de ejecución.
  * *Solución:* Se implementó el archivo descriptor `package.json` en la raíz del proyecto para centralizar el versionado, requiriendo que cada nodo del equipo ejecute de manera mandatoria el comando de instalación `npm install` antes de realizar despliegues de datos.

* **Incidencia DevOps 03: Incompatibilidad de Enlazado de Plataforma en Frontend (`Cannot find native binding` en Vite).**
  * *Diagnóstico:* Al levantar la capa de presentación en React, las versiones más recientes del andamiaje de construcción (Vite v6) arrojaban una ruptura de compatibilidad nativa en los archivos binarios al detectar un entorno de ejecución Node.js versión 20.17.0 (el cual se encuentra por debajo del requerimiento mínimo de dicha versión de la herramienta).
  * *Solución:* Se ejecutó una limpieza profunda eliminando el árbol corrupto de dependencias (`node_modules`) y los bloqueos de paquetes (`package-lock.json`), forzando una instalación hacia versiones compatibles de alta estabilidad mediante el comando `npm install vite@5 @vitejs/plugin-react@4 --save-dev`, logrando compilar la interfaz de usuario en el puerto local sin degradar la versión del motor de Node de la máquina.¿