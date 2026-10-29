package pe.dvega.citas.dominio;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "nota_clinica")
public class NotaClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    private Cita cita;

    private String texto;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn;

    protected NotaClinica() {
    }

    public NotaClinica(Paciente paciente, Doctor doctor, Cita cita, String texto, LocalDateTime creadoEn) {
        this.paciente = paciente;
        this.doctor = doctor;
        this.cita = cita;
        this.texto = texto;
        this.creadoEn = creadoEn;
    }

    public Long getId() { return id; }
    public Paciente getPaciente() { return paciente; }
    public Doctor getDoctor() { return doctor; }
    public Cita getCita() { return cita; }
    public String getTexto() { return texto; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
