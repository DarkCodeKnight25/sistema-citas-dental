package pe.dvega.citas.servicio;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.dvega.citas.dominio.Cita;
import pe.dvega.citas.dominio.NoEncontradoException;
import pe.dvega.citas.dominio.Recordatorio;
import pe.dvega.citas.repositorio.RecordatorioRepositorio;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Programa los mensajes de cada cita: una confirmación al registrarla y un recordatorio 24 horas antes.
 * Recepción los envía con un clic; una tarea periódica descarta los que ya no tienen sentido.
 */
@Service
public class RecordatorioService {

    private static final Logger log = LoggerFactory.getLogger(RecordatorioService.class);

    /** Si la cita está a menos de este margen, la confirmación ya cumple la función del recordatorio. */
    static final int HORAS_ANTES = 24;
    static final int MARGEN_MIN_HORAS = 3;

    private final RecordatorioRepositorio repositorio;
    private final Clock reloj;

    public RecordatorioService(RecordatorioRepositorio repositorio, Clock reloj) {
        this.repositorio = repositorio;
        this.reloj = reloj;
    }

    @Transactional
    public void programar(Cita cita) {
        LocalDateTime ahora = LocalDateTime.now(reloj);
        repositorio.save(new Recordatorio(cita, Recordatorio.Tipo.CONFIRMACION, ahora));
        LocalDateTime previo = cita.getInicio().minusHours(HORAS_ANTES);
        if (previo.isAfter(ahora.plusHours(MARGEN_MIN_HORAS))) {
            repositorio.save(new Recordatorio(cita, Recordatorio.Tipo.RECORDATORIO, previo));
        }
    }

    @Transactional
    public void omitirPendientes(Cita cita) {
        repositorio.findByCitaId(cita.getId()).stream()
                .filter(r -> r.getEstado() == Recordatorio.Estado.PENDIENTE)
                .forEach(Recordatorio::omitir);
    }

    /**
     * Mensajes que ya toca enviar. Si una cita tiene pendientes la confirmación y el recordatorio,
     * solo se muestra el recordatorio: un paciente no debe recibir dos mensajes seguidos por la misma cita.
     */
    @Transactional(readOnly = true)
    public List<Recordatorio> porEnviar() {
        List<Recordatorio> todos = repositorio.porEnviar(LocalDateTime.now(reloj));
        Set<Long> conRecordatorio = todos.stream()
                .filter(r -> r.getTipo() == Recordatorio.Tipo.RECORDATORIO)
                .map(r -> r.getCita().getId())
                .collect(Collectors.toSet());
        return todos.stream()
                .filter(r -> r.getTipo() == Recordatorio.Tipo.RECORDATORIO || !conRecordatorio.contains(r.getCita().getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Recordatorio> enviadosHoy() {
        return repositorio.enviadosDesde(LocalDateTime.now(reloj).toLocalDate().atStartOfDay());
    }

    @Transactional
    public Recordatorio marcarEnviado(Long id, String usuario) {
        Recordatorio r = repositorio.findById(id)
                .orElseThrow(() -> new NoEncontradoException("No existe el recordatorio " + id + "."));
        r.marcarEnviado(usuario, LocalDateTime.now(reloj));
        if (r.getTipo() == Recordatorio.Tipo.RECORDATORIO) {
            // El recordatorio ya pide confirmar; la confirmación pendiente sobra.
            repositorio.findByCitaId(r.getCita().getId()).stream()
                    .filter(x -> x.getTipo() == Recordatorio.Tipo.CONFIRMACION && x.getEstado() == Recordatorio.Estado.PENDIENTE)
                    .forEach(Recordatorio::omitir);
        }
        return r;
    }

    /** Cada 10 minutos descarta los mensajes de citas que ya empezaron. */
    @Scheduled(fixedDelayString = "PT10M", initialDelayString = "PT1M")
    @Transactional
    public void limpiarVencidos() {
        List<Recordatorio> vencidos = repositorio.vencidos(LocalDateTime.now(reloj));
        vencidos.forEach(Recordatorio::omitir);
        if (!vencidos.isEmpty()) {
            log.info("Se omitieron {} recordatorios de citas que ya empezaron", vencidos.size());
        }
    }
}
