package pe.dvega.citas.demo;

import org.springframework.transaction.support.TransactionTemplate;

/** Permite a las pruebas sembrar el consultorio ficticio con una semilla fija. */
public final class DatosDemoAcceso {

    private DatosDemoAcceso() {
    }

    public static void sembrar(DatosDemo datos, TransactionTemplate tx) {
        tx.executeWithoutResult(s -> datos.sembrar(20261028L));
    }
}
