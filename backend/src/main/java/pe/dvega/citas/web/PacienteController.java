package pe.dvega.citas.web;

import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pe.dvega.citas.dominio.*;
import pe.dvega.citas.repositorio.*;
import pe.dvega.citas.web.Dtos.*;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteRepositorio pacientes;
    private final CitaRepositorio citas;
    private final NotaClinicaRepositorio notas;
    private final DoctorRepositorio doctores;
    private final Clock reloj;

    public PacienteController(PacienteRepositorio pacientes, CitaRepositorio citas, NotaClinicaRepositorio notas,
                              DoctorRepositorio doctores, Clock reloj) {
        this.pacientes = pacientes;
        this.citas = citas;
        this.notas = notas;
        this.doctores = doctores;
        this.reloj = reloj;
    }

    @GetMapping
    @Transactional(readOnly = true)
    List<PacienteResumen> buscar(@RequestParam(defaultValue = "") String q) {
        String texto = q.trim();
        PageRequest pagina = PageRequest.of(0, 50);
        List<Paciente> encontrados = texto.isEmpty()
                ? pacientes.findAllByOrderByApellidosAscNombresAsc(pagina)
                : pacientes.buscar(texto, pagina);
        return encontrados.stream().map(PacienteResumen::de).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    PacienteDetalle detalle(@PathVariable Long id) {
        Paciente p = paciente(id);
        return new PacienteDetalle(p.getId(), p.getNombres(), p.getApellidos(), p.getDni(), p.getCelular(),
                p.getFechaNac(), p.getAlergias(), p.getCreadoEn(),
                citas.findByPacienteIdOrderByInicioDesc(id).stream().map(CitaDto::de).toList(),
                notas.findByPacienteIdOrderByCreadoEnDesc(id).stream().map(NotaDto::de).toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    @Transactional
    PacienteResumen crear(@Valid @RequestBody PacienteIn in) {
        validarDni(in.dni(), null);
        Paciente p = new Paciente(in.nombres().trim(), in.apellidos().trim(), vacioANulo(in.dni()), in.celular(),
                LocalDateTime.now(reloj));
        p.setFechaNac(in.fechaNac());
        p.setAlergias(vacioANulo(in.alergias()));
        return PacienteResumen.de(pacientes.save(p));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
    @Transactional
    PacienteResumen actualizar(@PathVariable Long id, @Valid @RequestBody PacienteIn in) {
        Paciente p = paciente(id);
        validarDni(in.dni(), id);
        p.setNombres(in.nombres().trim());
        p.setApellidos(in.apellidos().trim());
        p.setDni(vacioANulo(in.dni()));
        p.setCelular(in.celular());
        p.setFechaNac(in.fechaNac());
        p.setAlergias(vacioANulo(in.alergias()));
        return PacienteResumen.de(p);
    }

    @PostMapping("/{id}/notas")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Transactional
    NotaDto nota(@PathVariable Long id, @Valid @RequestBody NotaIn in, @AuthenticationPrincipal Jwt jwt) {
        Paciente p = paciente(id);
        Object propio = jwt.getClaims().get("doctorId");
        Long doctorId = propio != null ? ((Number) propio).longValue() : in.doctorId();
        if (doctorId == null) {
            throw new ReglaNegocioException("Indica qué doctor firma la nota.");
        }
        Doctor d = doctores.findById(doctorId).orElseThrow(() -> new NoEncontradoException("No existe el doctor."));
        Cita cita = in.citaId() == null ? null : citas.findById(in.citaId()).orElse(null);
        return NotaDto.de(notas.save(new NotaClinica(p, d, cita, in.texto().trim(), LocalDateTime.now(reloj))));
    }

    private void validarDni(String dni, Long id) {
        String d = vacioANulo(dni);
        if (d != null) {
            pacientes.findByDni(d).filter(otro -> !otro.getId().equals(id)).ifPresent(otro -> {
                throw new ReglaNegocioException("Ya hay un paciente con el DNI " + d + ": " + otro.nombreCompleto() + ".");
            });
        }
    }

    private Paciente paciente(Long id) {
        return pacientes.findById(id).orElseThrow(() -> new NoEncontradoException("No existe el paciente " + id + "."));
    }

    private static String vacioANulo(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
