# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- Frontend: React + TypeScript (Vite).
- Backend: Spring Boot (Java 17) con API REST.
- Base de datos: PostgreSQL.
- Despliegue de la demo: frontend en Vercel, backend en Render (Docker) y BD en Neon, todo en plan gratuito. La primera petición puede tardar ~30 s si Render tenía el backend dormido, y la interfaz debe avisarlo.

## Users

- **Paciente:** una persona de Lima que quiere una cita con el dentista y la reserva desde el celular, casi siempre desde un enlace de WhatsApp, Instagram o Google Maps. Elige tratamiento, doctor (o "cualquiera"), día y hora, y deja su nombre y número de WhatsApp. No crea cuenta.
- **Recepción:** la persona que maneja la agenda en una computadora del consultorio durante todo el día. Confirma, reprograma o cancela citas, registra a quien llega sin cita y envía los recordatorios.
- **Doctor u odontólogo:** revisa su agenda del día y el historial básico del paciente. Puede ser también el dueño del consultorio.
- **Público secundario:** dueños de consultorios que evalúan contratar a David y reclutadores que revisan su trabajo. Ambos ven la demo con datos ficticios.

## Product Purpose

Reemplazar el cuaderno, las llamadas y los chats sueltos de WhatsApp con los que un consultorio dental pequeño o mediano lleva su agenda. Se considera un éxito si el paciente reserva sin llamar, recepción ve el día de un vistazo y bajan las inasistencias gracias a los recordatorios.

Para David, el proyecto es una pieza de portafolio: un sistema real que un dueño de consultorio pueda probar y quiera tener.

## Positioning

Está hecho para cómo trabaja un consultorio en Perú: el canal de contacto es WhatsApp y no el correo, los datos son DNI y celular, los precios van en soles, el horario se corta al mediodía y los tratamientos suelen ir por sesiones. No es una agenda genérica traducida.

## Operating Context

- Recepción tiene el panel abierto todo el día en una PC o laptop. Lo que más mira es la agenda del día, organizada por doctor.
- El paciente reserva casi siempre desde el celular y a veces con mala conexión.
- Recordatorios: el sistema arma el mensaje y recepción lo envía con un clic usando un enlace `wa.me`. Una tarea programada marca qué recordatorios tocan (24 h antes) y lleva el registro de enviados. La arquitectura deja lugar para conectar después la API oficial de WhatsApp Business (Meta), pero no la usa.
- Estados de una cita: pendiente de confirmar, confirmada, atendida, no asistió, cancelada.

## Capabilities and Constraints

- **Página pública de reserva:** tratamientos con duración y precio de referencia en soles, doctores, horarios libres en tiempo real y confirmación con un resumen.
- **Panel con inicio de sesión** y roles de administrador, recepción y doctor:
  - agenda diaria y semanal por doctor;
  - crear, reprogramar y cancelar citas, y cambiar su estado;
  - pacientes: datos, historial de citas y notas clínicas básicas;
  - recordatorios pendientes y enviados;
  - configuración de tratamientos, doctores, horarios y feriados.
- No permite dos citas a la vez para el mismo doctor; esto se valida en el backend.
- Zona horaria America/Lima. Moneda PEN. Interfaz en español.
- **Sin decidir:** el odontograma (queda fuera de la primera versión salvo que David lo pida), los pagos en línea y la boleta.

## Brand Commitments

- El consultorio de la demo es **ficticio**. Su nombre debe ser inventado y no puede coincidir con ninguna clínica real.
- El sistema lo firma David Vega (GitHub: DarkCodeKnight25) como pieza de su portafolio.
- Nombre del producto: sin decidir.

## Evidence on Hand

- No hay clientes, testimonios ni cifras reales. No se deben inventar reseñas, cantidad de pacientes ni logos de clínicas.
- Todos los datos de la demo (pacientes, doctores, citas) son ficticios y deben verse así: nombres inventados, DNI y números que no sean reales.

## Product Principles

1. **Primero el día de hoy:** recepción tiene que saber en 3 segundos quién viene, quién falta confirmar y quién no llegó.
2. **WhatsApp es el canal**, no un extra: cada cita puede llevar a un mensaje listo para enviar.
3. **Reservar sin fricción:** el paciente reserva en menos de un minuto, desde el celular y sin crear una cuenta.
4. **Reglas en el servidor:** los choques de horario, los feriados y los permisos se validan en el backend, no solo en la pantalla.
5. **Demo honesta:** se nota que los datos son de ejemplo, y el sistema es real y funciona.

## Accessibility & Inclusion

- Contraste WCAG AA. Toda la agenda debe poder manejarse con teclado, porque recepción la usa todo el día.
- La reserva pública debe funcionar en celulares de gama baja y pantallas de 360 px.
- Pacientes de cualquier edad: textos claros, sin jerga técnica y con objetivos táctiles grandes.
