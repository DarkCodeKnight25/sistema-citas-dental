package pe.dvega.citas.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.dvega.citas.dominio.HorarioOcupadoException;
import pe.dvega.citas.dominio.NoEncontradoException;
import pe.dvega.citas.dominio.ReglaNegocioException;

import java.util.LinkedHashMap;
import java.util.Map;

/** Respuestas de error en formato RFC 9457 con mensajes listos para mostrar en pantalla. */
@RestControllerAdvice
public class ManejoErrores {

    @ExceptionHandler(HorarioOcupadoException.class)
    ProblemDetail ocupado(HorarioOcupadoException e) {
        return problema(HttpStatus.CONFLICT, "Horario ocupado", e.getMessage());
    }

    @ExceptionHandler(ReglaNegocioException.class)
    ProblemDetail regla(ReglaNegocioException e) {
        return problema(HttpStatus.UNPROCESSABLE_CONTENT, "No se puede completar", e.getMessage());
    }

    @ExceptionHandler(NoEncontradoException.class)
    ProblemDetail noEncontrado(NoEncontradoException e) {
        return problema(HttpStatus.NOT_FOUND, "No encontrado", e.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    ProblemDetail credenciales(BadCredentialsException e) {
        return problema(HttpStatus.UNAUTHORIZED, "Acceso denegado", e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validacion(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> campos.putIfAbsent(f.getField(), f.getDefaultMessage()));
        ProblemDetail p = problema(HttpStatus.BAD_REQUEST, "Revisa los datos", "Hay campos con errores.");
        p.setProperty("campos", campos);
        return p;
    }

    private static ProblemDetail problema(HttpStatus estado, String titulo, String detalle) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(estado, detalle);
        p.setTitle(titulo);
        return p;
    }
}
