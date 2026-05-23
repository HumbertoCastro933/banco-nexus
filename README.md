# Banco Nexus - Sistema Bancario Distribuido

Un simulador de sistema bancario distribuido diseñado para garantizar la alta disponibilidad, consistencia de datos ante fallos y manejo seguro de transacciones financieras concurrentes. Este proyecto abarca el diseño de la base de datos, el desarrollo de una API REST y la creación de un Dashboard financiero interactivo.

---

## Características Principales

* **Alta Disponibilidad (Tolerancia a fallos):** Implementación de un clúster local de MongoDB mediante un Replica Set de 3 nodos. El sistema ejecuta *failover* automático, redirigiendo el tráfico a un nodo secundario si el servidor principal se desconecta.
* **Consistencia Transaccional:** Blindaje contra saldos negativos utilizando operaciones atómicas a nivel de base de datos para manejar correctamente peticiones concurrentes (condiciones de carrera) provenientes de múltiples sucursales.
* **Resiliencia del Cliente:** Interfaz gráfica preparada para detectar latencia de red y caídas de nodo, alertando al usuario en tiempo real sin colapsar la aplicación.
* **Dashboard Financiero:** Visualización gráfica de la evolución del saldo de los clientes mediante análisis cronológico de su historial de transacciones.

---

## Tecnologías Utilizadas

* **Base de Datos:** MongoDB (Clúster Replica Set)
* **Backend:** Node.js, Express.js
* **Frontend:** React, Vite, Recharts, Tailwind CSS
* **Herramientas de Control:** MongoDB Compass, Git

---

## Requisitos Previos

* Node.js (v20 o superior).
* MongoDB Community Server (v8.x) instalado localmente.
* Estructura de carpetas requerida en el disco local (`C:\data\db1`, `C:\data\db2`, `C:\data\db3`).

---

## Guía de Instalación y Ejecución

**1. Levantar el Clúster de Base de Datos**
Abre tres terminales independientes como Administrador, navega a la ruta de instalación de MongoDB (`bin`) y ejecuta los siguientes comandos para iniciar los servidores:
* Terminal 1: `.\mongod --port 27017 --dbpath C:\data\db1 --replSet rsBanco`
* Terminal 2: `.\mongod --port 27018 --dbpath C:\data\db2 --replSet rsBanco`
* Terminal 3: `.\mongod --port 27019 --dbpath C:\data\db3 --replSet rsBanco`

**2. Inicializar la Topología de Red**
Conéctate al puerto 27017 utilizando la terminal (mongosh) y ejecuta la instrucción `rs.initiate()` para vincular los tres nodos.

**3. Instalar Dependencias del Servidor**
Navega a la raíz del proyecto en una nueva terminal y descarga los módulos necesarios:
`npm install`

**4. Poblar la Base de Datos**
Inyecta los datos de prueba (clientes, cuentas y transacciones simuladas) ejecutando el script generador. Los datos se replicarán automáticamente en todo el clúster:
`node database/crearBaseDeDatos.js`

**5. Iniciar el Backend**
Arranca la API REST que conectará la lógica de negocio con la base de datos distribuida:
`node server.js`

**6. Iniciar el Frontend**
Abre una terminal en el directorio de la interfaz de usuario, instala las dependencias y arranca el entorno de desarrollo:
`npm install`
`npm run dev`

---

## Simulación de Fallos y Pruebas de Estrés

**Tolerancia a Caídas (Failover)**
1. Abre la aplicación en el navegador web e ingresa un número de cuenta válido.
2. Inicia un retiro de fondos.
3. Inmediatamente, ve a la terminal del Nodo Primario (puerto 27017) y presiona `Ctrl + C` para matar el servidor de base de datos.
4. El sistema elegirá un nuevo líder. La interfaz detectará la latencia, mostrará una alerta de red y el backend redirigirá la transacción al nuevo nodo principal sin un cierre forzoso de la aplicación.

**Prueba de Concurrencia**
1. Ejecuta simultáneamente los scripts de simulación de sucursales remotas (`operacionSucursalCDMX.js`, `consultaSucursalGDL.js`).
2. Intenta agotar el saldo de una cuenta mediante retiros paralelos.
3. El motor de MongoDB rechazará las transacciones excedentes garantizando que el saldo jamás alcance un estado negativo no autorizado.

---

## Equipo de Desarrollo

* **Jesus Daniel Vega Olachea** - Arquitecto de Base de Datos
* **Jose Humberto Castro Garcia** - Programador Fullstack (Backend & Frontend)
* **Nestor Aimar Arce Nuñez** - DevOps y Control de Entorno
