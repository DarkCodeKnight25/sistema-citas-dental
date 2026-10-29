package pe.dvega.citas;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import pe.dvega.citas.config.TiempoConfig;

import java.time.Clock;
import java.time.LocalDateTime;

/** Las pruebas corren siempre el miércoles 28 de octubre de 2026 a las 10:00 en Lima. */
@TestConfiguration
public class RelojFijo {

    public static final LocalDateTime AHORA = LocalDateTime.of(2026, 10, 28, 10, 0);

    @Bean
    @Primary
    Clock relojFijo() {
        return Clock.fixed(AHORA.atZone(TiempoConfig.LIMA).toInstant(), TiempoConfig.LIMA);
    }
}
