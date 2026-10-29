package pe.dvega.citas.repositorio;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.dvega.citas.dominio.Usuario;

import java.util.Optional;

public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {

    @EntityGraph(attributePaths = {"doctor"})
    Optional<Usuario> findByEmailIgnoreCase(String email);
}
