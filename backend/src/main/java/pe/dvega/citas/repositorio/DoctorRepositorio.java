package pe.dvega.citas.repositorio;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.dvega.citas.dominio.Doctor;

import java.util.List;
import java.util.Optional;

public interface DoctorRepositorio extends JpaRepository<Doctor, Long> {

    List<Doctor> findByActivoTrueOrderByNombre();

    /** Bloquea la fila del doctor durante la transacción para que dos reservas no tomen el mismo horario. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Doctor d where d.id = :id")
    Optional<Doctor> bloquear(@Param("id") Long id);
}
