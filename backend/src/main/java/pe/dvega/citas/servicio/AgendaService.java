package pe.dvega.citas.servicio;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.dvega.citas.config.ClinicaProps;
import pe.dvega.citas.dominio.*;
import pe.dvega.citas.repositorio.*;

import java.security.SecureRandom;
import java.time.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Reglas de la agenda: disponibilidad, reservas sin choques, cambios de estado y reprogramaciones. */
@Service
public class AgendaService {

    /** Las horas de inicio se ofrecen cada 30 minutos. */
    static final int PASO_MIN = 30;
    /** Recepción puede registrar a quien llega sin cita hasta 15 minutos después de la hora. */
    static final int TOLERANCIA_RECEPCION_MIN = 15;

    private static final char[] ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();

    private final CitaRepositorio citas;
    private final DoctorRepositorio doctores;
    private final TratamientoRepositorio tratamientos;
    private final HorarioRepositorio horarios;
    private final FeriadoRepositorio feriados;
    private final PacienteRepositorio pacientes;
    private final RecordatorioService recordatorios;
    private final ClinicaProps clinica;
    private final Clock reloj;
    private final SecureRandom azar = new SecureRandom();

    public AgendaService(CitaRepositorio citas, DoctorRepositorio doctores, TratamientoRepositorio tratamientos,
                         HorarioRepositorio horarios, FeriadoRepositorio feriados, PacienteRepositorio pacientes,
                         RecordatorioService recordatorios, ClinicaProps clinica, Clock reloj) {
        this.citas = citas;
        this.doctores = doctores;
        this.tratamientos = tratamientos;
        this.horarios = horarios;
        this.feriados = feriados;
        this.pacientes = pacientes;
        this.recordatorios = recordatorios;
        this.clinica = clinica;
        this.reloj = reloj;
    }

    public record Disponibilidad(Long doctorId, List<LocalTime> horas) {
    }

    public record DatosPaciente(String nombres, String apellidos, String dni, String celular) {
    }

    // ---------- Disponibilidad ----------

    @Transactional(readOnly = true)
    public List<Disponibilidad> disponibilidad(LocalDate fecha, Long tratamientoId, Long doctorId, Cita.Origen origen) {
        Tratamiento tratamiento = tratamiento(tratamientoId);
        if (feriados.existsById(fecha)) {
            return List.of();
        }
        List<Doctor> candidatos = doctorId != null
                ? List.of(doctor(doctorId))
                : doctores.findByActivoTrueOrderByNombre();
        LocalDateTime minimo = minimoPermitido(origen);
        List<Disponibilidad> resultado = new ArrayList<>();
        for (Doctor d : candidatos) {
            if (!d.isActivo() || !d.atiende(tratamiento)) {
                continue;
            }
            List<LocalTime> horas = horasLibres(d, tratamiento, fecha, minimo, null);
            resultado.add(new Disponibilidad(d.getId(), horas));
        }
        return resultado;
    }

    private List<LocalTime> horasLibres(Doctor d, Tratamiento t, LocalDate fecha, LocalDateTime minimo, Long excluirCitaId) {
        List<Horario> bloques = horarios.findByDoctorIdAndDiaSemanaOrderByHoraInicio(
                d.getId(), (short) fecha.getDayOfWeek().getValue());
        if (bloques.isEmpty()) {
            return List.of();
        }
        List<Cita> ocupadas = citas.ocupadas(d.getId(), fecha.atStartOfDay(), fecha.plusDays(1).atStartOfDay(), EstadoCita.OCUPAN)
                .stream().filter(c -> !c.getId().equals(excluirCitaId)).toList();
        List<LocalTime> libres = new ArrayList<>();
        for (Horario b : bloques) {
            for (LocalTime h = b.getHoraInicio(); !h.plusMinutes(t.getDuracionMin()).isAfter(b.getHoraFin()); h = h.plusMinutes(PASO_MIN)) {
                LocalDateTime inicio = fecha.atTime(h);
                LocalDateTime fin = inicio.plusMinutes(t.getDuracionMin());
                if (inicio.isBefore(minimo)) {
                    continue;
                }
                boolean choca = ocupadas.stream().anyMatch(c -> c.getInicio().isBefore(fin) && c.getFin().isAfter(inicio));
                if (!choca) {
                    libres.add(h);
                }
                if (h.plusMinutes(PASO_MIN).isBefore(h)) {
                    break; // pasó la medianoche
                }
            }
        }
        return libres;
    }

    // ---------- Reservas ----------

    @Transactional
    public Cita reservar(DatosPaciente datos, Long pacienteId, Long doctorId, Long tratamientoId,
                         LocalDateTime inicio, Cita.Origen origen, String nota) {
        Tratamiento tratamiento = tratamiento(tratamientoId);
        Paciente paciente = pacienteId != null ? paciente(pacienteId) : buscarOCrearPaciente(datos);
        Doctor doctor = doctorId != null ? doctorBloqueado(doctorId) : primerDoctorLibre(tratamiento, inicio, origen);

        validar(doctor, tratamiento, inicio, origen, null);

        LocalDateTime ahora = LocalDateTime.now(reloj);
        Cita cita = new Cita(nuevoCodigo(), paciente, doctor, tratamiento, inicio, origen, ahora);
        cita.setNota(blancoANulo(nota));
        citas.save(cita);
        recordatorios.programar(cita);
        return cita;
    }

    @Transactional
    public Cita cambiarEstado(Long citaId, EstadoCita destino) {
        Cita cita = cita(citaId);
        cita.cambiarEstado(destino, LocalDateTime.now(reloj));
        if (destino.esFinal() || destino == EstadoCita.EN_ATENCION) {
            recordatorios.omitirPendientes(cita);
        }
        return cita;
    }

    @Transactional
    public Cita reprogramar(Long citaId, Long doctorId, LocalDateTime nuevoInicio) {
        Cita cita = cita(citaId);
        Doctor doctor = doctorBloqueado(doctorId != null ? doctorId : cita.getDoctor().getId());
        validar(doctor, cita.getTratamiento(), nuevoInicio, Cita.Origen.RECEPCION, cita.getId());
        cita.reprogramar(doctor, nuevoInicio, LocalDateTime.now(reloj));
        recordatorios.omitirPendientes(cita);
        recordatorios.programar(cita);
        return cita;
    }

    private void validar(Doctor doctor, Tratamiento tratamiento, LocalDateTime inicio, Cita.Origen origen, Long excluirCitaId) {
        if (!doctor.isActivo()) {
            throw new ReglaNegocioException(doctor.getNombre() + " no está atendiendo.");
        }
        if (!tratamiento.isActivo()) {
            throw new ReglaNegocioException("El tratamiento " + tratamiento.getNombre() + " no está disponible.");
        }
        if (!doctor.atiende(tratamiento)) {
            throw new ReglaNegocioException(doctor.getNombre() + " no realiza " + tratamiento.getNombre().toLowerCase() + ".");
        }
        if (inicio.isBefore(minimoPermitido(origen))) {
            throw new ReglaNegocioException(origen == Cita.Origen.WEB
                    ? "Las reservas en línea se hacen con al menos " + clinica.anticipacionWebMin() + " minutos de anticipación."
                    : "No se puede registrar una cita en una hora que ya pasó.");
        }
        LocalDate fecha = inicio.toLocalDate();
        feriados.findById(fecha).ifPresent(f -> {
            throw new ReglaNegocioException("El " + fecha + " es feriado (" + f.getNombre() + ") y el consultorio no atiende.");
        });
        LocalDateTime fin = inicio.plusMinutes(tratamiento.getDuracionMin());
        boolean dentroDeHorario = horarios.findByDoctorIdAndDiaSemanaOrderByHoraInicio(doctor.getId(), (short) fecha.getDayOfWeek().getValue())
                .stream().anyMatch(h -> fin.toLocalDate().equals(fecha) && h.contiene(inicio.toLocalTime(), fin.toLocalTime()));
        if (!dentroDeHorario) {
            throw new ReglaNegocioException("La cita queda fuera del horario de " + doctor.getNombre() + ".");
        }
        boolean choca = citas.ocupadas(doctor.getId(), inicio, fin, EstadoCita.OCUPAN).stream()
                .anyMatch(c -> !c.getId().equals(excluirCitaId));
        if (choca) {
            throw new HorarioOcupadoException(doctor.getNombre() + " ya tiene una cita en ese horario. Elige otra hora.");
        }
    }

    private Doctor primerDoctorLibre(Tratamiento tratamiento, LocalDateTime inicio, Cita.Origen origen) {
        LocalDateTime minimo = minimoPermitido(origen);
        return doctores.findByActivoTrueOrderByNombre().stream()
                .filter(d -> d.atiende(tratamiento))
                .filter(d -> horasLibres(d, tratamiento, inicio.toLocalDate(), minimo, null).contains(inicio.toLocalTime()))
                .min(Comparator.comparing(Doctor::getId))
                .map(d -> doctorBloqueado(d.getId()))
                .orElseThrow(() -> new HorarioOcupadoException("Ningún doctor tiene libre esa hora. Elige otra."));
    }

    private LocalDateTime minimoPermitido(Cita.Origen origen) {
        LocalDateTime ahora = LocalDateTime.now(reloj);
        return origen == Cita.Origen.WEB
                ? ahora.plusMinutes(clinica.anticipacionWebMin())
                : ahora.minusMinutes(TOLERANCIA_RECEPCION_MIN);
    }

    private Paciente buscarOCrearPaciente(DatosPaciente datos) {
        if (datos == null) {
            throw new ReglaNegocioException("Faltan los datos del paciente.");
        }
        String dni = blancoANulo(datos.dni());
        if (dni != null) {
            var existente = pacientes.findByDni(dni);
            if (existente.isPresent()) {
                Paciente p = existente.get();
                p.setCelular(datos.celular());
                return p;
            }
        }
        return pacientes.save(new Paciente(datos.nombres().trim(), datos.apellidos().trim(), dni,
                datos.celular(), LocalDateTime.now(reloj)));
    }

    private String nuevoCodigo() {
        String codigo;
        do {
            StringBuilder sb = new StringBuilder("DQ-");
            for (int i = 0; i < 6; i++) {
                sb.append(ALFABETO[azar.nextInt(ALFABETO.length)]);
            }
            codigo = sb.toString();
        } while (citas.existsByCodigo(codigo));
        return codigo;
    }

    private static String blancoANulo(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private Doctor doctor(Long id) {
        return doctores.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el doctor " + id + "."));
    }

    private Doctor doctorBloqueado(Long id) {
        return doctores.bloquear(id).orElseThrow(() -> new NoEncontradoException("No existe el doctor " + id + "."));
    }

    private Tratamiento tratamiento(Long id) {
        return tratamientos.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el tratamiento " + id + "."));
    }

    private Paciente paciente(Long id) {
        return pacientes.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el paciente " + id + "."));
    }

    private Cita cita(Long id) {
        return citas.detalle(id).orElseThrow(() -> new NoEncontradoException("No existe la cita " + id + "."));
    }
}
