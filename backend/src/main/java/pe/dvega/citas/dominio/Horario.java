package pe.dvega.citas.dominio;

import jakarta.persistence.*;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
public class Horario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Doctor doctor;

    /** 1 = lunes ... 7 = domingo (ISO-8601). */
    @Column(name = "dia_semana")
    private short diaSemana;

    @Column(name = "hora_inicio")
    private LocalTime horaInicio;

    @Column(name = "hora_fin")
    private LocalTime horaFin;

    protected Horario() {
    }

    public Horario(Doctor doctor, DayOfWeek dia, LocalTime horaInicio, LocalTime horaFin) {
        this.doctor = doctor;
        this.diaSemana = (short) dia.getValue();
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
    }

    public boolean contiene(LocalTime inicio, LocalTime fin) {
        return !inicio.isBefore(horaInicio) && !fin.isAfter(horaFin);
    }

    public Long getId() { return id; }
    public Doctor getDoctor() { return doctor; }
    public DayOfWeek getDia() { return DayOfWeek.of(diaSemana); }
    public LocalTime getHoraInicio() { return horaInicio; }
    public LocalTime getHoraFin() { return horaFin; }
}
