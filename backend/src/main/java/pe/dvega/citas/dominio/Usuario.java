package pe.dvega.citas.dominio;

import jakarta.persistence.*;

@Entity
public class Usuario {

    public enum Rol { ADMIN, RECEPCION, DOCTOR }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String nombre;

    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Rol rol;

    /** Solo para usuarios con rol DOCTOR. */
    @ManyToOne(fetch = FetchType.LAZY)
    private Doctor doctor;

    protected Usuario() {
    }

    public Usuario(String email, String nombre, String passwordHash, Rol rol, Doctor doctor) {
        this.email = email;
        this.nombre = nombre;
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.doctor = doctor;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getNombre() { return nombre; }
    public String getPasswordHash() { return passwordHash; }
    public Rol getRol() { return rol; }
    public Doctor getDoctor() { return doctor; }
}
