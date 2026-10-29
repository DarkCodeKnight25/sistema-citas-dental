package pe.dvega.citas.repositorio;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.dvega.citas.dominio.Cita;
import pe.dvega.citas.dominio.EstadoCita;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CitaRepositorio extends JpaRepository<Cita, Long> {

    /** Citas que ocupan el horario de un doctor y se cruzan con el intervalo [desde, hasta). */
    @Query("""
            select c from Cita c
            where c.doctor.id = :doctorId
              and c.estado in :estados
              and c.inicio < :hasta and c.fin > :desde
            order by c.inicio
            """)
    List<Cita> ocupadas(@Param("doctorId") Long doctorId,
                        @Param("desde") LocalDateTime desde,
                        @Param("hasta") LocalDateTime hasta,
                        @Param("estados") Collection<EstadoCita> estados);

    @EntityGraph(attributePaths = {"paciente", "doctor", "tratamiento"})
    @Query("""
            select c from Cita c
            where c.inicio >= :desde and c.inicio < :hasta
              and (:doctorId is null or c.doctor.id = :doctorId)
            order by c.inicio, c.doctor.nombre
            """)
    List<Cita> enRango(@Param("desde") LocalDateTime desde,
                       @Param("hasta") LocalDateTime hasta,
                       @Param("doctorId") Long doctorId);

    @EntityGraph(attributePaths = {"paciente", "doctor", "tratamiento"})
    List<Cita> findByPacienteIdOrderByInicioDesc(Long pacienteId);

    @EntityGraph(attributePaths = {"paciente", "doctor", "tratamiento"})
    Optional<Cita> findByCodigo(String codigo);

    @EntityGraph(attributePaths = {"paciente", "doctor", "tratamiento"})
    @Query("select c from Cita c where c.id = :id")
    Optional<Cita> detalle(@Param("id") Long id);

    boolean existsByCodigo(String codigo);
}
