package pe.dvega.citas.dominio;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
public class Tratamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String descripcion;

    @Column(name = "duracion_min")
    private int duracionMin;

    /** Precio de referencia en soles; el precio final lo define el doctor tras la evaluación. */
    @Column(name = "precio_ref")
    private BigDecimal precioRef;

    private boolean activo = true;

    protected Tratamiento() {
    }

    public Tratamiento(String nombre, String descripcion, int duracionMin, BigDecimal precioRef) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.duracionMin = duracionMin;
        this.precioRef = precioRef;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public int getDuracionMin() { return duracionMin; }
    public void setDuracionMin(int duracionMin) { this.duracionMin = duracionMin; }
    public BigDecimal getPrecioRef() { return precioRef; }
    public void setPrecioRef(BigDecimal precioRef) { this.precioRef = precioRef; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
}
