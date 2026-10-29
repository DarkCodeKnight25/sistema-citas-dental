package pe.dvega.citas.repositorio;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.dvega.citas.dominio.Feriado;

import java.time.LocalDate;
import java.util.List;

public interface FeriadoRepositorio extends JpaRepository<Feriado, LocalDate> {

    List<Feriado> findByFechaGreaterThanEqualOrderByFecha(LocalDate desde);

    List<Feriado> findByFechaBetweenOrderByFecha(LocalDate desde, LocalDate hasta);
}
