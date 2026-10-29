package pe.dvega.citas.repositorio;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.dvega.citas.dominio.Recordatorio;

import java.time.LocalDateTime;
import java.util.List;

public interface RecordatorioRepositorio extends JpaRepository<Recordatorio, Long> {

    @EntityGraph(attributePaths = {"cita", "cita.paciente", "cita.doctor", "cita.tratamiento"})
    @Query("""
            select r from Recordatorio r
            where r.estado = pe.dvega.citas.dominio.Recordatorio.Estado.PENDIENTE
              and r.programadoPara <= :hasta
            order by r.cita.inicio
            """)
    List<Recordatorio> porEnviar(@Param("hasta") LocalDateTime hasta);

    @EntityGraph(attributePaths = {"cita", "cita.paciente", "cita.doctor", "cita.tratamiento"})
    @Query("""
            select r from Recordatorio r
            where r.estado = pe.dvega.citas.dominio.Recordatorio.Estado.ENVIADO
              and r.enviadoEn >= :desde
            order by r.enviadoEn desc
            """)
    List<Recordatorio> enviadosDesde(@Param("desde") LocalDateTime desde);

    @Query("""
            select r from Recordatorio r
            where r.estado = pe.dvega.citas.dominio.Recordatorio.Estado.PENDIENTE
              and r.cita.inicio < :limite
            """)
    List<Recordatorio> vencidos(@Param("limite") LocalDateTime limite);

    List<Recordatorio> findByCitaId(Long citaId);
}
