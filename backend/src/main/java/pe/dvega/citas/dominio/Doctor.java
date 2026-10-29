package pe.dvega.citas.dominio;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String especialidad;

    /** Color fijo que identifica al doctor en la agenda y en la reserva. */
    private String tinta;

    private boolean activo = true;

    @ManyToMany
    @JoinTable(name = "doctor_tratamiento",
            joinColumns = @JoinColumn(name = "doctor_id"),
            inverseJoinColumns = @JoinColumn(name = "tratamiento_id"))
    private Set<Tratamiento> tratamientos = new HashSet<>();

    protected Doctor() {
    }

    public Doctor(String nombre, String especialidad, String tinta) {
        this.nombre = nombre;
        this.especialidad = especialidad;
        this.tinta = tinta;
    }

    public boolean atiende(Tratamiento tratamiento) {
        return tratamientos.stream().anyMatch(t -> t.getId().equals(tratamiento.getId()));
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getEspecialidad() { return especialidad; }
    public void setEspecialidad(String especialidad) { this.especialidad = especialidad; }
    public String getTinta() { return tinta; }
    public void setTinta(String tinta) { this.tinta = tinta; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public Set<Tratamiento> getTratamientos() { return tratamientos; }
}
