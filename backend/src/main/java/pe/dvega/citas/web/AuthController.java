package pe.dvega.citas.web;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pe.dvega.citas.servicio.AuthService;
import pe.dvega.citas.web.Dtos.LoginIn;
import pe.dvega.citas.web.Dtos.LoginOut;
import pe.dvega.citas.web.Dtos.UsuarioDto;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/login")
    LoginOut login(@Valid @RequestBody LoginIn in) {
        AuthService.Sesion s = auth.login(in.email(), in.password());
        return new LoginOut(s.token(), s.expira(), UsuarioDto.de(s.usuario()));
    }

    @GetMapping("/yo")
    UsuarioDto yo(@AuthenticationPrincipal Jwt jwt) {
        return UsuarioDto.de(auth.actual(jwt.getSubject()));
    }
}
