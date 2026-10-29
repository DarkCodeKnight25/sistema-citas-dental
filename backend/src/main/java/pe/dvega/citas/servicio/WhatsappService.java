package pe.dvega.citas.servicio;

import org.springframework.stereotype.Service;
import pe.dvega.citas.config.ClinicaProps;
import pe.dvega.citas.dominio.Cita;
import pe.dvega.citas.dominio.Recordatorio;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Arma los mensajes y los enlaces wa.me. Recepción los envía con un clic desde su WhatsApp;
 * más adelante este servicio puede delegar en la API de WhatsApp Business sin cambiar el panel.
 */
@Service
public class WhatsappService {

    private static final Locale ES_PE = Locale.forLanguageTag("es-PE");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM", ES_PE);
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("h:mm a", ES_PE);

    private final ClinicaProps clinica;

    public WhatsappService(ClinicaProps clinica) {
        this.clinica = clinica;
    }

    public String mensaje(Recordatorio recordatorio) {
        Cita c = recordatorio.getCita();
        String nombre = c.getPaciente().getNombres().split(" ")[0];
        String cuando = FECHA.format(c.getInicio()) + " a las " + hora(c);
        return switch (recordatorio.getTipo()) {
            case CONFIRMACION -> """
                    Hola %s, te saluda %s. Registramos tu cita de %s con %s el %s.
                    Código: %s
                    Responde SÍ para confirmarla o escríbenos si necesitas cambiarla."""
                    .formatted(nombre, clinica.nombre(), c.getTratamiento().getNombre().toLowerCase(ES_PE),
                            c.getDoctor().getNombre(), cuando, c.getCodigo());
            case RECORDATORIO -> """
                    Hola %s, te recordamos tu cita de mañana, %s, con %s (%s).
                    Dirección: %s (%s).
                    Responde SÍ para confirmar. Código: %s"""
                    .formatted(nombre, cuando, c.getDoctor().getNombre(),
                            c.getTratamiento().getNombre().toLowerCase(ES_PE),
                            clinica.direccion(), clinica.referencia(), c.getCodigo());
        };
    }

    public String enlace(String celular, String texto) {
        String t = URLEncoder.encode(texto, StandardCharsets.UTF_8).replace("+", "%20");
        if (clinica.whatsappDemo()) {
            return "https://wa.me/?text=" + t;
        }
        return "https://wa.me/51" + celular + "?text=" + t;
    }

    private static String hora(Cita c) {
        // Java usa espacios no separables antes de "a. m."; WhatsApp los muestra mejor como espacios normales.
        return HORA.format(c.getInicio()).replace((char) 0x00A0, ' ').replace((char) 0x202F, ' ');
    }
}
