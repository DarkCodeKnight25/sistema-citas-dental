package pe.dvega.citas.repositorio;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.dvega.citas.dominio.Tratamiento;

import java.util.List;

public interface TratamientoRepositorio extends JpaRepository<Tratamiento, Long> {

    List<Tratamiento> findByActivoTrueOrderByNombre();
}
