package pe.dvega.citas.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import pe.dvega.citas.dominio.*;
import pe.dvega.citas.repositorio.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

/**
 * Llena la base con un consultorio ficticio: doctores, tratamientos, horarios, feriados de Perú,
 * pacientes inventados y seis semanas de citas alrededor de hoy. En la demo pública se reinicia cada madrugada.
 * Ningún nombre, DNI ni celular corresponde a una persona real.
 */
@Component
public class DatosDemo {

    private static final Logger log = LoggerFactory.getLogger(DatosDemo.class);

    public static final String PASSWORD_DEMO = "demo1234";

    private static final String[] NOMBRES = {
            "Rosa Elena", "Jorge Luis", "Milagros", "Carlos Alberto", "Gianella", "Wilmer", "Fiorella", "Renzo",
            "Yesenia", "Edwin", "Katherine", "Percy", "Lucero", "Junior", "Maribel", "Óscar", "Rocío", "Brayan",
            "Flor de María", "Teodoro", "Kiara", "Ángel", "Sonia", "Diego", "Nataly", "Hugo", "Pilar", "Sebastián",
            "Zulema", "Franco", "Cinthia", "Elmer", "Valeria", "Raúl", "Mercedes", "Alonso", "Liz", "Gustavo",
            "Ruth", "Anthony", "Celia", "Mateo"};
    private static final String[] APELLIDOS = {
            "Quispe", "Huamán", "Mamani", "Flores", "Rojas", "Chávez", "Vargas", "Ramos", "Castillo", "Espinoza",
            "Mendoza", "Torres", "Ccahuana", "Paucar", "Salas", "Villanueva", "Cárdenas", "Llanos", "Arévalo",
            "Ticona", "Condori", "Palomino", "Zevallos", "Gutiérrez", "Inga", "Yupanqui", "Aguilar", "Benites"};

    private static final String[] NOTAS = {
            "Profilaxis completa. Se indicó técnica de cepillado de Bass. Control en 6 meses.",
            "Caries oclusal en pieza 36. Se realizó curación con resina A2. Sin sensibilidad posoperatoria.",
            "Paciente refiere dolor al frío en pieza 14. Se sugiere evaluación para endodoncia.",
            "Control de ortodoncia: cambio de arco 0.016 NiTi. Buena higiene.",
            "Extracción simple de pieza 48 sin complicaciones. Indicaciones posoperatorias entregadas.",
            "Primera visita. Odontograma inicial registrado. Plan: limpieza y dos curaciones.",
            "Endodoncia de pieza 21 en dos sesiones. Primera sesión: apertura y medicación intraconducto.",
            "Niña de 7 años, buena colaboración. Sellantes en primeras molares permanentes."};

    private final DoctorRepositorio doctores;
    private final TratamientoRepositorio tratamientos;
    private final HorarioRepositorio horarios;
    private final FeriadoRepositorio feriados;
    private final PacienteRepositorio pacientes;
    private final CitaRepositorio citas;
    private final RecordatorioRepositorio recordatorios;
    private final NotaClinicaRepositorio notas;
    private final UsuarioRepositorio usuarios;
    private final PasswordEncoder passwords;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final Clock reloj;
    private final boolean cargar;

    public DatosDemo(DoctorRepositorio doctores, TratamientoRepositorio tratamientos, HorarioRepositorio horarios,
                     FeriadoRepositorio feriados, PacienteRepositorio pacientes, CitaRepositorio citas,
                     RecordatorioRepositorio recordatorios, NotaClinicaRepositorio notas, UsuarioRepositorio usuarios,
                     PasswordEncoder passwords, JdbcTemplate jdbc, TransactionTemplate tx, Clock reloj,
                     @Value("${app.demo.cargar:true}") boolean cargar) {
        this.doctores = doctores;
        this.tratamientos = tratamientos;
        this.horarios = horarios;
        this.feriados = feriados;
        this.pacientes = pacientes;
        this.citas = citas;
        this.recordatorios = recordatorios;
        this.notas = notas;
        this.usuarios = usuarios;
        this.passwords = passwords;
        this.jdbc = jdbc;
        this.tx = tx;
        this.reloj = reloj;
        this.cargar = cargar;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void alIniciar() {
        if (cargar && doctores.count() == 0) {
            tx.executeWithoutResult(s -> sembrar(20261028L));
            log.info("Datos de demostración cargados");
        }
    }

    /** La demo pública vuelve a su estado inicial cada día a las 4:00 (hora de Lima). */
    @Scheduled(cron = "${app.demo.reinicio-cron:-}", zone = "America/Lima")
    public void reiniciar() {
        tx.executeWithoutResult(s -> {
            for (String tabla : List.of("recordatorio", "nota_clinica", "cita", "paciente", "usuario", "horario",
                    "doctor_tratamiento", "doctor", "tratamiento", "feriado")) {
                jdbc.update("delete from " + tabla);
            }
            sembrar(LocalDate.now(reloj).toEpochDay());
        });
        log.info("Demo reiniciada");
    }

    void sembrar(long semilla) {
        Random r = new Random(semilla);
        LocalDateTime ahora = LocalDateTime.now(reloj);
        LocalDate hoy = ahora.toLocalDate();

        // Tratamientos con precios referenciales en soles.
        Tratamiento evaluacion = t("Evaluación y diagnóstico", "Revisión completa, odontograma y plan de tratamiento.", 30, "50");
        Tratamiento limpieza = t("Limpieza dental", "Profilaxis con ultrasonido y pulido.", 45, "120");
        Tratamiento resina = t("Curación con resina", "Restauración de una pieza con resina del color del diente.", 45, "150");
        Tratamiento endodoncia = t("Endodoncia", "Tratamiento de conducto de una pieza; puede requerir dos sesiones.", 90, "450");
        Tratamiento extraccion = t("Extracción simple", "Extracción de una pieza sin cirugía.", 45, "180");
        Tratamiento controlOrto = t("Control de ortodoncia", "Ajuste mensual de brackets.", 30, "100");
        Tratamiento brackets = t("Instalación de brackets", "Colocación de brackets metálicos en ambas arcadas.", 90, "1200");
        Tratamiento blanqueamiento = t("Blanqueamiento", "Blanqueamiento en consultorio, una sesión.", 60, "600");
        Tratamiento pediatria = t("Consulta odontopediátrica", "Atención para niñas y niños de 3 a 12 años.", 30, "70");

        Doctor paredes = doctor("Dra. Lucía Paredes", "Ortodoncia", "#E7A6C1", evaluacion, controlOrto, brackets);
        Doctor salazar = doctor("Dr. Martín Salazar", "Odontología general", "#8FCFD8",
                evaluacion, limpieza, resina, extraccion, blanqueamiento);
        Doctor rojas = doctor("Dra. Carmen Rojas", "Endodoncia y odontopediatría", "#C4D88A",
                evaluacion, limpieza, resina, endodoncia, pediatria);

        LocalTime m1 = LocalTime.of(9, 0), m2 = LocalTime.of(13, 0), t1 = LocalTime.of(15, 0);
        for (DayOfWeek d : List.of(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY)) {
            horarios.save(new Horario(paredes, d, t1, LocalTime.of(20, 0)));
            horarios.save(new Horario(rojas, d, m1, m2));
        }
        horarios.save(new Horario(paredes, DayOfWeek.SATURDAY, m1, m2));
        for (DayOfWeek d : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
            horarios.save(new Horario(salazar, d, m1, m2));
            horarios.save(new Horario(salazar, d, t1, LocalTime.of(19, 0)));
        }
        horarios.save(new Horario(salazar, DayOfWeek.SATURDAY, m1, m2));
        for (DayOfWeek d : List.of(DayOfWeek.TUESDAY, DayOfWeek.THURSDAY)) {
            horarios.save(new Horario(rojas, d, m1, m2));
            horarios.save(new Horario(rojas, d, t1, LocalTime.of(20, 0)));
        }

        sembrarFeriados(hoy.getYear());
        sembrarFeriados(hoy.getYear() + 1);

        usuarios.save(new Usuario("admin@dentalqori.demo", "Administración", passwords.encode(PASSWORD_DEMO), Usuario.Rol.ADMIN, null));
        usuarios.save(new Usuario("recepcion@dentalqori.demo", "Rocío (recepción)", passwords.encode(PASSWORD_DEMO), Usuario.Rol.RECEPCION, null));
        usuarios.save(new Usuario("doctor@dentalqori.demo", "Dr. Martín Salazar", passwords.encode(PASSWORD_DEMO), Usuario.Rol.DOCTOR, salazar));

        List<Paciente> lista = new ArrayList<>();
        Set<String> dnis = new HashSet<>();
        for (int i = 0; i < 64; i++) {
            String nombres = NOMBRES[r.nextInt(NOMBRES.length)];
            String apellidos = APELLIDOS[r.nextInt(APELLIDOS.length)] + " " + APELLIDOS[r.nextInt(APELLIDOS.length)];
            String dni;
            do {
                dni = String.valueOf(40_000_000 + r.nextInt(39_999_999));
            } while (!dnis.add(dni));
            String celular = "9" + String.format("%08d", r.nextInt(100_000_000));
            Paciente p = new Paciente(nombres, apellidos, r.nextInt(10) < 9 ? dni : null, celular,
                    ahora.minusDays(30 + r.nextInt(500)));
            p.setFechaNac(hoy.minusYears(6 + r.nextInt(60)).minusDays(r.nextInt(365)));
            if (r.nextInt(8) == 0) {
                p.setAlergias(r.nextBoolean() ? "Penicilina" : "Látex");
            }
            lista.add(pacientes.save(p));
        }

        Map<Long, List<Tratamiento>> porDoctor = Map.of(
                paredes.getId(), List.of(controlOrto, controlOrto, controlOrto, evaluacion, brackets),
                salazar.getId(), List.of(limpieza, limpieza, resina, resina, evaluacion, extraccion, blanqueamiento),
                rojas.getId(), List.of(endodoncia, resina, pediatria, pediatria, limpieza, evaluacion));

        int codigo = 0;
        for (LocalDate dia = hoy.minusDays(21); !dia.isAfter(hoy.plusDays(21)); dia = dia.plusDays(1)) {
            if (feriados.existsById(dia)) {
                continue;
            }
            long distancia = dia.toEpochDay() - hoy.toEpochDay();
            double ocupacion = distancia <= 0 ? 0.72 : distancia <= 3 ? 0.6 : Math.max(0.18, 0.5 - distancia * 0.02);
            for (Doctor d : List.of(paredes, salazar, rojas)) {
                for (Horario h : horarios.findByDoctorIdAndDiaSemanaOrderByHoraInicio(d.getId(), (short) dia.getDayOfWeek().getValue())) {
                    LocalTime hora = h.getHoraInicio();
                    while (true) {
                        List<Tratamiento> opciones = porDoctor.get(d.getId());
                        Tratamiento t = opciones.get(r.nextInt(opciones.size()));
                        if (hora.plusMinutes(t.getDuracionMin()).isAfter(h.getHoraFin())) {
                            break;
                        }
                        if (r.nextDouble() < ocupacion) {
                            LocalDateTime inicio = dia.atTime(hora);
                            Paciente p = lista.get(r.nextInt(lista.size()));
                            Cita.Origen origen = r.nextInt(5) < 2 ? Cita.Origen.WEB : Cita.Origen.RECEPCION;
                            LocalDateTime creada = inicio.minusDays(1 + r.nextInt(10)).withHour(9 + r.nextInt(10));
                            if (creada.isAfter(ahora)) {
                                creada = ahora.minusHours(2 + r.nextInt(70));
                            }
                            Cita c = new Cita(String.format("DQ-%06d", 100_000 + (++codigo) * 37), p, d, t, inicio, origen, creada);
                            c.forzarEstado(estadoPara(c, ahora, r));
                            citas.save(c);
                            recordatoriosPara(c, ahora, creada, r);
                            if (c.getEstado() == EstadoCita.ATENDIDA && r.nextInt(3) == 0) {
                                notas.save(new NotaClinica(p, d, c, NOTAS[r.nextInt(NOTAS.length)], c.getFin()));
                            }
                            hora = hora.plusMinutes(t.getDuracionMin());
                        } else {
                            hora = hora.plusMinutes(30);
                        }
                    }
                }
            }
        }
    }

    private EstadoCita estadoPara(Cita c, LocalDateTime ahora, Random r) {
        int x = r.nextInt(100);
        if (!c.getFin().isAfter(ahora)) {
            return x < 86 ? EstadoCita.ATENDIDA : x < 93 ? EstadoCita.NO_ASISTIO : EstadoCita.CANCELADA;
        }
        if (!c.getInicio().isAfter(ahora)) {
            return EstadoCita.EN_ATENCION;
        }
        if (c.getInicio().toLocalDate().equals(ahora.toLocalDate())) {
            return x < 72 ? EstadoCita.CONFIRMADA : EstadoCita.PENDIENTE;
        }
        if (c.getInicio().toLocalDate().equals(ahora.toLocalDate().plusDays(1))) {
            return x < 50 ? EstadoCita.PENDIENTE : x < 95 ? EstadoCita.CONFIRMADA : EstadoCita.CANCELADA;
        }
        return x < 74 ? EstadoCita.PENDIENTE : x < 95 ? EstadoCita.CONFIRMADA : EstadoCita.CANCELADA;
    }

    private void recordatoriosPara(Cita c, LocalDateTime ahora, LocalDateTime creada, Random r) {
        EstadoCita e = c.getEstado();
        Recordatorio confirmacion = new Recordatorio(c, Recordatorio.Tipo.CONFIRMACION, creada);
        boolean futura = c.getInicio().isAfter(ahora);
        boolean confirmacionPendiente = futura && e == EstadoCita.PENDIENTE
                && c.getInicio().isBefore(ahora.plusDays(4)) && r.nextInt(4) == 0;
        if (confirmacionPendiente) {
            recordatorios.save(confirmacion);
        } else {
            confirmacion.marcarEnviado("Rocío (recepción)", creada.plusMinutes(3 + r.nextInt(40)));
            recordatorios.save(confirmacion);
        }
        LocalDateTime previo = c.getInicio().minusHours(24);
        if (previo.isBefore(creada.plusHours(3)) || e == EstadoCita.CANCELADA) {
            return;
        }
        Recordatorio recordatorio = new Recordatorio(c, Recordatorio.Tipo.RECORDATORIO, previo);
        if (!futura) {
            recordatorio.marcarEnviado("Rocío (recepción)", previo.plusMinutes(5 + r.nextInt(90)));
        } else if (previo.isBefore(ahora) && r.nextInt(10) < 7) {
            LocalDateTime enviado = previo.plusMinutes(5 + r.nextInt(60));
            recordatorio.marcarEnviado("Rocío (recepción)", enviado.isAfter(ahora) ? ahora.minusMinutes(10) : enviado);
        }
        recordatorios.save(recordatorio);
    }

    private Tratamiento t(String nombre, String descripcion, int duracion, String precio) {
        return tratamientos.save(new Tratamiento(nombre, descripcion, duracion, new BigDecimal(precio)));
    }

    private Doctor doctor(String nombre, String especialidad, String tinta, Tratamiento... lista) {
        Doctor d = new Doctor(nombre, especialidad, tinta);
        d.getTratamientos().addAll(List.of(lista));
        return doctores.save(d);
    }

    /** Feriados nacionales de Perú. Semana Santa cambia cada año. */
    private void sembrarFeriados(int anio) {
        LocalDate pascua = domingoDePascua(anio);
        Map<LocalDate, String> f = new LinkedHashMap<>();
        f.put(LocalDate.of(anio, 1, 1), "Año Nuevo");
        f.put(pascua.minusDays(3), "Jueves Santo");
        f.put(pascua.minusDays(2), "Viernes Santo");
        f.put(LocalDate.of(anio, 5, 1), "Día del Trabajo");
        f.put(LocalDate.of(anio, 6, 7), "Batalla de Arica y Día de la Bandera");
        f.put(LocalDate.of(anio, 6, 29), "San Pedro y San Pablo");
        f.put(LocalDate.of(anio, 7, 23), "Día de la Fuerza Aérea del Perú");
        f.put(LocalDate.of(anio, 7, 28), "Fiestas Patrias");
        f.put(LocalDate.of(anio, 7, 29), "Fiestas Patrias");
        f.put(LocalDate.of(anio, 8, 6), "Batalla de Junín");
        f.put(LocalDate.of(anio, 8, 30), "Santa Rosa de Lima");
        f.put(LocalDate.of(anio, 10, 8), "Combate de Angamos");
        f.put(LocalDate.of(anio, 11, 1), "Día de Todos los Santos");
        f.put(LocalDate.of(anio, 12, 8), "Inmaculada Concepción");
        f.put(LocalDate.of(anio, 12, 9), "Batalla de Ayacucho");
        f.put(LocalDate.of(anio, 12, 25), "Navidad");
        f.forEach((fecha, nombre) -> feriados.save(new Feriado(fecha, nombre)));
    }

    /** Algoritmo de Meeus/Jones/Butcher para el calendario gregoriano. */
    static LocalDate domingoDePascua(int y) {
        int a = y % 19, b = y / 100, c = y % 100, d = b / 4, e = b % 4, f = (b + 8) / 25, g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30, i = c / 4, k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int mes = (h + l - 7 * m + 114) / 31, dia = ((h + l - 7 * m + 114) % 31) + 1;
        return LocalDate.of(y, mes, dia);
    }
}
