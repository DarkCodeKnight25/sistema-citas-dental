package pe.dvega.citas.web;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pe.dvega.citas.dominio.*;
import pe.dvega.citas.repositorio.*;
import pe.dvega.citas.web.Dtos.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;

/** Configuración del consultorio: tratamientos, doctores, horarios y feriados. */
@RestController
@RequestMapping("/api/ajustes")
public class AjustesController {

    private final TratamientoRepositorio tratamientos;
    private final DoctorRepositorio doctores;
    private final HorarioRepositorio horarios;
    private final FeriadoRepositorio feriados;

    public AjustesController(TratamientoRepositorio tratamientos, DoctorRepositorio doctores,
                             HorarioRepositorio horarios, FeriadoRepositorio feriados) {
        this.tratamientos = tratamientos;
        this.doctores = doctores;
        this.horarios = horarios;
        this.feriados = feriados;
    }

    @GetMapping("/tratamientos")
    List<TratamientoDto> tratamientos() {
        return tratamientos.findAll().stream().map(TratamientoDto::de)
                .sorted((a, b) -> a.nombre().compareToIgnoreCase(b.nombre())).toList();
    }

    @PostMapping("/tratamientos")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    TratamientoDto crearTratamiento(@Valid @RequestBody TratamientoIn in) {
        Tratamiento t = new Tratamiento(in.nombre().trim(), in.descripcion(), in.duracionMin(), in.precioRef());
        t.setActivo(in.activo());
        return TratamientoDto.de(tratamientos.save(t));
    }

    @PutMapping("/tratamientos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    TratamientoDto editarTratamiento(@PathVariable Long id, @Valid @RequestBody TratamientoIn in) {
        Tratamiento t = tratamientos.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el tratamiento."));
        t.setNombre(in.nombre().trim());
        t.setDescripcion(in.descripcion());
        t.setDuracionMin(in.duracionMin());
        t.setPrecioRef(in.precioRef());
        t.setActivo(in.activo());
        return TratamientoDto.de(t);
    }

    @GetMapping("/doctores")
    @Transactional(readOnly = true)
    List<DoctorDto> doctores() {
        return doctores.findAll().stream().map(DoctorDto::de)
                .sorted((a, b) -> a.nombre().compareToIgnoreCase(b.nombre())).toList();
    }

    @PutMapping("/doctores/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    DoctorDto editarDoctor(@PathVariable Long id, @Valid @RequestBody DoctorIn in) {
        Doctor d = doctores.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el doctor."));
        d.setNombre(in.nombre().trim());
        d.setEspecialidad(in.especialidad().trim());
        d.setTinta(in.tinta());
        d.setActivo(in.activo());
        d.getTratamientos().clear();
        d.getTratamientos().addAll(new HashSet<>(tratamientos.findAllById(in.tratamientoIds())));
        return DoctorDto.de(d);
    }

    @GetMapping("/doctores/{id}/horario")
    List<HorarioDto> horario(@PathVariable Long id) {
        return horarios.findByDoctorIdOrderByDiaSemanaAscHoraInicioAsc(id).stream().map(HorarioDto::de).toList();
    }

    /** Reemplaza el horario semanal completo del doctor. */
    @PutMapping("/doctores/{id}/horario")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    List<HorarioDto> reemplazarHorario(@PathVariable Long id, @Valid @RequestBody List<@Valid HorarioIn> bloques) {
        Doctor d = doctores.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el doctor."));
        for (HorarioIn b : bloques) {
            if (!b.horaFin().isAfter(b.horaInicio())) {
                throw new ReglaNegocioException("Cada bloque debe terminar después de empezar.");
            }
            boolean cruza = bloques.stream().anyMatch(o -> o != b && o.diaSemana() == b.diaSemana()
                    && o.horaInicio().isBefore(b.horaFin()) && o.horaFin().isAfter(b.horaInicio()));
            if (cruza) {
                throw new ReglaNegocioException("Hay bloques que se cruzan el mismo día.");
            }
        }
        horarios.deleteByDoctorId(id);
        horarios.flush();
        bloques.forEach(b -> horarios.save(new Horario(d, DayOfWeek.of(b.diaSemana()), b.horaInicio(), b.horaFin())));
        return horario(id);
    }

    @GetMapping("/feriados")
    List<FeriadoDto> feriados() {
        return feriados.findAll().stream().map(FeriadoDto::de)
                .sorted((a, b) -> a.fecha().compareTo(b.fecha())).toList();
    }

    @PostMapping("/feriados")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    FeriadoDto crearFeriado(@Valid @RequestBody FeriadoDto in) {
        if (in.fecha() == null || in.nombre() == null || in.nombre().isBlank()) {
            throw new ReglaNegocioException("Indica la fecha y el nombre del feriado.");
        }
        return FeriadoDto.de(feriados.save(new Feriado(in.fecha(), in.nombre().trim())));
    }

    @DeleteMapping("/feriados/{fecha}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    void borrarFeriado(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        feriados.deleteById(fecha);
    }
}
