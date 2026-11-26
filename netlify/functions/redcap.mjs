
// ==========================================
// REDCAP - CLÍNICA DE HERIDAS
// PROYECTO PE 1167 - INDICADOR PE-ID-01
// ==========================================

const MAP = {
    ID_Aplicacion: 'record_id',
    Tipo_Control: 'control',
    Evaluador_Autocontrol: 'evaluador',
    Evaluador_Externo: 'evaluador2_46e',
    Personal_Diligencia: 'personal_que_diligencia',
    Valoracion_Riesgos: 'paquete_instruccional_a_au___2',

    Criterio_N: 'esta_marcado_en_el_ta2_c57',
    Criterio_O: 'esta_identificado_en_2_719',
    Criterio_P: 'est_marcado_en_el_formato',
    Criterio_Q: 'est_marcado_en_la_tarjeta',
    Criterio_R: 'postural',

    Criterio_S: 'motivo_no_postural___5',
    Criterio_T: 'motivo_no_postural___6',
    Criterio_U: 'motivo_no_postural___7',
    Criterio_V: 'motivo_no_postural___1',
    Criterio_W: 'motivo_no_postural___2',
    Criterio_X: 'motivo_no_postural___3',
    Criterio_Y: 'motivo_no_postural___4',

    Criterio_Z: 'se_mantiene_la_ropa_de_cam',
    Criterio_AA: 'el_uso_de_pa_al_est_i2_56a',
    Criterio_AB: 'el_uso_de_pa_al_est_indica',
    Criterio_AC: 'condiciones_del_pa_al',
    Criterio_AD: 'cuenta_con_ap_sitos_multic',
    Criterio_AE: 'durante_procedimiento_quir',
    Criterio_AF: 'educacion_upp',

    Servicio: 'servicio',
    Fecha_Auditoria: 'fecha',

    Percepcion_Sensorial: 'percepcion',
    Humedad: 'humedad',
    Actividad_Fisica: 'actividad',
    Movilidad: 'movilidad',
    Nutricion: 'nutricion',
    Friccion: 'friccion',
    Total_Braden: 'total_riesgo_de_lpp_escala'
};

// ==========================================
// 01. NORMALIZAR TEXTO
// ==========================================

function normalizarTexto(valor) {
    return String(valor ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

// ==========================================
// 02. SERVICIOS SEGÚN EVALUADOR AUTOCONTROL
// ==========================================

const SERVICES = {
    'autocontrol cuidado critico': 'UCI',
    'autocontrol hospitalizacion': 'Hospitalización',
    'autocontrol salas de cirugia': 'Salas de Cirugía',

    '1': 'UCI',
    '2': 'Hospitalización',
    '3': 'Salas de Cirugía'
};

const EVALUADORES = {
    'UCI': 'Autocontrol Cuidado Crítico',
    'Hospitalización': 'Autocontrol Hospitalización',
    'Salas de Cirugía': 'Autocontrol Salas de Cirugía'
};

// ==========================================
// 03. IDENTIFICAR AUTOCONTROL
// ==========================================

function esAutocontrol(valor) {
    return [
        'autocontrol',
        'auto control',
        'auto-control',
        '1'
    ].includes(normalizarTexto(valor));
}

// ==========================================
// 04. IDENTIFICAR PERSONAL DEL SERVICIO
// ==========================================

function esPersonalServicio(valor) {
    return [
        'personal del servicio',
        'personal del mismo servicio',
        '1'
    ].includes(normalizarTexto(valor));
}

// ==========================================
// 05. OBTENER SERVICIO DEL AUTOCONTROL
// ==========================================

function obtenerServicio(evaluador) {
    const valor = normalizarTexto(evaluador);

    return Object.hasOwn(SERVICES, valor)
        ? SERVICES[valor]
        : '';
}

// ==========================================
// 06. CONSULTAR REDCAP
// ==========================================

export async function obtenerDatosRedcap() {

    const apiUrl = process.env.REDCAP_API_URL;
    const token = process.env.REDCAP_API_TOKEN;

    if (!apiUrl || !token) {
        throw new Error(
            'Variables REDCap no configuradas'
        );
    }

    // ======================================
    // FILTROS DIRECTOS EN REDCAP
    // ======================================

    const filterLogic = [
        '[control] = "1"',

        '[personal_que_diligencia] = "1"',

        '[paquete_instruccional_a_au(2)] = "1"',

        '([evaluador] = "1" or ' +
        '[evaluador] = "2" or ' +
        '[evaluador] = "3")'

    ].join(' and ');

    const body = new URLSearchParams({
        token,

        content: 'record',

        format: 'json',

        type: 'flat',

        rawOrLabel: 'label',

        rawOrLabelHeaders: 'raw',

        exportCheckboxLabel: 'false',

        exportSurveyFields: 'false',

        exportDataAccessGroups: 'false',

        returnFormat: 'json',

        filterLogic
    });

    // ======================================
    // CAMPOS SOLICITADOS
    // ======================================

    const fields = [
        ...new Set(
            Object.values(MAP).map(
                field => field.split('___')[0]
            )
        )
    ];

    fields.forEach((field, index) => {
        body.append(`fields[${index}]`, field);
    });

    // ======================================
    // PETICIÓN A REDCAP
    // ======================================

    let response;

    try {

        response = await fetch(apiUrl, {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/x-www-form-urlencoded'
            },

            body,

            signal: AbortSignal.timeout(20000)
        });

    } catch (error) {

        console.error(
            '[REDCap] Error de conexión:',
            error.name
        );

        throw new Error(
            'No fue posible conectar con REDCap'
        );

    }

    if (!response.ok) {

        console.error(
            '[REDCap] Estado HTTP:',
            response.status
        );

        throw new Error(
            `REDCap HTTP ${response.status}`
        );

    }

    // ======================================
    // VALIDAR RESPUESTA
    // ======================================

    let records;

    try {

        records = await response.json();

    } catch {

        throw new Error(
            'REDCap no devolvió un JSON válido'
        );

    }

    if (!Array.isArray(records)) {

        throw new Error(
            'Respuesta REDCap no válida'
        );

    }

    console.log(
        '[REDCap] Registros recibidos:',
        records.length
    );

    // ======================================
    // 07. VALIDAR AUTOCONTROL
    // ======================================

    const autocontroles = records.filter(record =>
        esAutocontrol(record.control)
    );

    console.log(
        '[REDCap] Registros de autocontrol:',
        autocontroles.length
    );

    // ======================================
    // 08. VALIDAR PERSONAL DEL SERVICIO
    // ======================================

    const personalServicio = autocontroles.filter(record =>
        esPersonalServicio(
            record.personal_que_diligencia
        )
    );

    console.log(
        '[REDCap] Personal del servicio:',
        personalServicio.length
    );

    // ======================================
    // 09. TRANSFORMAR REGISTROS
    // ======================================

    const datos = personalServicio.map(record => {

        const row = {};

        for (const [key, field] of Object.entries(MAP)) {

            let value = String(
                record[field] ?? ''
            ).trim();

            // Normalizar respuestas checkbox.

            if (field.includes('___')) {

                const normalizado =
                    normalizarTexto(value);

                if (
                    normalizado === '1' ||
                    normalizado === 'checked'
                ) {

                    value = 'Checked';

                } else if (
                    normalizado === '0' ||
                    normalizado === 'unchecked'
                ) {

                    value = 'Unchecked';

                }

            }

            row[key] = value;

        }

        // ==================================
        // CORRECCIÓN PRINCIPAL
        // ==================================
        //
        // El campo "servicio" de REDCap
        // depende del evaluador externo.
        //
        // Para autocontrol, el servicio
        // se obtiene desde "evaluador".
        // ==================================

        row.Servicio = obtenerServicio(
            row.Evaluador_Autocontrol
        );

        // Normalizar etiquetas después de
        // comprobar los valores originales.

        row.Tipo_Control = 'Autocontrol';

        row.Personal_Diligencia =
            'Personal del Servicio';

        if (row.Servicio) {

            row.Evaluador_Autocontrol =
                EVALUADORES[row.Servicio];

        }

        // No utilizar evaluadores externos.

        row.Evaluador_Externo = '';

        // Normalizar fecha.

        row.Fecha_Auditoria =
            row.Fecha_Auditoria.slice(0, 10);

        row.Aplicacion_Contable = '1';

        return row;

    });

    // ======================================
    // 10. VALIDAR SERVICIOS AUTORIZADOS
    // ======================================

    const serviciosValidos = datos.filter(row =>
        Boolean(row.Servicio)
    );

    console.log(
        '[REDCap] Servicios autorizados:',
        serviciosValidos.length
    );

    // ======================================
    // 11. VALIDAR VALORACIÓN DE RIESGOS
    // ======================================

    const resultado = serviciosValidos.filter(row =>
        row.Valoracion_Riesgos === 'Checked'
    );

    // ======================================
    // 12. DIAGNÓSTICO FINAL
    // ======================================

    console.log(
        '[REDCap] Registros finales:',
        resultado.length
    );

    console.log(
        '[REDCap] Distribución por servicio:',
        {
            UCI: resultado.filter(
                r => r.Servicio === 'UCI'
            ).length,

            Hospitalizacion: resultado.filter(
                r => r.Servicio === 'Hospitalización'
            ).length,

            SalasCirugia: resultado.filter(
                r => r.Servicio === 'Salas de Cirugía'
            ).length
        }
    );

    if (!resultado.length) {

        console.warn(
            '[REDCap] No se encontraron registros ' +
            'que cumplan las condiciones del indicador.'
        );

    }

    // ======================================
    // 13. ENTREGAR DATOS AL DASHBOARD
    // ======================================

    return resultado;

}
