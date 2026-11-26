
// ==========================================
// DASHBOARD PE-ID-01 - CLÍNICA DE HERIDAS
// AUTOCONTROL - PERSONAL DEL MISMO SERVICIO
// ==========================================

const $ = id => document.getElementById(id);

const esc = v => String(v ?? '').replace(
    /[&<>"']/g,
    c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c])
);

function normalizarTexto(valor) {
    return String(valor ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}

// ==========================================
// 01. SERVICIOS AUTORIZADOS
// ==========================================

const services = [
    'Salas de Cirugía',
    'UCI',
    'Hospitalización'
];

function normalizarServicio(valor) {

    const mapa = {
        'uci': 'UCI',
        'cuidado critico': 'UCI',
        '4': 'UCI',

        'hospitalizacion': 'Hospitalización',
        '5': 'Hospitalización',

        'salas de cirugia': 'Salas de Cirugía',
        '6': 'Salas de Cirugía'
    };

    return mapa[normalizarTexto(valor)] || '';

}

// ==========================================
// 02. EVALUADORES DEL MISMO SERVICIO
// ==========================================

const evaluadoresPorServicio = {

    'UCI': [
        'autocontrol cuidado critico',
        '1'
    ],

    'Hospitalización': [
        'autocontrol hospitalizacion',
        '2'
    ],

    'Salas de Cirugía': [
        'autocontrol salas de cirugia',
        '3'
    ]

};

const nombresEvaluadores = {

    'UCI': 'Autocontrol Cuidado Crítico',

    'Hospitalización': 'Autocontrol Hospitalización',

    'Salas de Cirugía': 'Autocontrol Salas de Cirugía'

};

// ==========================================
// 03. FILTRADO INICIAL DE REGISTROS
// ==========================================

const datosOriginales = Array.isArray(window.PE1167_DATA)
    ? window.PE1167_DATA
    : [];

const registrosAutocontrol = datosOriginales.filter(r =>

    [
        'autocontrol',
        'auto control',
        'auto-control',
        '1'
    ].includes(normalizarTexto(r.Tipo_Control))

);

const registrosPersonalServicio =
    registrosAutocontrol.filter(r =>

        [
            'personal del servicio',
            'personal del mismo servicio',
            '1'
        ].includes(
            normalizarTexto(r.Personal_Diligencia)
        )

    );

const registrosServicios =
    registrosPersonalServicio.map(r => ({

        ...r,

        Servicio: normalizarServicio(r.Servicio)

    })).filter(r =>

        services.includes(r.Servicio)

    );

const all = registrosServicios.filter(r => {

    const evaluador = normalizarTexto(
        r.Evaluador_Autocontrol
    );

    return (
        evaluadoresPorServicio[r.Servicio] || []
    ).includes(evaluador);

}).map(r => ({

    ...r,

    Tipo_Control: 'Autocontrol',

    Personal_Diligencia: 'Personal del Servicio',

    Evaluador_Autocontrol:
        nombresEvaluadores[r.Servicio]

}));

// ==========================================
// 04. DIAGNÓSTICO DE REGISTROS
// ==========================================

console.log(
    '[PE1167] Registros originales:',
    datosOriginales.length
);

console.log(
    '[PE1167] Registros de autocontrol:',
    registrosAutocontrol.length
);

console.log(
    '[PE1167] Personal del servicio:',
    registrosPersonalServicio.length
);

console.log(
    '[PE1167] Servicios autorizados:',
    registrosServicios.length
);

console.log(
    '[PE1167] Evaluador del mismo servicio:',
    all.length
);

if (!all.length) {

    console.warn(
        '[PE1167] Ningún registro cumple todas las condiciones.'
    );

}

// ==========================================
// 05. ETIQUETAS
// ==========================================

const bradenLabels = {

    Percepcion_Sensorial: 'Percepción sensorial',

    Humedad: 'Humedad',

    Actividad_Fisica: 'Actividad física',

    Movilidad: 'Movilidad',

    Nutricion: 'Nutrición',

    Friccion: 'Fricción y deslizamiento',

    Total_Braden: 'Total riesgo LPP - Escala Braden'

};

const labels = {

    ...(window.PE1167_LABELS || {}),

    ...bradenLabels

};

// ==========================================
// 06. CRITERIOS DE ADHERENCIA PE-ID-01
// ==========================================

const criteriosAdherencia = [

    'Criterio_N',
    'Criterio_O',
    'Criterio_P',
    'Criterio_Q',
    'Criterio_R',
    'Criterio_Z',
    'Criterio_AD',
    'Criterio_AE',
    'Criterio_AF'

];

const positivos = new Set([

    'yes',
    'checked',
    'check',
    'si'

]);

const negativos = new Set([

    'no',
    'unchecked'

]);

// ==========================================
// 07. FÓRMULA DE ADHERENCIA
// ==========================================

function calcularAdherencia(
    registros,
    criterios = criteriosAdherencia
) {

    let numerador = 0;
    let denominador = 0;
    let excluidos = 0;

    for (const r of registros) {

        for (const k of criterios) {

            const v = normalizarTexto(r[k]);

            if (positivos.has(v)) {

                numerador++;
                denominador++;

            } else if (negativos.has(v)) {

                denominador++;

            } else {

                excluidos++;

            }

        }

    }

    return {

        numerador,

        denominador,

        excluidos,

        incumplimientos:
            denominador - numerador,

        porcentaje: denominador
            ? 100 * numerador / denominador
            : null

    };

}

// ==========================================
// 08. FORMATO DE ADHERENCIA
// ==========================================

function formatoAdherencia(a) {

    return a.porcentaje === null

        ? 'Sin evaluaciones'

        : a.porcentaje.toLocaleString('es-CO', {

            maximumFractionDigits: 2

        }) + '%';

}

// ==========================================
// 09. GRÁFICAS DE ADHERENCIA
// ==========================================

function renderAdherencia(items) {

    $('visual').innerHTML = items.map(([nombre, a]) => `

        <div class="service-row">

            <div class="service-line">

                <span>${esc(nombre)}</span>

                <strong>
                    ${formatoAdherencia(a)}
                </strong>

            </div>

            <div class="service-track">

                <div
                    class="service-fill"
                    style="width:${a.porcentaje ?? 0}%">
                </div>

            </div>

            <small>

                ${a.numerador} /
                ${a.denominador} criterios evaluados

                · ${a.excluidos} excluidos

            </small>

        </div>

    `).join('') ||

    '<div class="empty-state">Sin evaluaciones disponibles.</div>';

}

// ==========================================
// 10. ADHERENCIA MENSUAL
// ==========================================

function adherenciaMensual(d) {

    const meses = new Map();

    for (const r of d) {

        const fecha = String(
            r.Fecha_Auditoria ?? ''
        ).slice(0, 10);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            continue;
        }

        const f = new Date(
            fecha + 'T00:00:00Z'
        );

        if (
            !Number.isFinite(f.getTime()) ||
            f.toISOString().slice(0, 10) !== fecha
        ) {
            continue;
        }

        const mes = fecha.slice(0, 7);

        if (!meses.has(mes)) {
            meses.set(mes, []);
        }

        meses.get(mes).push(r);

    }

    return [...meses]

        .sort(([a], [b]) => a.localeCompare(b))

        .map(([mes, rr]) => [

            mes,

            calcularAdherencia(rr)

        ]);

}

// ==========================================
// 11. GRUPOS DE VARIABLES
// ==========================================

const groups = {

    general: [

        [
            '__adherence',
            'Adherencia general PE-ID-01'
        ],

        [
            '__criteria_adherence',
            'Adherencia por criterio'
        ],

        [
            'Servicio',
            'Aplicaciones por servicio'
        ],

        [
            'Tipo_Control',
            'Tipo de control'
        ],

        [
            'Evaluador_Autocontrol',
            'Evaluador autocontrol'
        ],

        [
            'Personal_Diligencia',
            'Personal del mismo servicio'
        ],

        [
            'Valoracion_Riesgos',
            'Paquete instruccional a verificar (Valoración de Riesgos)'
        ],

        [
            '__month',
            'Pacientes por mes (requiere fecha y paciente)'
        ]

    ],

    mensual: [

        [
            '__monthly_adherence',
            'Evolución mensual de adherencia PE-ID-01'
        ],

        [
            '__monthly_apps',
            'Listas aplicadas por mes'
        ]

    ],

    comparativo: [

        [
            '__compare_count',
            'Aplicaciones por servicio'
        ],

        [
            '__compare_missing',
            'Campos vacíos por servicio'
        ],

        [
            '__compare_variable',
            'Comparación de respuestas por servicio'
        ],

        [
            '__compare_adherence',
            'Adherencia PE-ID-01 por servicio'
        ]

    ],

    riesgo: [

        [
            'Percepcion_Sensorial',
            'Percepción sensorial'
        ],

        [
            'Humedad',
            'Humedad'
        ],

        [
            'Actividad_Fisica',
            'Actividad física'
        ],

        [
            'Movilidad',
            'Movilidad'
        ],

        [
            'Nutricion',
            'Nutrición'
        ],

        [
            'Friccion',
            'Fricción y deslizamiento'
        ],

        [
            'Total_Braden',
            'Total riesgo LPP - Escala Braden'
        ]

    ],

    postural: [

        [
            'Criterio_R',
            labels.Criterio_R
        ],

        ...[
            'S', 'T', 'U', 'V',
            'W', 'X', 'Y'
        ].map(k => [

            'Criterio_' + k,

            labels['Criterio_' + k]

        ])

    ],

    prevencion: [

        ...[
            'N', 'O', 'P', 'Q', 'Z',
            'AA', 'AB', 'AC',
            'AD', 'AE', 'AF'
        ].map(k => [

            'Criterio_' + k,

            labels['Criterio_' + k]

        ])

    ],

    calidad: [

        [
            '__missing',
            'Datos vacíos por variable'
        ],

        [
            '__missingservice',
            'Datos vacíos por servicio'
        ],

        [
            '__missingrows',
            'Registros con campos vacíos'
        ]

    ]

};

let tab = 'general';

const dataKeys = Object.keys(
    all[0] || datosOriginales[0] || {}
).filter(

    k => k.startsWith('Criterio_') ||

    [
        'Tipo_Control',
        'Evaluador_Autocontrol',
        'Personal_Diligencia',
        'Valoracion_Riesgos'
    ].includes(k)

);

// ==========================================
// 12. OPCIONES DE FILTROS
// ==========================================

function options(id, key, registros = all) {

    const values = [

        ...new Set(
            registros.map(r => r[key]).filter(Boolean)
        )

    ].sort();

    const anterior = $(id).value;

    $(id).innerHTML =

        '<option value="">Todos</option>' +

        values.map(v =>

            `<option value="${esc(v)}">
                ${esc(v)}
            </option>`

        ).join('');

    if (values.includes(anterior)) {

        $(id).value = anterior;

    }

}

// ==========================================
// 13. AUTOCONTROL FIJO
// ==========================================

function iniciarControl() {

    $('control').innerHTML =

        '<option value="Autocontrol">Autocontrol</option>';

    $('control').value = 'Autocontrol';

    $('control').disabled = true;

}

// ==========================================
// 14. EVALUADORES SEGÚN SERVICIO
// ==========================================

function refreshEvaluators() {

    const servicio = $('service').value;

    const registros = all.filter(r =>

        !servicio || r.Servicio === servicio

    );

    options(
        'evaluator',
        'Evaluador_Autocontrol',
        registros
    );

}

// ==========================================
// 15. FILTRAR REGISTROS
// ==========================================

function rows() {

    let d = all.filter(r =>

        services.includes(r.Servicio) &&

        r.Tipo_Control === 'Autocontrol' &&

        r.Personal_Diligencia === 'Personal del Servicio' &&

        (
            !$('service').value ||
            r.Servicio === $('service').value
        ) &&

        (
            !$('evaluator').value ||
            r.Evaluador_Autocontrol === $('evaluator').value
        )

    );

    const a = $('from').value;

    const b = $('to').value;

    if (a || b) {

        d = d.filter(r =>

            r.Fecha_Auditoria &&

            (!a || r.Fecha_Auditoria >= a) &&

            (!b || r.Fecha_Auditoria <= b)

        );

    }

    return d;

}

// ==========================================
// 16. GRÁFICAS DE BARRAS
// ==========================================

function renderBars(items, showPct = false) {

    const total = items.reduce(
        (s, x) => s + x[1],
        0
    );

    const max = Math.max(

        1,

        ...items.map(x => x[1])

    );

    $('visual').innerHTML = items.length

        ? items.map(([label, n]) => `

            <div class="barrow">

                <div
                    class="barlabel"
                    title="${esc(label)}">

                    ${esc(label)}

                </div>

                <div class="track">

                    <div
                        class="fill ${
                            label === 'Sin respuesta'
                                ? 'empty'
                                : ''
                        }"
                        style="width:${100 * n / max}%">

                    </div>

                </div>

                <div class="barvalue">

                    ${n}

                    ${showPct && total

                        ? ' · ' +
                            (100 * n / total).toFixed(1) +
                            '%'

                        : ''

                    }

                </div>

            </div>

        `).join('')

        : '<div class="empty-state">No hay registros para esta selección.</div>';

}

// ==========================================
// 17. CONTAR RESPUESTAS
// ==========================================

function counts(d, key) {

    const o = Object.create(null);

    d.forEach(r => {

        const v =

            String(r[key] ?? '').trim() ||

            'Sin respuesta';

        o[v] = (o[v] || 0) + 1;

    });

    return Object.entries(o).sort(

        (a, b) => b[1] - a[1]

    );

}

// ==========================================
// 18. RESUMEN POR SERVICIO
// ==========================================

function renderService(d) {

    const counts = services.map(s => [

        s,

        d.filter(r => r.Servicio === s).length

    ]);

    const max = Math.max(

        1,

        ...counts.map(x => x[1])

    );

    $('servicebars').innerHTML = counts.map(([s, n]) => `

        <div class="service-row">

            <div class="service-line">

                <span>${esc(s)}</span>

                <strong>${n} registros</strong>

            </div>

            <div class="service-track">

                <div
                    class="service-fill"
                    style="width:${100 * n / max}%">

                </div>

            </div>

        </div>

    `).join('');

    const a = calcularAdherencia(d);

    $('insight').innerHTML = `

        <strong>Indicador PE-ID-01</strong>

        <br><br>

        Tipo de control:
        <strong>Autocontrol</strong>

        <br>

        Personal:
        <strong>Personal del mismo servicio</strong>

        <br>

        Evaluador:
        <strong>Correspondiente al servicio auditado</strong>

        <br><br>

        Registros seleccionados:
        <strong>${d.length}</strong>

        <br>

        Adherencia:
        <strong>${formatoAdherencia(a)}</strong>

        <br>

        Numerador:
        <strong>${a.numerador}</strong>

        <br>

        Denominador:
        <strong>${a.denominador}</strong>

        <br>

        Incumplimientos:
        <strong>${a.incumplimientos}</strong>

        <br>

        Respuestas excluidas:
        <strong>${a.excluidos}</strong>

        <br><br>

        <small>

            No incluye control externo ni personal de calidad.

            Los datos faltantes no se interpretan como incumplimiento.

            Cálculo provisional pendiente de validación institucional.

        </small>

    `;

}

// ==========================================
// 19. RENDERIZAR DASHBOARD
// ==========================================

function render() {

    const d = rows();

    const key = $('variable').value;

    const datesMissing = !all.some(

        r => r.Fecha_Auditoria

    );

    let advertencia = '';

    if (!datosOriginales.length) {

        advertencia =
            'No se recibieron registros desde REDCap.';

    } else if (!registrosAutocontrol.length) {

        advertencia =
            'No se encontraron registros de autocontrol.';

    } else if (!registrosPersonalServicio.length) {

        advertencia =
            'No se encontraron registros de autocontrol realizados por personal del servicio.';

    } else if (!registrosServicios.length) {

        advertencia =
            'No se encontraron registros de los tres servicios autorizados.';

    } else if (!all.length) {

        advertencia =
            'No se encontraron registros cuyo evaluador corresponda al servicio auditado.';

    } else if (datesMissing) {

        advertencia =
            'No hay fechas de auditoría disponibles.';

    } else if (
        $('from').value &&
        $('to').value &&
        $('from').value > $('to').value
    ) {

        advertencia =
            'La fecha inicial no puede ser posterior a la fecha final.';

    } else if (!d.length) {

        advertencia =
            'No hay registros para los filtros seleccionados.';

    }

    $('datewarn').textContent = advertencia;

    $('apps').textContent = new Set(

        d.map(r => r.ID_Aplicacion).filter(Boolean)

    ).size;

    $('records').textContent = d.length;

    let foot =

        'Solo se incluyen autocontroles del personal del mismo servicio. Los datos vacíos no se consideran automáticamente incumplimientos.';

    // ======================================
    // CÁLCULO GENERAL DE ADHERENCIA
    // ======================================

    const adherencia = calcularAdherencia(d);

    for (const [id, valor] of Object.entries({

        adherenceKpi:
            formatoAdherencia(adherencia),

        numerator:
            adherencia.numerador,

        denominator:
            adherencia.denominador

    })) {

        if ($(id)) {

            $(id).textContent = valor;

        }

    }

    const nota =

        'Cálculo provisional: criterios cumplidos / ' +

        'criterios evaluados × 100. ' +

        'Únicamente autocontrol del personal del mismo servicio. ' +

        'Pendiente de validación institucional.';

    // ======================================
    // ADHERENCIA GENERAL
    // ======================================

    if (key === '__adherence') {

        renderAdherencia([

            [
                'Adherencia general',
                adherencia
            ]

        ]);

        foot = nota;

    }

    // ======================================
    // ADHERENCIA POR CRITERIO
    // ======================================

    else if (key === '__criteria_adherence') {

        renderAdherencia(

            criteriosAdherencia.map(k => [

                labels[k] || k,

                calcularAdherencia(d, [k])

            ])

        );

        foot = nota;

    }

    // ======================================
    // ADHERENCIA MENSUAL
    // ======================================

    else if (key === '__monthly_adherence') {

        renderAdherencia(

            adherenciaMensual(d)

        );

        foot = nota +

            ' Se agrupa por mes de auditoría; ' +

            'los meses sin registros no equivalen a 0%.';

    }

    // ======================================
    // ADHERENCIA POR SERVICIO
    // ======================================

    else if (key === '__compare_adherence') {

        renderAdherencia(

            services.map(s => [

                s,

                calcularAdherencia(

                    d.filter(r => r.Servicio === s)

                )

            ])

        );

        foot = nota +

            ' Cada servicio tiene su propio numerador y denominador.';

    }

    // ======================================
    // LISTAS APLICADAS POR MES
    // ======================================

    else if (key === '__monthly_apps') {

        const valid = d.filter(r =>

            /^\d{4}-\d{2}-\d{2}/.test(

                String(r.Fecha_Auditoria || '')

            )

        );

        if (!valid.length) {

            $('visual').innerHTML = `

                <div class="empty-state">

                    No hay fechas de auditoría válidas
                    en los registros filtrados.

                    La gráfica mensual se activará
                    cuando se carguen fechas reales.

                </div>

            `;

        } else {

            const m = {};

            valid.forEach(r => {

                const k = String(

                    r.Fecha_Auditoria

                ).slice(0, 7);

                if (r.ID_Aplicacion) {

                    (m[k] ??= new Set()).add(

                        r.ID_Aplicacion

                    );

                }

            });

            renderBars(

                Object.entries(m)

                    .sort(([a], [b]) => a.localeCompare(b))

                    .map(([k, v]) => [k, v.size]),

                true

            );

        }

        foot =

            'Se cuentan aplicaciones distintas de autocontrol por mes, no pacientes únicos.';

    }

    // ======================================
    // COMPARATIVO DE APLICACIONES
    // ======================================

    else if (key === '__compare_count') {

        renderBars(

            services.map(s => [

                s,

                new Set(

                    d.filter(r => r.Servicio === s)

                        .map(r => r.ID_Aplicacion)

                        .filter(Boolean)

                ).size

            ]),

            true

        );

        foot =

            'Comparación de listas de autocontrol aplicadas; no equivale a adherencia.';

    }

    // ======================================
    // CAMPOS VACÍOS POR SERVICIO
    // ======================================

    else if (key === '__compare_missing') {

        renderBars(

            services.map(s => [

                s,

                d.filter(r => r.Servicio === s)

                    .reduce(

                        (n, r) => n + dataKeys.filter(

                            k => !String(r[k] ?? '').trim()

                        ).length,

                        0

                    )

            ])

        );

        foot =

            'Cantidad de celdas vacías por servicio; las preguntas condicionales pueden no aplicar.';

    }

    // ======================================
    // COMPARACIÓN DE RESPUESTAS
    // ======================================

    else if (key === '__compare_variable') {

        const chosen =

            $('comparefield')?.value ||

            'Criterio_R';

        const subset = services.map(s => {

            const rr = d.filter(

                r => r.Servicio === s

            );

            const yes = rr.filter(r =>

                /^(yes|sí|si|checked|1)$/i.test(

                    String(r[chosen] ?? '').trim()

                )

            ).length;

            const no = rr.filter(r =>

                /^(no|unchecked|0)$/i.test(

                    String(r[chosen] ?? '').trim()

                )

            ).length;

            const blank = rr.filter(r =>

                !String(r[chosen] ?? '').trim()

            ).length;

            const other =

                rr.length - yes - no - blank;

            return `

                <div class="compare-row">

                    <strong>${esc(s)}</strong>

                    <div class="compare-values">

                        <span>
                            Sí / marcado: ${yes}
                        </span>

                        <span>
                            No / desmarcado: ${no}
                        </span>

                        <span>
                            Sin respuesta: ${blank}
                        </span>

                        <span>
                            Otros / no aplica: ${other}
                        </span>

                    </div>

                </div>

            `;

        });

        $('visual').innerHTML = `

            <label class="compare-selector">

                Variable para comparar

                <select id="comparefield">

                    ${dataKeys.map(k => `

                        <option
                            value="${esc(k)}"
                            ${k === chosen ? 'selected' : ''}>

                            ${esc(labels[k] || k)}

                        </option>

                    `).join('')}

                </select>

            </label>

            ${subset.join('')}

        `;

        $('comparefield').addEventListener(

            'change',

            render

        );

        foot =

            'Distribución descriptiva; las respuestas vacías no se consideran incumplimientos.';

    }

    // ======================================
    // PACIENTES POR MES
    // ======================================

    else if (key === '__month') {

        $('visual').innerHTML = `

            <div class="empty-state">

                No es posible calcular pacientes por mes

                sin fechas de auditoría e identificadores

                seudonimizados de paciente.

                No se mostrarán valores inventados.

            </div>

        `;

        foot =

            'Una lista aplicada no equivale necesariamente a un paciente único.';

    }

    // ======================================
    // ESCALA BRADEN
    // ======================================

    else if (Object.hasOwn(bradenLabels, key)) {

        const available = d.filter(r =>

            String(r[key] ?? '').trim() !== ''

        );

        if (!d.length) {

            $('visual').innerHTML = `

                <div class="empty-state">

                    No hay registros para los filtros seleccionados.

                </div>

            `;

        } else if (!available.length) {

            $('visual').innerHTML = `

                <div class="empty-state">

                    <strong>

                        ${esc(bradenLabels[key])}

                    </strong>

                    <p>

                        No hay respuestas disponibles para

                        esta variable en los registros seleccionados.

                    </p>

                    <p>

                        Verifica que REDCap esté enviando

                        información para este campo.

                    </p>

                </div>

            `;

        } else {

            let items = counts(d, key);

            if (key === 'Total_Braden') {

                items.sort(([a], [b]) => {

                    if (a === 'Sin respuesta') return 1;

                    if (b === 'Sin respuesta') return -1;

                    if (

                        Number.isFinite(Number(a)) &&

                        Number.isFinite(Number(b))

                    ) {

                        return Number(a) - Number(b);

                    }

                    return a.localeCompare(

                        b,

                        'es',

                        { numeric: true }

                    );

                });

            }

            renderBars(items, true);

        }

        foot =

            `${available.length} de ${d.length} registros con respuesta. ` +

            'Los porcentajes se calculan sobre los registros seleccionados. ' +

            'No se deducen puntajes Braden a partir de otras respuestas.';

    }

    // ======================================
    // DATOS VACÍOS POR VARIABLE
    // ======================================

    else if (key === '__missing') {

        renderBars(

            dataKeys.map(k => [

                labels[k] || k,

                d.filter(r =>

                    !String(r[k] ?? '').trim()

                ).length

            ])

            .sort((a, b) => b[1] - a[1])

            .slice(0, 20)

        );

        foot =

            'Se muestran las 20 variables con mayor número de celdas vacías. Algunas preguntas pueden ser condicionales.';

    }

    // ======================================
    // DATOS VACÍOS POR SERVICIO
    // ======================================

    else if (key === '__missingservice') {

        renderBars(

            services.map(s => [

                s,

                d.filter(r => r.Servicio === s)

                    .reduce(

                        (sum, r) => sum + dataKeys.filter(

                            k => !String(r[k] ?? '').trim()

                        ).length,

                        0

                    )

            ])

        );

        foot =

            'Número de celdas vacías, no número de pacientes. Las preguntas condicionales pueden no aplicar.';

    }

    // ======================================
    // REGISTROS CON CAMPOS VACÍOS
    // ======================================

    else if (key === '__missingrows') {

        renderBars(

            [

                [

                    'Con campos vacíos',

                    d.filter(r =>

                        dataKeys.some(k =>

                            !String(r[k] ?? '').trim()

                        )

                    ).length

                ],

                [

                    'Sin campos vacíos',

                    d.filter(r =>

                        dataKeys.every(k =>

                            String(r[k] ?? '').trim()

                        )

                    ).length

                ]

            ],

            true

        );

    }

    // ======================================
    // GRÁFICAS GENERALES
    // ======================================

    else {

        renderBars(counts(d, key), true);

        if (key === 'Servicio') {

            foot =

                'Solo se incluyen Salas de Cirugía, UCI y Hospitalización.';

        }

        if (key === 'Tipo_Control') {

            foot =

                'Solo se incluyen registros de Autocontrol.';

        }

        if (key === 'Personal_Diligencia') {

            foot =

                'Solo se incluyen registros diligenciados por personal del servicio.';

        }

        if (key === 'Evaluador_Autocontrol') {

            foot =

                'El evaluador debe corresponder al mismo servicio auditado.';

        }

    }

    // ======================================
    // ACTUALIZAR INFORMACIÓN DE LA GRÁFICA
    // ======================================

    $('foot').textContent = foot;

    renderService(d);

    $('charttitle').textContent =

        $('variable').selectedOptions[0]?.textContent ||

        'Resultados';

    $('chartdesc').textContent =

        'Autocontrol realizado por personal del mismo servicio';

    // ======================================
    // TABLA DE REGISTROS
    // ======================================

    const q = $('search').value

        .trim()

        .toLowerCase();

    $('tbody').innerHTML = d.filter(r =>

        !q ||

        [

            r.ID_Aplicacion,

            r.Evaluador_Autocontrol,

            r.Servicio

        ].some(v =>

            String(v || '').toLowerCase().includes(q)

        )

    )

    .slice(0, 100)

    .map(r => {

        const value = [

            '__adherence',

            '__criteria_adherence',

            '__monthly_adherence',

            '__compare_adherence'

        ].includes(key)

            ? formatoAdherencia(

                calcularAdherencia([r])

            )

            : String(r[key] ?? '').trim();

        return `

            <tr>

                <td>

                    ${esc(r.ID_Aplicacion)}

                </td>

                <td>

                    ${esc(r.Servicio)}

                </td>

                <td>

                    Autocontrol

                </td>

                <td>

                    ${esc(r.Evaluador_Autocontrol)}

                </td>

                <td class="${!value ? 'muted' : ''}">

                    ${esc(value || 'Sin respuesta')}

                </td>

            </tr>

        `;

    })

    .join('') ||

    '<tr><td colspan="5">Sin registros</td></tr>';

}

// ==========================================
// 20. TÍTULOS DE LAS SECCIONES
// ==========================================

const titles = {

    mensual: [

        'Adherencia por mes',

        'Seguimiento mensual del autocontrol PE-ID-01'

    ],

    comparativo: [

        'Comparativo de servicios',

        'Análisis entre Salas de Cirugía, UCI y Hospitalización'

    ],

    general: [

        'Resumen general',

        'Autocontrol asistencial realizado por personal del mismo servicio'

    ],

    riesgo: [

        'Valoración del riesgo',

        'Escala Braden y valoración de riesgos'

    ],

    postural: [

        'Cambios posturales',

        'Cumplimiento y motivos de incumplimiento'

    ],

    prevencion: [

        'Prevención de lesiones de piel',

        'Medidas preventivas y cuidados'

    ],

    calidad: [

        'Calidad de datos',

        'Completitud de registros y respuestas faltantes'

    ]

};

// ==========================================
// 21. CAMBIO DE PESTAÑAS
// ==========================================

function setTab(t) {

    if (!groups[t]) return;

    tab = t;

    document.querySelectorAll('[data-tab]').forEach(b => {

        b.classList.toggle(

            'active',

            b.dataset.tab === t

        );

    });

    $('sectiontitle').textContent = titles[t][0];

    $('sectiondesc').textContent = titles[t][1];

    $('variable').innerHTML = groups[t].map(([k, l]) => `

        <option value="${esc(k)}">

            ${esc(l || labels[k] || k)}

        </option>

    `).join('');

    render();

}

// ==========================================
// 22. EVENTOS DE NAVEGACIÓN
// ==========================================

document.querySelectorAll('[data-tab]').forEach(b => {

    b.addEventListener(

        'click',

        () => setTab(b.dataset.tab)

    );

});

// ==========================================
// 23. EVENTOS DE FILTROS
// ==========================================

$('service').addEventListener('change', () => {

    refreshEvaluators();

    render();

});

[

    'evaluator',

    'from',

    'to',

    'variable',

    'search'

].forEach(id => {

    $(id).addEventListener(

        id === 'search' ? 'input' : 'change',

        render

    );

});

// ==========================================
// 24. LIMPIAR FILTROS
// ==========================================

$('clear').addEventListener('click', () => {

    [

        'service',

        'evaluator',

        'from',

        'to',

        'search'

    ].forEach(id => {

        $(id).value = '';

    });

    iniciarControl();

    refreshEvaluators();

    render();

});

// ==========================================
// 25. EXPORTACIÓN CSV
// ==========================================

function csvCell(valor) {

    let v = String(valor ?? '');

    // Evitar interpretación de fórmulas en Excel.

    if (
        /^\s*[=+\-@]/.test(v) ||
        /^[\t\r\n]/.test(v)
    ) {

        v = "'" + v;

    }

    return '"' + v.replace(/"/g, '""') + '"';

}

$('export').addEventListener('click', () => {

    const d = rows();

    const cols = [

        'ID_Aplicacion',

        'Servicio',

        'Tipo_Control',

        'Evaluador_Autocontrol',

        'Personal_Diligencia',

        'Fecha_Auditoria',

        ...Object.keys(labels).filter(

            k => k.startsWith('Criterio_')

        )

    ];

    const csv = [

        cols,

        ...d.map(r =>

            cols.map(k => r[k] ?? '')

        )

    ]

    .map(row =>

        row.map(csvCell).join(';')

    )

    .join('\r\n');

    const url = URL.createObjectURL(

        new Blob(

            ['\ufeff' + csv],

            {
                type: 'text/csv;charset=utf-8'
            }

        )

    );

    const a = document.createElement('a');

    a.href = url;

    a.download = 'PE1167_autocontrol_mismo_servicio.csv';

    document.body.appendChild(a);

    a.click();

    a.remove();

    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 1000);

});

// ==========================================
// 26. INICIAR DASHBOARD
// ==========================================

iniciarControl();

refreshEvaluators();

setTab('general');
