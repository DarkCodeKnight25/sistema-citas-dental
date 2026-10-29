package pe.dvega.citas.web;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.support.TransactionTemplate;
import pe.dvega.citas.RelojFijo;
import pe.dvega.citas.demo.DatosDemo;
import pe.dvega.citas.demo.DatosDemoAcceso;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Import(RelojFijo.class)
class ApiTests {

    @Autowired MockMvcTester mvc;
    @Autowired DatosDemo datosDemo;
    @Autowired TransactionTemplate tx;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void sembrar() {
        limpiar();
        DatosDemoAcceso.sembrar(datosDemo, tx);
    }

    @AfterEach
    void limpiar() {
        for (String tabla : List.of("recordatorio", "nota_clinica", "cita", "paciente", "usuario", "horario",
                "doctor_tratamiento", "doctor", "tratamiento", "feriado")) {
            jdbc.update("delete from " + tabla);
        }
    }

    @Test
    void lasRutasPublicasNoPidenSesion() {
        assertThat(mvc.get().uri("/api/publico/tratamientos")).hasStatusOk()
                .bodyJson().extractingPath("$.length()").isEqualTo(9);
        assertThat(mvc.get().uri("/api/publico/clinica")).hasStatusOk()
                .bodyJson().extractingPath("$.nombre").isEqualTo("Dental Qori");
        // Lleva los tratamientos (relación perezosa) y los días con horario de cada doctor.
        assertThat(mvc.get().uri("/api/publico/doctores")).hasStatusOk()
                .bodyJson().extractingPath("$[?(@.nombre == 'Dra. Lucía Paredes')].dias[*]").asArray()
                .containsExactlyInAnyOrder(1, 3, 5, 6);
    }

    @Test
    void elPanelPideSesion() {
        assertThat(mvc.get().uri("/api/citas?desde=2026-10-28&hasta=2026-10-28")).hasStatus(401);
    }

    @Test
    void loginCorrectoEntregaTokenYLoginIncorrectoNo() throws Exception {
        assertThat(mvc.post().uri("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"recepcion@dentalqori.demo\",\"password\":\"mala\"}")).hasStatus(401);

        String token = token("recepcion@dentalqori.demo");
        assertThat(mvc.get().uri("/api/citas?desde=2026-10-28&hasta=2026-10-28").header("Authorization", "Bearer " + token))
                .hasStatusOk();
        assertThat(mvc.get().uri("/api/recordatorios").header("Authorization", "Bearer " + token)).hasStatusOk();
    }

    @Test
    void unDoctorNoPuedeCrearCitasNiVerRecordatorios() throws Exception {
        String token = token("doctor@dentalqori.demo");
        assertThat(mvc.post().uri("/api/citas").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tratamientoId\":1,\"inicio\":\"2026-11-02T09:00:00\",\"pacienteId\":1}")).hasStatus(403);
        assertThat(mvc.get().uri("/api/recordatorios").header("Authorization", "Bearer " + token)).hasStatus(403);
    }

    @Test
    void unaReservaConCelularInvalidoDevuelveErroresPorCampo() {
        assertThat(mvc.post().uri("/api/publico/reservas").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"tratamientoId":1,"inicio":"2026-11-02T09:00:00",
                         "paciente":{"nombres":"Ana","apellidos":"Prueba","dni":"","celular":"12345"}}"""))
                .hasStatus(400)
                .bodyJson().extractingPath("$.campos['paciente.celular']").asString().contains("9 dígitos");
    }

    private String token(String email) throws Exception {
        var r = mvc.post().uri("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + DatosDemo.PASSWORD_DEMO + "\"}").exchange();
        assertThat(r).hasStatusOk();
        return com.jayway.jsonpath.JsonPath.read(r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8), "$.token");
    }
}
