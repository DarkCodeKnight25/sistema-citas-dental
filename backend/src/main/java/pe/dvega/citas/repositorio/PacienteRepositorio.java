package pe.dvega.citas.repositorio;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.dvega.citas.dominio.Paciente;

import java.util.List;
import java.util.Optional;

public interface PacienteRepositorio extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByDni(String dni);

    Optional<Paciente> findFirstByCelularOrderByIdAsc(String celular);

    @Query("""
            select p from Paciente p
            where lower(concat(p.nombres, ' ', p.apellidos)) like lower(concat('%', :q, '%'))
               or p.dni like concat(:q, '%')
               or p.celular like concat('%', :q, '%')
            order by p.apellidos, p.nombres
            """)
    List<Paciente> buscar(@Param("q") String q, Pageable pagina);

    List<Paciente> findAllByOrderByApellidosAscNombresAsc(Pageable pagina);
}
