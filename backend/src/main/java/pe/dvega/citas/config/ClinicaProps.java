package pe.dvega.citas.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Datos del consultorio y del modo demo.
 *
 * @param whatsappDemo si es true, los enlaces wa.me no llevan número: WhatsApp pide elegir el contacto,
 *                     así la demo nunca escribe a un celular real.
 */
@ConfigurationProperties(prefix = "app.clinica")
public record ClinicaProps(
        String nombre,
        String direccion,
        String referencia,
        String celular,
        boolean whatsappDemo,
        int anticipacionWebMin
) {
}
