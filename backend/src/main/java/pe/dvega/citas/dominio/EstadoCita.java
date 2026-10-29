package pe.dvega.citas.dominio;

import java.util.EnumSet;
import java.util.Set;

public enum EstadoCita {
    PENDIENTE,
    CONFIRMADA,
    EN_ATENCION,
    ATENDIDA,
    NO_ASISTIO,
    CANCELADA;

    /** Estados que ocupan el horario del doctor. */
    public static final Set<EstadoCita> OCUPAN = EnumSet.of(PENDIENTE, CONFIRMADA, EN_ATENCION, ATENDIDA, NO_ASISTIO);

    public boolean puedePasarA(EstadoCita destino) {
        return switch (this) {
            case PENDIENTE -> EnumSet.of(CONFIRMADA, EN_ATENCION, NO_ASISTIO, CANCELADA).contains(destino);
            case CONFIRMADA -> EnumSet.of(PENDIENTE, EN_ATENCION, NO_ASISTIO, CANCELADA).contains(destino);
            case EN_ATENCION -> destino == ATENDIDA;
            case ATENDIDA, NO_ASISTIO, CANCELADA -> false;
        };
    }

    public boolean esFinal() {
        return this == ATENDIDA || this == NO_ASISTIO || this == CANCELADA;
    }
}
