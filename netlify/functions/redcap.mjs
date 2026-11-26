
// ==========================================
// CLÍNICA DE HERIDAS - HUN
// CONEXIÓN REDCAP - PE 1167
// INDICADOR PE-ID-01
// ==========================================

const MAP = {

    ID_Aplicacion: 'record_id',
    Tipo_Control: 'control',
    Evaluador_Autocontrol: 'evaluador',
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
// 01. SERVICIOS AUTORIZADOS
// ==========================================

const SERVICES = {

    'cuidado critico': 'UCI',
    'uci': 'UCI',
    'hospitalizacion': 'Hospitalización',
    'salas de cirugia': 'Salas de Cirugía'

};

// ==========================================
// 02. NORMALIZACIÓN DE TEXTOS
// ==========================================

function normalizarTexto(valor) {

    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

}

// ==========================================
// 03. VALIDAR AUTOCONTROL
// ==========================================

function esAutocontrol(valor) {

    const control = normalizarTexto(valor);

    return [
        'autocontrol',
        'auto control',
        'auto-control'
    ].includes(control);

}

// ==========================================
// 04. NORMALIZAR SERVICIO
// ==========================================

function normalizarServicio(valor) {

    const servicio = normalizarTexto(valor);

    return Object.hasOwn(SERVICES, servicio)
        ? SERVICES[servicio]
        : '';

}

// ==========================================
// 05. NORMALIZAR CHECKBOX REDCAP
// ==========================================

function normalizarCheckbox(valor) {

    const respuesta = normalizarTexto(valor);

    if (
        respuesta === '1' ||
        respuesta === 'checked'
    ) {

        return 'Checked';

    }

    if (
        respuesta === '0' ||
        respuesta === 'unchecked'
    ) {

        return 'Unchecked';

    }

    return String(valor ?? '').trim();

}

// ==========================================
// 06. OBTENER DATOS DESDE REDCAP
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
    // CONFIGURACIÓN DE LA CONSULTA
    // ======================================

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

        filterLogic:
            '[paquete_instruccional_a_au(2)] = "1"'

    });

    // ======================================
    // SOLICITAR ÚNICAMENTE CAMPOS NECESARIOS
    // ======================================

    const fields = [

        ...new Set(

            Object.values(MAP).map(

                field => field.split('___')[0]

            )

        )

    ];

    fields.forEach((field, index) => {

        body.append(
            `fields[${index}]`,
            field
        );

    });

    // ======================================
    // CONSULTA A REDCAP
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
            '[REDCap] Error HTTP:',
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
    // FILTRAR ÚNICAMENTE AUTOCONTROL
    // ======================================

    const registrosAutocontrol = records.filter(

        record => esAutocontrol(record.control)

    );

    console.log(
        '[REDCap] Registros de autocontrol:',
        registrosAutocontrol.length
    );

    // ======================================
    // PROCESAR REGISTROS
    // ======================================

    const registrosProcesados = registrosAutocontrol

        .map(record => {

            const row = {};

            for (
                const [key, field]
                of Object.entries(MAP)
            ) {

                let value = String(
                    record[field] ?? ''
                ).trim();

                if (field.includes('___')) {

                    value = normalizarCheckbox(value);

                }

                row[key] = value;

            }

            // Servicio asistencial

            row.Servicio = normalizarServicio(
                row.Servicio
            );

            // Tipo de control fijo

            row.Tipo_Control = 'Autocontrol';

            // Evaluador de autocontrol

            row.Evaluador =
                row.Evaluador_Autocontrol;

            // Compatibilidad con el frontend

            row.Evaluador_Externo = '';

            // Conservar el valor original del personal
            // No aplicar filtros con etiquetas
            // que todavía no han sido verificadas.

            row.Personal_Diligencia = String(
                row.Personal_Diligencia ?? ''
            ).trim();

            // Fecha de auditoría

            row.Fecha_Auditoria =
                row.Fecha_Auditoria.slice(0, 10);

            // Aplicación contable

            row.Aplicacion_Contable = '1';

            return row;

        });

    // ======================================
    // FILTRAR SERVICIOS ASISTENCIALES
    // ======================================

    const registrosServicios = registrosProcesados

        .filter(row => row.Servicio !== '');

    console.log(
        '[REDCap] Registros de servicios autorizados:',
        registrosServicios.length
    );

    // ======================================
    // FILTRO FINAL DEL DASHBOARD
    // ======================================

    const datos = registrosServicios.filter(row =>

        row.Tipo_Control === 'Autocontrol' &&

        row.Valoracion_Riesgos === 'Checked'

    );

    // ======================================
    // DIAGNÓSTICO DE REGISTROS
    // ======================================

    console.log(
        '[REDCap] Registros finales:',
        datos.length
    );

    console.log('[REDCap] Resumen de filtros:', {

        recibidos: records.length,

        autocontrol: registrosAutocontrol.length,

        serviciosAutorizados: registrosServicios.length,

        valoracionRiesgos: datos.length

    });

    // Advertencia si todos los registros
    // fueron descartados.

    if (records.length > 0 && datos.length === 0) {

        console.warn(
            '[REDCap] Existen registros en la consulta, ' +
            'pero ninguno cumple los filtros actuales. ' +
            'Verificar las etiquetas de control, ' +
            'servicio y valoración de riesgos.'
        );

    }

    // ======================================
    // DEVOLVER DATOS AL DASHBOARD
    // ======================================

    return datos;

}
