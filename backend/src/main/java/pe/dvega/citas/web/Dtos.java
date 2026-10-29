package pe.dvega.citas.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import pe.dvega.citas.dominio.*;
import pe.dvega.citas.servicio.AgendaService;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;

/** Contratos JSON de la API. Las fechas y horas viajan en hora local de Lima, sin zona. */
public final class Dtos {

    private Dtos() {
    }

    /** {@code dias}: días de la semana (1 = lunes) en que el doctor tiene horario; vacío si no se pidió. */
    public record DoctorDto(Long id, String nombre, String especialidad, String tinta, boolean activo,
                            List<Long> tratamientoIds, List<Integer> dias) {
        static DoctorDto de(Doctor d) {
            return de(d, List.of());
        }

        static DoctorDto de(Doctor d, List<Integer> dias) {
            return new DoctorDto(d.getId(), d.getNombre(), d.getEspecialidad(), d.getTinta(), d.isActivo(),
                    d.getTratamientos().stream().map(Tratamiento::getId).sorted().toList(), dias);
        }
    }

    public record TratamientoDto(Long id, String nombre, String descripcion, int duracionMin, BigDecimal precioRef, boolean activo) {
        static TratamientoDto de(Tratamiento t) {
            return new TratamientoDto(t.getId(), t.getNombre(), t.getDescripcion(), t.getDuracionMin(), t.getPrecioRef(), t.isActivo());
        }
    }

    public record PacienteResumen(Long id, String nombres, String apellidos, String dni, String celular) {
        static PacienteResumen de(Paciente p) {
            return new PacienteResumen(p.getId(), p.getNombres(), p.getApellidos(), p.getDni(), p.getCelular());
        }
    }

    public record CitaDto(Long id, String codigo, LocalDateTime inicio, LocalDateTime fin, EstadoCita estado,
                          Cita.Origen origen, String nota, PacienteResumen paciente, Long doctorId,
                          Long tratamientoId, String tratamiento, int duracionMin, LocalDateTime actualizadoEn) {
        static CitaDto de(Cita c) {
            return new CitaDto(c.getId(), c.getCodigo(), c.getInicio(), c.getFin(), c.getEstado(), c.getOrigen(),
                    c.getNota(), PacienteResumen.de(c.getPaciente()), c.getDoctor().getId(),
                    c.getTratamiento().getId(), c.getTratamiento().getNombre(), c.getTratamiento().getDuracionMin(),
                    c.getActualizadoEn());
        }
    }

    public record DisponibilidadDto(LocalDate fecha, String feriado, List<AgendaService.Disponibilidad> doctores) {
    }

    public record DatosPacienteIn(
            @NotBlank @Size(max = 80) String nombres,
            @NotBlank @Size(max = 80) String apellidos,
            @Pattern(regexp = "^$|\\d{8}", message = "El DNI tiene 8 dígitos.") String dni,
            @NotBlank @Pattern(regexp = "9\\d{8}", message = "El celular tiene 9 dígitos y empieza con 9.") String celular) {
    }

    public record ReservaPublicaIn(
            @NotNull Long tratamientoId,
            Long doctorId,
            @NotNull LocalDateTime inicio,
            @NotNull @Valid DatosPacienteIn paciente,
            @Size(max = 400) String nota) {
    }

    public record ReservaPublicaOut(String codigo, LocalDateTime inicio, LocalDateTime fin, String doctor,
                                    String tratamiento, BigDecimal precioRef, String paciente, String direccion,
                                    String referencia, String whatsappClinica) {
    }

    public record CitaNuevaIn(
            @NotNull Long tratamientoId,
            Long doctorId,
            @NotNull LocalDateTime inicio,
            Long pacienteId,
            @Valid DatosPacienteIn paciente,
            @Size(max = 400) String nota) {
    }

    public record EstadoIn(@NotNull EstadoCita estado) {
    }

    public record ReprogramarIn(Long doctorId, @NotNull LocalDateTime inicio) {
    }

    public record RecordatorioDto(Long id, Recordatorio.Tipo tipo, Recordatorio.Estado estado,
                                  LocalDateTime programadoPara, LocalDateTime enviadoEn, String enviadoPor,
                                  CitaDto cita, String mensaje, String enlace) {
    }

    public record NotaDto(Long id, String texto, LocalDateTime creadoEn, Long doctorId, String doctor) {
        static NotaDto de(NotaClinica n) {
            return new NotaDto(n.getId(), n.getTexto(), n.getCreadoEn(), n.getDoctor().getId(), n.getDoctor().getNombre());
        }
    }

    public record NotaIn(@NotBlank @Size(max = 2000) String texto, Long doctorId, Long citaId) {
    }

    public record PacienteDetalle(Long id, String nombres, String apellidos, String dni, String celular,
                                  LocalDate fechaNac, String alergias, LocalDateTime creadoEn,
                                  List<CitaDto> citas, List<NotaDto> notas) {
    }

    public record PacienteIn(
            @NotBlank @Size(max = 80) String nombres,
            @NotBlank @Size(max = 80) String apellidos,
            @Pattern(regexp = "^$|\\d{8}", message = "El DNI tiene 8 dígitos.") String dni,
            @NotBlank @Pattern(regexp = "9\\d{8}", message = "El celular tiene 9 dígitos y empieza con 9.") String celular,
            @Past LocalDate fechaNac,
            @Size(max = 240) String alergias) {
    }

    public record LoginIn(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record UsuarioDto(String email, String nombre, Usuario.Rol rol, Long doctorId) {
        static UsuarioDto de(Usuario u) {
            return new UsuarioDto(u.getEmail(), u.getNombre(), u.getRol(), u.getDoctor() == null ? null : u.getDoctor().getId());
        }
    }

    public record LoginOut(String token, Instant expira, UsuarioDto usuario) {
    }

    public record ClinicaDto(String nombre, String direccion, String referencia, String celular,
                             boolean whatsappDemo, int anticipacionWebMin, LocalDateTime ahora) {
    }

    public record HorarioDto(Long id, int diaSemana, LocalTime horaInicio, LocalTime horaFin) {
        static HorarioDto de(Horario h) {
            return new HorarioDto(h.getId(), h.getDia().getValue(), h.getHoraInicio(), h.getHoraFin());
        }
    }

    public record HorarioIn(@Min(1) @Max(7) int diaSemana, @NotNull LocalTime horaInicio, @NotNull LocalTime horaFin) {
    }

    public record FeriadoDto(LocalDate fecha, String nombre) {
        static FeriadoDto de(Feriado f) {
            return new FeriadoDto(f.getFecha(), f.getNombre());
        }
    }

    public record TratamientoIn(@NotBlank @Size(max = 120) String nombre, @Size(max = 240) String descripcion,
                                @Min(15) @Max(240) int duracionMin, @NotNull @PositiveOrZero BigDecimal precioRef,
                                boolean activo) {
    }

    public record DoctorIn(@NotBlank @Size(max = 120) String nombre, @NotBlank @Size(max = 80) String especialidad,
                           @NotBlank @Pattern(regexp = "#[0-9a-fA-F]{6}") String tinta, boolean activo,
                           @NotNull List<Long> tratamientoIds) {
    }
}
