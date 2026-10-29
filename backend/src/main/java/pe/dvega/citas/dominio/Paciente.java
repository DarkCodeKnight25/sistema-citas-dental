package pe.dvega.citas.dominio;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombres;
    private String apellidos;
    private String dni;

    /** Celular peruano de 9 dígitos, sin el prefijo +51. */
    private String celular;

    @Column(name = "fecha_nac")
    private LocalDate fechaNac;

    private String alergias;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn;

    protected Paciente() {
    }

    public Paciente(String nombres, String apellidos, String dni, String celular, LocalDateTime creadoEn) {
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.dni = dni;
        this.celular = celular;
        this.creadoEn = creadoEn;
    }

    public String nombreCompleto() {
        return nombres + " " + apellidos;
    }

    public Long getId() { return id; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getCelular() { return celular; }
    public void setCelular(String celular) { this.celular = celular; }
    public LocalDate getFechaNac() { return fechaNac; }
    public void setFechaNac(LocalDate fechaNac) { this.fechaNac = fechaNac; }
    public String getAlergias() { return alergias; }
    public void setAlergias(String alergias) { this.alergias = alergias; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
