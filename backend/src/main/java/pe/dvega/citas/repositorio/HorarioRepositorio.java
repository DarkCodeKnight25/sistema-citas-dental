package pe.dvega.citas.repositorio;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.dvega.citas.dominio.Horario;

import java.util.List;

public interface HorarioRepositorio extends JpaRepository<Horario, Long> {

    List<Horario> findByDoctorIdOrderByDiaSemanaAscHoraInicioAsc(Long doctorId);

    List<Horario> findByDoctorIdAndDiaSemanaOrderByHoraInicio(Long doctorId, short diaSemana);

    void deleteByDoctorId(Long doctorId);
}
