package pe.dvega.citas.web;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pe.dvega.citas.config.ClinicaProps;
import pe.dvega.citas.dominio.Cita;
import pe.dvega.citas.dominio.Feriado;
import pe.dvega.citas.repositorio.DoctorRepositorio;
import pe.dvega.citas.repositorio.FeriadoRepositorio;
import pe.dvega.citas.repositorio.HorarioRepositorio;
import pe.dvega.citas.repositorio.TratamientoRepositorio;
import pe.dvega.citas.servicio.AgendaService;
import pe.dvega.citas.web.Dtos.*;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Lo que usa la página pública de reserva. No requiere sesión. */
@RestController
@RequestMapping("/api/publico")
public class PublicoController {

    private final AgendaService agenda;
    private final DoctorRepositorio doctores;
    private final TratamientoRepositorio tratamientos;
    private final FeriadoRepositorio feriados;
    private final HorarioRepositorio horarios;
    private final ClinicaProps clinica;
    private final Clock reloj;

    public PublicoController(AgendaService agenda, DoctorRepositorio doctores, TratamientoRepositorio tratamientos,
                             FeriadoRepositorio feriados, HorarioRepositorio horarios, ClinicaProps clinica, Clock reloj) {
        this.agenda = agenda;
        this.doctores = doctores;
        this.tratamientos = tratamientos;
        this.feriados = feriados;
        this.horarios = horarios;
        this.clinica = clinica;
        this.reloj = reloj;
    }

    @GetMapping("/clinica")
    ClinicaDto clinica() {
        return new ClinicaDto(clinica.nombre(), clinica.direccion(), clinica.referencia(), clinica.celular(),
                clinica.whatsappDemo(), clinica.anticipacionWebMin(), LocalDateTime.now(reloj));
    }

    @GetMapping("/tratamientos")
    List<TratamientoDto> tratamientos() {
        return tratamientos.findByActivoTrueOrderByNombre().stream().map(TratamientoDto::de).toList();
    }

    @GetMapping("/doctores")
    @Transactional(readOnly = true)
    List<DoctorDto> doctores() {
        return doctores.findByActivoTrueOrderByNombre().stream()
                .map(d -> DoctorDto.de(d, horarios.findByDoctorIdOrderByDiaSemanaAscHoraInicioAsc(d.getId()).stream()
                        .map(h -> h.getDia().getValue()).distinct().toList()))
                .toList();
    }

    @GetMapping("/feriados")
    List<FeriadoDto> feriados() {
        return feriados.findByFechaGreaterThanEqualOrderByFecha(LocalDate.now(reloj)).stream().map(FeriadoDto::de).toList();
    }

    @GetMapping("/disponibilidad")
    DisponibilidadDto disponibilidad(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                                     @RequestParam Long tratamientoId,
                                     @RequestParam(required = false) Long doctorId) {
        String feriado = feriados.findById(fecha).map(Feriado::getNombre).orElse(null);
        return new DisponibilidadDto(fecha, feriado, agenda.disponibilidad(fecha, tratamientoId, doctorId, Cita.Origen.WEB));
    }

    @PostMapping("/reservas")
    @ResponseStatus(HttpStatus.CREATED)
    ReservaPublicaOut reservar(@Valid @RequestBody ReservaPublicaIn in) {
        DatosPacienteIn p = in.paciente();
        Cita c = agenda.reservar(new AgendaService.DatosPaciente(p.nombres(), p.apellidos(), p.dni(), p.celular()),
                null, in.doctorId(), in.tratamientoId(), in.inicio(), Cita.Origen.WEB, in.nota());
        return new ReservaPublicaOut(c.getCodigo(), c.getInicio(), c.getFin(), c.getDoctor().getNombre(),
                c.getTratamiento().getNombre(), c.getTratamiento().getPrecioRef(), c.getPaciente().getNombres(),
                clinica.direccion(), clinica.referencia(), clinica.celular());
    }
}
