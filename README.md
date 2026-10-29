# Dental Qori: sistema de citas para consultorio dental

Sistema completo para un consultorio dental en Lima. Los pacientes reservan desde el celular sin crear una cuenta, y recepción maneja la agenda del día, confirma citas y envía recordatorios por WhatsApp.

> **Demo:** el consultorio, los doctores y los pacientes son ficticios. Los datos se reinician cada día a las 4:00 (hora de Lima).
> Panel: entra con `recepcion@dentalqori.demo`, `doctor@dentalqori.demo` o `admin@dentalqori.demo`. La contraseña de las tres cuentas es `demo1234`.

## Qué resuelve

Un consultorio pequeño suele llevar la agenda en un cuaderno, con llamadas y chats sueltos de WhatsApp. Esto trae tres problemas: horarios cruzados, pacientes que no llegan y una recepcionista que no sabe de un vistazo quién sigue. Este sistema ataca los tres:

- **Reserva en línea** con las horas libres en tiempo real. El paciente elige tratamiento (con su precio referencial en soles), doctor o «cualquiera disponible», día y hora.
- **Agenda «Hoy»** para recepción, con una columna por doctor, el corte de almuerzo, la línea de «ahora» y el siguiente paciente en grande.
- **Recordatorios por WhatsApp:** cada cita genera un mensaje de confirmación y otro 24 horas antes. Recepción los envía con un clic (enlace `wa.me` con el texto listo).
- **Fichas de pacientes** con su historial de citas y notas clínicas que firma el doctor.
- **Ajustes:** tratamientos y precios, horario semanal de cada doctor y feriados de Perú (incluida Semana Santa, que se calcula sola).

## Reglas que se validan en el servidor

- Un doctor no puede tener dos citas a la vez. Además de revisar los cruces, la fila del doctor se bloquea (`SELECT … FOR UPDATE`) mientras dura la reserva, así que dos pacientes que reservan la misma hora al mismo tiempo no generan una doble cita. Hay una prueba con dos hilos simultáneos que lo comprueba.
- No se reserva en feriados, fuera del horario del doctor, en el corte de almuerzo, con un doctor que no hace ese tratamiento ni con menos de 60 minutos de anticipación desde la web.
- Los estados siguen un flujo: por confirmar → confirmada → en atención → atendida, o bien no asistió o cancelada. Una cita reprogramada vuelve a «por confirmar».
- Permisos por rol (administración, recepción y doctor) con JWT.

## Tecnologías

| Parte | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, TanStack Query, React Router |
| Backend | Java 17, Spring Boot 4, Spring Security (JWT HS256), Spring Data JPA, Flyway |
| Base de datos | PostgreSQL 17 (H2 en modo PostgreSQL para las pruebas) |
| Despliegue | Vercel (frontend), Render con Docker (API) y Neon (PostgreSQL) |

## Correr en local

Requisitos: Java 17, Node 22 o superior y Docker.

```bash
# 1. Base de datos
docker compose up -d

# 2. API en http://localhost:8081 (al arrancar carga los datos de demostración)
cd backend
./mvnw spring-boot:run

# 3. Frontend en http://localhost:5173
cd frontend
npm install
npm run dev
```

Pruebas del backend: `cd backend && ./mvnw test`. Hay 14 pruebas de integración: reglas de agenda, concurrencia, permisos y validaciones.

## Publicar

1. **Neon:** crea un proyecto y copia el host, el usuario y la contraseña.
2. **Render:** crea un *Blueprint* desde este repositorio (usa `render.yaml`) y completa estas variables:
   - `DATABASE_URL=jdbc:postgresql://<host>/<base>?sslmode=require`
   - `DATABASE_USER`
   - `DATABASE_PASSWORD`
   - `CORS_ORIGENES=https://<tu-app>.vercel.app`
3. **Vercel:** importa la carpeta `frontend/` y define `VITE_API_URL=https://<tu-api>.onrender.com`.

El plan gratuito de Render apaga la API después de 15 minutos sin uso. La interfaz lo avisa («Despertando el servidor…») mientras arranca, lo que toma unos 30 segundos.

## WhatsApp

En la demo (`WHATSAPP_DEMO=true`), los enlaces abren WhatsApp sin destinatario para no escribir a números reales. En un consultorio de verdad se desactiva y el mensaje va directo al celular del paciente. `WhatsappService` es el único lugar que arma los mensajes, así que cambiar a la API oficial de WhatsApp Business no afecta al panel.

## Autor

David Vega, desarrollador full stack en Lima. [GitHub](https://github.com/DarkCodeKnight25) · [LinkedIn](https://www.linkedin.com/in/dvegaortiz)
