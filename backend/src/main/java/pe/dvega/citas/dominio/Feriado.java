package pe.dvega.citas.dominio;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.time.LocalDate;

@Entity
public class Feriado {

    @Id
    private LocalDate fecha;

    private String nombre;

    protected Feriado() {
    }

    public Feriado(LocalDate fecha, String nombre) {
        this.fecha = fecha;
        this.nombre = nombre;
    }

    public LocalDate getFecha() { return fecha; }
    public String getNombre() { return nombre; }
}
