package pe.dvega.citas.dominio;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class Recordatorio {

    public enum Tipo { CONFIRMACION, RECORDATORIO }

    public enum Estado { PENDIENTE, ENVIADO, OMITIDO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Cita cita;

    @Enumerated(EnumType.STRING)
    private Tipo tipo;

    @Column(name = "programado_para")
    private LocalDateTime programadoPara;

    @Enumerated(EnumType.STRING)
    private Estado estado = Estado.PENDIENTE;

    @Column(name = "enviado_en")
    private LocalDateTime enviadoEn;

    @Column(name = "enviado_por")
    private String enviadoPor;

    protected Recordatorio() {
    }

    public Recordatorio(Cita cita, Tipo tipo, LocalDateTime programadoPara) {
        this.cita = cita;
        this.tipo = tipo;
        this.programadoPara = programadoPara;
    }

    public void marcarEnviado(String usuario, LocalDateTime ahora) {
        if (estado != Estado.PENDIENTE) {
            throw new ReglaNegocioException("Este recordatorio ya no está pendiente.");
        }
        this.estado = Estado.ENVIADO;
        this.enviadoEn = ahora;
        this.enviadoPor = usuario;
    }

    public void omitir() {
        this.estado = Estado.OMITIDO;
    }

    public Long getId() { return id; }
    public Cita getCita() { return cita; }
    public Tipo getTipo() { return tipo; }
    public LocalDateTime getProgramadoPara() { return programadoPara; }
    public Estado getEstado() { return estado; }
    public LocalDateTime getEnviadoEn() { return enviadoEn; }
    public String getEnviadoPor() { return enviadoPor; }
}
