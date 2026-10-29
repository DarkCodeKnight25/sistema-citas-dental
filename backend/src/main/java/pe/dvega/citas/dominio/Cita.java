package pe.dvega.citas.dominio;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class Cita {

    public enum Origen { WEB, RECEPCION }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Tratamiento tratamiento;

    private LocalDateTime inicio;
    private LocalDateTime fin;

    @Enumerated(EnumType.STRING)
    private EstadoCita estado;

    @Enumerated(EnumType.STRING)
    private Origen origen;

    private String nota;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn;

    protected Cita() {
    }

    public Cita(String codigo, Paciente paciente, Doctor doctor, Tratamiento tratamiento,
                LocalDateTime inicio, Origen origen, LocalDateTime ahora) {
        this.codigo = codigo;
        this.paciente = paciente;
        this.doctor = doctor;
        this.tratamiento = tratamiento;
        this.inicio = inicio;
        this.fin = inicio.plusMinutes(tratamiento.getDuracionMin());
        this.estado = EstadoCita.PENDIENTE;
        this.origen = origen;
        this.creadoEn = ahora;
        this.actualizadoEn = ahora;
    }

    public void cambiarEstado(EstadoCita destino, LocalDateTime ahora) {
        if (estado == destino) {
            return;
        }
        if (!estado.puedePasarA(destino)) {
            throw new ReglaNegocioException("No se puede pasar una cita de " + estado + " a " + destino + ".");
        }
        this.estado = destino;
        this.actualizadoEn = ahora;
    }

    public void reprogramar(Doctor nuevoDoctor, LocalDateTime nuevoInicio, LocalDateTime ahora) {
        if (estado.esFinal() || estado == EstadoCita.EN_ATENCION) {
            throw new ReglaNegocioException("Solo se reprograman citas pendientes o confirmadas.");
        }
        this.doctor = nuevoDoctor;
        this.inicio = nuevoInicio;
        this.fin = nuevoInicio.plusMinutes(tratamiento.getDuracionMin());
        // Una cita movida vuelve a pedir confirmación del paciente.
        this.estado = EstadoCita.PENDIENTE;
        this.actualizadoEn = ahora;
    }

    /** Solo para datos de demostración. */
    public void forzarEstado(EstadoCita estado) {
        this.estado = estado;
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public Paciente getPaciente() { return paciente; }
    public Doctor getDoctor() { return doctor; }
    public Tratamiento getTratamiento() { return tratamiento; }
    public LocalDateTime getInicio() { return inicio; }
    public LocalDateTime getFin() { return fin; }
    public EstadoCita getEstado() { return estado; }
    public Origen getOrigen() { return origen; }
    public String getNota() { return nota; }
    public void setNota(String nota) { this.nota = nota; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public LocalDateTime getActualizadoEn() { return actualizadoEn; }
}
