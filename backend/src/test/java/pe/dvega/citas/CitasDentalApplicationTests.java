package pe.dvega.citas;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import pe.dvega.citas.demo.DatosDemo;
import pe.dvega.citas.demo.DatosDemoAcceso;
import pe.dvega.citas.dominio.*;
import pe.dvega.citas.repositorio.*;
import pe.dvega.citas.servicio.AgendaService;
import pe.dvega.citas.servicio.AgendaService.DatosPaciente;

import java.time.*;
import java.util.List;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Import(RelojFijo.class)
class CitasDentalApplicationTests {

    @Autowired AgendaService agenda;
    @Autowired DatosDemo datosDemo;
    @Autowired TransactionTemplate tx;
    @Autowired JdbcTemplate jdbc;
    @Autowired DoctorRepositorio doctores;
    @Autowired TratamientoRepositorio tratamientos;
    @Autowired CitaRepositorio citas;
    @Autowired RecordatorioRepositorio recordatorios;
    @Autowired pe.dvega.citas.servicio.RecordatorioService recordatorioService;

    private static final DatosPaciente NUEVO = new DatosPaciente("Prueba", "Paciente Ficticio", "", "900000001");

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
    void losDatosDemoNoTienenChoquesDeHorario() {
        for (Doctor d : doctores.findAll()) {
            List<Cita> ocupadas = citas.ocupadas(d.getId(), RelojFijo.AHORA.minusDays(30), RelojFijo.AHORA.plusDays(30),
                    EstadoCita.OCUPAN);
            for (int i = 1; i < ocupadas.size(); i++) {
                assertThat(ocupadas.get(i).getInicio()).as("cita %s de %s", ocupadas.get(i).getCodigo(), d.getNombre())
                        .isAfterOrEqualTo(ocupadas.get(i - 1).getFin());
            }
        }
    }

    @Test
    void reservaEnHoraLibreYRechazaLaMismaHoraDosVeces() {
        Doctor salazar = doctor("Dr. Martín Salazar");
        Tratamiento limpieza = tratamiento("Limpieza dental");
        LocalDate manana = RelojFijo.AHORA.toLocalDate().plusDays(1);
        LocalTime libre = primeraHoraLibre(manana, limpieza, salazar, Cita.Origen.WEB);

        Cita cita = agenda.reservar(NUEVO, null, salazar.getId(), limpieza.getId(), manana.atTime(libre), Cita.Origen.WEB, null);

        assertThat(cita.getEstado()).isEqualTo(EstadoCita.PENDIENTE);
        assertThat(cita.getCodigo()).matches("DQ-[A-Z2-9]{6}");
        assertThat(recordatorios.findByCitaId(cita.getId())).extracting(Recordatorio::getTipo)
                .contains(Recordatorio.Tipo.CONFIRMACION);
        assertThatThrownBy(() -> agenda.reservar(NUEVO, null, salazar.getId(), limpieza.getId(), manana.atTime(libre),
                Cita.Origen.WEB, null)).isInstanceOf(HorarioOcupadoException.class);
    }

    @Test
    void dosReservasSimultaneasDeLaMismaHoraSoloAceptanUna() throws Exception {
        Doctor salazar = doctor("Dr. Martín Salazar");
        Tratamiento evaluacion = tratamiento("Evaluación y diagnóstico");
        LocalDate fecha = RelojFijo.AHORA.toLocalDate().plusDays(2);
        LocalDateTime inicio = fecha.atTime(primeraHoraLibre(fecha, evaluacion, salazar, Cita.Origen.WEB));

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch salida = new CountDownLatch(1);
        Callable<Boolean> intento = () -> {
            salida.await();
            try {
                agenda.reservar(NUEVO, null, salazar.getId(), evaluacion.getId(), inicio, Cita.Origen.WEB, null);
                return true;
            } catch (HorarioOcupadoException e) {
                return false;
            }
        };
        Future<Boolean> a = pool.submit(intento);
        Future<Boolean> b = pool.submit(intento);
        salida.countDown();
        List<Boolean> resultados = List.of(a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS));
        pool.shutdown();

        assertThat(resultados).containsExactlyInAnyOrder(true, false);
    }

    @Test
    void noSeReservaEnFeriadoNiFueraDeHorarioNiSinAnticipacion() {
        Doctor salazar = doctor("Dr. Martín Salazar");
        Tratamiento evaluacion = tratamiento("Evaluación y diagnóstico");

        // 8 de diciembre: Inmaculada Concepción (martes).
        assertThatThrownBy(() -> agenda.reservar(NUEVO, null, salazar.getId(), evaluacion.getId(),
                LocalDateTime.of(2026, 12, 8, 10, 0), Cita.Origen.WEB, null))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("feriado");
        // 13:30 cae en el corte de almuerzo.
        assertThatThrownBy(() -> agenda.reservar(NUEVO, null, salazar.getId(), evaluacion.getId(),
                LocalDateTime.of(2026, 11, 3, 13, 30), Cita.Origen.WEB, null))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("fuera del horario");
        // En línea se reserva con al menos 60 minutos de anticipación.
        assertThatThrownBy(() -> agenda.reservar(NUEVO, null, salazar.getId(), evaluacion.getId(),
                RelojFijo.AHORA.plusMinutes(30), Cita.Origen.WEB, null))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("anticipación");
        // La ortodoncista no hace extracciones.
        assertThatThrownBy(() -> agenda.reservar(NUEVO, null, doctor("Dra. Lucía Paredes").getId(),
                tratamiento("Extracción simple").getId(), LocalDateTime.of(2026, 11, 2, 16, 0), Cita.Origen.WEB, null))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("no realiza");
    }

    @Test
    void laDisponibilidadDeUnFeriadoEstaVacia() {
        assertThat(agenda.disponibilidad(LocalDate.of(2026, 12, 8), tratamiento("Limpieza dental").getId(), null,
                Cita.Origen.WEB)).isEmpty();
    }

    @Test
    void sinDoctorElegidoAsignaAlPrimeroLibre() {
        Tratamiento limpieza = tratamiento("Limpieza dental");
        LocalDate fecha = RelojFijo.AHORA.toLocalDate().plusDays(5);
        LocalTime hora = agenda.disponibilidad(fecha, limpieza.getId(), null, Cita.Origen.WEB).stream()
                .flatMap(d -> d.horas().stream()).findFirst().orElseThrow();

        Cita cita = agenda.reservar(NUEVO, null, null, limpieza.getId(), fecha.atTime(hora), Cita.Origen.WEB, null);

        assertThat(cita.getDoctor().atiende(limpieza)).isTrue();
    }

    @Test
    void lasTransicionesDeEstadoSiguenElFlujo() {
        Doctor salazar = doctor("Dr. Martín Salazar");
        Tratamiento evaluacion = tratamiento("Evaluación y diagnóstico");
        LocalDate fecha = RelojFijo.AHORA.toLocalDate().plusDays(1);
        Cita cita = agenda.reservar(NUEVO, null, salazar.getId(), evaluacion.getId(),
                fecha.atTime(primeraHoraLibre(fecha, evaluacion, salazar, Cita.Origen.RECEPCION)), Cita.Origen.RECEPCION, null);

        agenda.cambiarEstado(cita.getId(), EstadoCita.CONFIRMADA);
        agenda.cambiarEstado(cita.getId(), EstadoCita.EN_ATENCION);
        Cita atendida = agenda.cambiarEstado(cita.getId(), EstadoCita.ATENDIDA);

        assertThat(atendida.getEstado()).isEqualTo(EstadoCita.ATENDIDA);
        assertThat(recordatorios.findByCitaId(cita.getId()))
                .allMatch(r -> r.getEstado() != Recordatorio.Estado.PENDIENTE);
        assertThatThrownBy(() -> agenda.cambiarEstado(cita.getId(), EstadoCita.PENDIENTE))
                .isInstanceOf(ReglaNegocioException.class);
    }

    @Test
    void reprogramarVuelveAPendienteYRehaceLosRecordatorios() {
        Doctor salazar = doctor("Dr. Martín Salazar");
        Tratamiento evaluacion = tratamiento("Evaluación y diagnóstico");
        LocalDate fecha = RelojFijo.AHORA.toLocalDate().plusDays(3);
        Cita cita = agenda.reservar(NUEVO, null, salazar.getId(), evaluacion.getId(),
                fecha.atTime(primeraHoraLibre(fecha, evaluacion, salazar, Cita.Origen.RECEPCION)), Cita.Origen.RECEPCION, null);
        agenda.cambiarEstado(cita.getId(), EstadoCita.CONFIRMADA);

        LocalDate otra = fecha.plusDays(2);
        LocalTime hora = primeraHoraLibre(otra, evaluacion, salazar, Cita.Origen.RECEPCION);
        Cita movida = agenda.reprogramar(cita.getId(), null, otra.atTime(hora));

        assertThat(movida.getEstado()).isEqualTo(EstadoCita.PENDIENTE);
        assertThat(movida.getInicio()).isEqualTo(otra.atTime(hora));
        List<Recordatorio> rs = recordatorios.findByCitaId(cita.getId());
        assertThat(rs).filteredOn(r -> r.getEstado() == Recordatorio.Estado.PENDIENTE)
                .allMatch(r -> !r.getProgramadoPara().isAfter(movida.getInicio()));
        assertThat(rs).filteredOn(r -> r.getEstado() == Recordatorio.Estado.OMITIDO).isNotEmpty();
    }

    @Test
    void laBandejaMuestraUnSoloMensajePorCita() {
        List<Long> citasEnBandeja = tx.execute(s -> recordatorioService.porEnviar().stream()
                .map(r -> r.getCita().getId()).toList());
        assertThat(citasEnBandeja).isNotEmpty().doesNotHaveDuplicates();
    }

    @Test
    void semanaSantaSeCalculaBien() throws Exception {
        var m = DatosDemo.class.getDeclaredMethod("domingoDePascua", int.class);
        m.setAccessible(true);
        assertThat(m.invoke(null, 2026)).isEqualTo(LocalDate.of(2026, 4, 5));
        assertThat(m.invoke(null, 2027)).isEqualTo(LocalDate.of(2027, 3, 28));
    }

    private LocalTime primeraHoraLibre(LocalDate fecha, Tratamiento t, Doctor d, Cita.Origen origen) {
        return agenda.disponibilidad(fecha, t.getId(), d.getId(), origen).get(0).horas().stream().findFirst()
                .orElseThrow(() -> new AssertionError("Sin horas libres el " + fecha));
    }

    private Doctor doctor(String nombre) {
        return tx.execute(s -> {
            Doctor d = doctores.findAll().stream().filter(x -> x.getNombre().equals(nombre)).findFirst().orElseThrow();
            d.getTratamientos().size();
            return d;
        });
    }

    private Tratamiento tratamiento(String nombre) {
        return tratamientos.findAll().stream().filter(x -> x.getNombre().equals(nombre)).findFirst().orElseThrow();
    }
}
