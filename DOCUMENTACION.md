# Práctica Distribuida: Banco Nexus

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

## 2. Bitácora de Trabajo Compartida - Etapa 1

| Fecha | Integrante | Rol Asignado | Actividad Realizada | Estado |
| :--- | :--- | :--- | :--- | :--- |
| 15/05/2026 | Jesus Daniel Vega Olachea | 1. Arquitecto de BD | Diseño formal de esquemas, normalización de colecciones y desarrollo del script generador con algoritmo CURP (`crearBaseDeDatos.js`). | Completado |
| 15/05/2026 | José Humberto Castro García | 2. Programador Backend | Inicialización del entorno Node.js, configuración del driver de MongoDB, habilitación de CORS y despliegue del endpoint `/api/cuenta/:cuenta`. | Completado |
| 15/05/2026 | José Humberto Castro García | 3. Programador Frontend | Inicialización de la SPA en React vía Vite, configuración del cliente de peticiones HTTP, instalación de `recharts` y maquetado del Dashboard Financiero. | Completado |
| 15/05/2026 | Nestor Aimar Arce Nuñez | 4. DevOps / Entorno | Instalación de dependencias locales en los 4 nodos del sistema, verificación de consistencia de datos y desarrollo del manual técnico de resolución de fallos. | Completado |

---

## 3. Pruebas y Entorno Local (Reporte DevOps Etapa 1)

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
  * *Solución:* Se ejecutó una limpieza profunda eliminando el árbol corrupto de dependencias (`node_modules`) y los bloqueos de paquetes (`package-lock.json`), forzando una instalación hacia versiones compatibles de alta estabilidad mediante el comando `npm install vite@5 @vitejs/plugin-react@4 --save-dev`, logrando compilar la interfaz de usuario en el puerto local sin degradar la versión del motor de Node de la máquina.

---

## 4. Práctica Distribuida: Banco Nexus - Etapa 2 (Sincronización Simulada entre Sucursales)
El objetivo principal de esta etapa fue implementar operaciones bancarias que simulan la sincronización de datos entre distintas sucursales, utilizando programación orientada a manejar operaciones concurrentes sobre la misma base de datos[cite: 1].

### 4.1 Lógica de Transacciones y Rastreo de Sucursales
Para soportar la simulación de un entorno distribuido, se realizaron modificaciones en la arquitectura:
* **Estructura de Sucursales:** Se definió la estructura técnica de las transacciones provenientes de distintas ubicaciones[cite: 1].
* **Rastreo de Origen:** Se agregaron los campos `sucursal` y `fecha` a la colección de transacciones para poder simular operaciones desde sucursales remotas y rastrear su origen exacto[cite: 1].

### 4.2 Desarrollo de API REST y Capa Visual
* **Endpoints Financieros:** Se crearon rutas REST específicas para procesar ingresos y egresos mediante los endpoints `/api/deposito` y `/api/retiro`[cite: 1].
* **Integridad de Datos:** Se implementó la lógica estricta para registrar la transacción y modificar el saldo, agregando validación de monto y estado de cuenta[cite: 1].
* **Manejo de Excepciones:** Se agregó un sólido control de errores en el backend para rechazar peticiones por saldo insuficiente o en caso de que la cuenta no sea encontrada[cite: 1].
* **Interfaz Interactiva:** Se mejoró la interfaz bancaria añadiendo inputs de monto y botones de acción, conectando las funciones de depósito y retiro al backend mediante la API `fetch`[cite: 1]. Además, la UI ahora muestra mensajes de éxito o error en tiempo real al usuario[cite: 1].

### 4.3 Bitácora de Trabajo - Etapa 2

| Fecha | Integrante | Rol Asignado | Actividad Realizada | Estado |
| :--- | :--- | :--- | :--- | :--- |
| 18/05/2026 | Jesus Daniel Vega Olachea | 1. Arquitecto de BD | Define estructura de las transacciones en sucursales y agrega los campos `sucursal` y `fecha` para rastrear su origen[cite: 1]. | Completado |
| 18/05/2026 | José Humberto Castro García | 2. Programador Backend | Crea rutas REST para depósitos y retiros (`/api/deposito`, `/api/retiro`) e implementa lógica de saldo con control de errores por fondos insuficientes[cite: 1]. | Completado |
| 18/05/2026 | José Humberto Castro García | 3. Programador Frontend | Mejora la interfaz bancaria con inputs/botones, conecta funciones al backend usando `fetch` y muestra mensajes de validación al usuario[cite: 1]. | Completado |
| 18/05/2026 | Nestor Aimar Arce Nuñez | 4. DevOps / Entorno | Crea scripts para simular acciones desde 5 sucursales. Ejecuta operaciones concurrentes y documenta inconsistencias en los saldos[cite: 1]. | Completado |

### 4.4 Pruebas de Estrés y Concurrencia (Reporte DevOps Etapa 2)
* **Simulación de Nodos Múltiples:** Se crearon scripts específicos (ej. `operacionSucursalCDMX.js` y `consultaSucursalGDL.js`) para simular acciones provenientes desde 5 "sucursales" diferentes[cite: 1].
* **Ejecución Paralela:** Se ejecutaron operaciones concurrentes masivas haciendo uso de `Promise.all` para medir las diferencias en los resultados al operar de forma paralela[cite: 1].
* **Auditoría de Datos:** Se analizó profundamente el comportamiento del sistema y se documentó si hubo colisiones o inconsistencias en los saldos finales tras someter la base de datos a estrés transaccional[cite: 1].

---

## 5. Práctica Distribuida: Banco Nexus - Etapa 3 (Alta Disponibilidad y Tolerancia a Fallos)
Esta etapa implementa un clúster distribuido de base de datos para garantizar que el sistema de Banco Nexus, desarrollado mediante MongoDB y Node.js, mantenga la disponibilidad ininterrumpida ante caídas de red. Adicionalmente, se blindó la lógica transaccional para asegurar que las operaciones concurrentes simultáneas no permitan, bajo ninguna circunstancia, que las cuentas alcancen un estado negativo no autorizado.

### 5.1 Configuración de la Topología de Red (Replica Set `rsBanco`)
Se abandonó la arquitectura de un solo nodo para implementar un sistema local de **Alta Disponibilidad** mediante un Replica Set compuesto por 3 nodos ejecutados en puertos independientes.
*   **Nodo Primario (Inicial):** `localhost:27017` (Directorio de datos: `C:\data\db1`)
*   **Nodo Secundario 1:** `localhost:27018` (Directorio de datos: `C:\data\db2`)
*   **Nodo Secundario 2:** `localhost:27019` (Directorio de datos: `C:\data\db3`)
*   **Comando de Inicialización:** Función `rs.initiate()` ejecutada desde el nodo principal para enlazar la topología bajo el clúster `rsBanco`.

### 5.2 Actualización de Roles y Bitácora - Etapa 3

| Fecha | Integrante | Rol Asignado | Actividad Realizada | Estado |
| :--- | :--- | :--- | :--- | :--- |
| 22/05/2026 | Jesus Daniel Vega Olachea | 1. Arquitecto de BD | Adaptación de los scripts de población (`crearBaseDeDatos.js`) y migración para inyectar información apuntando directamente a la URI del clúster. Verificación de integridad. | Completado |
| 22/05/2026 | José Humberto Castro García | 2. Programador Backend | Modificación del driver de conexión de Node.js integrando la URI de los 3 puertos (`?replicaSet=rsBanco`). Configuración de manejo de errores ante caídas. | Completado |
| 22/05/2026 | José Humberto Castro García | 3. Programador Frontend | Integración de bloques lógicos (`catch`) en la UI. Se añadieron alertas visuales en pantalla que informan al usuario en caso de latencia severa o caída del nodo primario. | Completado |
| 22/05/2026 | Nestor Aimar Arce Nuñez | 4. DevOps / Entorno | Despliegue físico del clúster local en 3 terminales distintas, establecimiento del `replicaSet`, y ejecución de pruebas de estrés y *Failover* automático. | Completado |

### 5.3 Pruebas de Tolerancia a Fallos y Concurrencia (Reporte DevOps Etapa 3)

*   **Prueba de Resiliencia 01: Caída del Servidor Primario (Failover)**
    *   *Metodología:* Se simuló la pérdida total de conectividad en el nodo líder deteniendo forzosamente el proceso del motor de base de datos en el puerto `27017` (`Ctrl + C` en terminal) durante el estado activo del sistema.
    *   *Comportamiento del Sistema:* Los nodos secundarios (27018 y 27019) detectaron la ausencia del primario y ejecutaron una elección automática para nombrar un nuevo líder. El backend de Node.js interrumpió la conexión por escasos milisegundos y enrutó las nuevas peticiones al nodo líder entrante de manera transparente, evitando un *crash* del servidor. El frontend capturó la pequeña demora de latencia disparando la alerta de red correspondiente en la interfaz gráfica.
*   **Prueba de Resiliencia 02: Protección Atómica contra Saldos Negativos (Concurrencia)**
    *   *Metodología:* Ejecución de múltiples peticiones de retiro de forma simultánea (condiciones de carrera) excediendo el límite de fondos disponibles de una cuenta bancaria.
    *   *Comportamiento del Sistema:* Mediante el uso de operadores atómicos (como `$gte` evaluando el saldo contra el monto a retirar), el clúster de bases de datos rechazó internamente las operaciones concurrentes sin fondos, garantizando la consistencia y comprobando que en el modelo distribuido de Banco Nexus es imposible llevar una cuenta a números rojos no autorizados.