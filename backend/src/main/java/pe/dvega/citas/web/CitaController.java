package pe.dvega.citas.web;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pe.dvega.citas.dominio.Cita;
import pe.dvega.citas.dominio.ReglaNegocioException;
import pe.dvega.citas.repositorio.CitaRepositorio;
import pe.dvega.citas.repositorio.FeriadoRepositorio;
import pe.dvega.citas.servicio.AgendaService;
import pe.dvega.citas.web.Dtos.*;

import java.time.LocalDate;
import java.util.List;

/** Agenda del panel: recepción y administración gestionan; los doctores consultan. */
@RestController
@RequestMapping("/api/citas")
public class CitaController {

    private static final int MAX_DIAS = 42;

    private final AgendaService agenda;
    private final CitaRepositorio citas;
    private final FeriadoRepositorio feriados;

    public CitaController(AgendaService agenda, CitaRepositorio citas, FeriadoRepositorio feriados) {
        this.agenda = agenda;
        this.citas = citas;
        this.feriados = feriados;
    }

    @GetMapping
    @Transactional(readOnly = true)
    List<CitaDto> rango(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                        @RequestParam(required = false) Long doctorId) {
        if (hasta.isBefore(desde) || desde.plusDays(MAX_DIAS).isBefore(hasta)) {
            throw new ReglaNegocioException("El rango debe ir de 1 a " + MAX_DIAS + " días.");
        }
        return citas.enRango(desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay(), doctorId)
                .stream().map(CitaDto::de).toList();
    }

    @GetMapping("/disponibilidad")
    DisponibilidadDto disponibilidad(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                                     @RequestParam Long tratamientoId,
                                     @RequestParam(required = false) Long doctorId) {
        String feriado = feriados.findById(fecha).map(f -> f.getNombre()).orElse(null);
        return new DisponibilidadDto(fecha, feriado, agenda.disponibilidad(fecha, tratamientoId, doctorId, Cita.Origen.RECEPCION));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    CitaDto crear(@Valid @RequestBody CitaNuevaIn in) {
        AgendaService.DatosPaciente datos = in.paciente() == null ? null : new AgendaService.DatosPaciente(
                in.paciente().nombres(), in.paciente().apellidos(), in.paciente().dni(), in.paciente().celular());
        return CitaDto.de(agenda.reservar(datos, in.pacienteId(), in.doctorId(), in.tratamientoId(), in.inicio(),
                Cita.Origen.RECEPCION, in.nota()));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION','DOCTOR')")
    CitaDto estado(@PathVariable Long id, @Valid @RequestBody EstadoIn in) {
        return CitaDto.de(agenda.cambiarEstado(id, in.estado()));
    }

    @PutMapping("/{id}/horario")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    CitaDto reprogramar(@PathVariable Long id, @Valid @RequestBody ReprogramarIn in) {
        return CitaDto.de(agenda.reprogramar(id, in.doctorId(), in.inicio()));
    }
}
