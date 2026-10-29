package pe.dvega.citas.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pe.dvega.citas.dominio.Recordatorio;
import pe.dvega.citas.servicio.RecordatorioService;
import pe.dvega.citas.servicio.WhatsappService;
import pe.dvega.citas.web.Dtos.CitaDto;
import pe.dvega.citas.web.Dtos.RecordatorioDto;

import java.util.List;

@RestController
@RequestMapping("/api/recordatorios")
@PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
public class RecordatorioController {

    private final RecordatorioService servicio;
    private final WhatsappService whatsapp;

    public RecordatorioController(RecordatorioService servicio, WhatsappService whatsapp) {
        this.servicio = servicio;
        this.whatsapp = whatsapp;
    }

    public record Bandeja(List<RecordatorioDto> porEnviar, List<RecordatorioDto> enviadosHoy) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    Bandeja bandeja() {
        return new Bandeja(servicio.porEnviar().stream().map(this::dto).toList(),
                servicio.enviadosHoy().stream().map(this::dto).toList());
    }

    @PostMapping("/{id}/enviado")
    @Transactional
    RecordatorioDto enviado(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return dto(servicio.marcarEnviado(id, jwt.getClaimAsString("nombre")));
    }

    private RecordatorioDto dto(Recordatorio r) {
        String mensaje = whatsapp.mensaje(r);
        return new RecordatorioDto(r.getId(), r.getTipo(), r.getEstado(), r.getProgramadoPara(), r.getEnviadoEn(),
                r.getEnviadoPor(), CitaDto.de(r.getCita()), mensaje,
                whatsapp.enlace(r.getCita().getPaciente().getCelular(), mensaje));
    }
}
