package pe.dvega.citas.repositorio;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.dvega.citas.dominio.NotaClinica;

import java.util.List;

public interface NotaClinicaRepositorio extends JpaRepository<NotaClinica, Long> {

    @EntityGraph(attributePaths = {"doctor"})
    List<NotaClinica> findByPacienteIdOrderByCreadoEnDesc(Long pacienteId);
}
