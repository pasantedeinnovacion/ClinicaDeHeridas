
const all = window.PE1167_DATA || [];

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

const services = [
    'Salas de Cirugía',
    'UCI',
    'Hospitalización'
];

// ==========================================
// 01. CRITERIOS DE ADHERENCIA PE-ID-01
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
// 02. FÓRMULA DE ADHERENCIA
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

            const v = String(r[k] ?? '')
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

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
// 03. FORMATO DE ADHERENCIA
// ==========================================

function formatoAdherencia(a) {

    return a.porcentaje === null

        ? 'Sin evaluaciones'

        : a.porcentaje.toLocaleString('es-CO', {
            maximumFractionDigits: 2
        }) + '%';

}

// ==========================================
// 04. GRÁFICAS DE ADHERENCIA
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
// 05. ADHERENCIA MENSUAL
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
// 06. GRUPOS DE VARIABLES
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
            'Personal que diligencia'
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

const dataKeys = Object.keys(all[0] || {}).filter(

    k => k.startsWith('Criterio_') ||

    [
        'Tipo_Control',
        'Evaluador_Autocontrol',
        'Personal_Diligencia',
        'Valoracion_Riesgos'
    ].includes(k)

);

// ==========================================
// 07. OPCIONES DE FILTROS
// ==========================================

function options(id, key) {

    const values = [

        ...new Set(
            all.map(r => r[key]).filter(Boolean)
        )

    ].sort();

    $(id).innerHTML =

        '<option value="">Todos</option>' +

        values.map(v =>

            `<option value="${esc(v)}">
                ${esc(v)}
            </option>`

        ).join('');

}

options('control', 'Tipo_Control');

options('evaluator', 'Evaluador_Autocontrol');

// ==========================================
// 08. FILTRAR REGISTROS
// ==========================================

function rows() {

    let d = all.filter(r =>

        services.includes(r.Servicio) &&

        (
            !$('service').value ||
            r.Servicio === $('service').value
        ) &&

        (
            !$('control').value ||
            r.Tipo_Control === $('control').value
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
// 09. GRÁFICAS DE BARRAS
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
// 10. CONTAR RESPUESTAS
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
// 11. RESUMEN POR SERVICIO
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

    $('insight').innerHTML = `

        <strong>${d.length} registros</strong>

        en la selección actual.<br>

        Los servicios sin auditorías aparecen con cero.<br>

        Los datos faltantes no se interpretan como incumplimiento.

    `;

}

// ==========================================
// 12. RENDERIZAR DASHBOARD
// ==========================================

function render() {

    const d = rows();

    const key = $('variable').value;

    const datesMissing = !all.some(

        r => r.Fecha_Auditoria

    );

    $('datewarn').textContent = datesMissing

        ? 'No hay fechas de auditoría disponibles. El filtro temporal requiere fechas reales.'

        : '';

    $('apps').textContent = new Set(

        d.map(r => r.ID_Aplicacion).filter(Boolean)

    ).size;

    $('records').textContent = d.length;

    let foot =

        'Los vacíos no se consideran automáticamente incumplimientos. Las respuestas No aplica se conservan separadas.';

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

            'Se cuentan aplicaciones distintas por mes, no pacientes únicos.';

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

            'Comparación de listas aplicadas; no equivale a adherencia.';

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

                'Los tres servicios se muestran en el selector. Un servicio sin registros tiene conteo cero.';

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

        'Distribución según los filtros seleccionados';

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

                    ${esc(r.Tipo_Control)}

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
// 13. TÍTULOS DE LAS SECCIONES
// ==========================================

const titles = {

    mensual: [

        'Adherencia por mes',

        'Seguimiento temporal del indicador PE-ID-01'

    ],

    comparativo: [

        'Comparativo de servicios',

        'Análisis entre Salas de Cirugía, UCI y Hospitalización'

    ],

    general: [

        'Resumen general',

        'Aplicaciones y caracterización de las auditorías'

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
// 14. CAMBIO DE PESTAÑAS
// ==========================================

function setTab(t) {

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

            ${esc(l)}

        </option>

    `).join('');

    render();

}

// ==========================================
// 15. EVENTOS DE NAVEGACIÓN
// ==========================================

document.querySelectorAll('[data-tab]').forEach(b => {

    b.addEventListener(

        'click',

        () => setTab(b.dataset.tab)

    );

});

// ==========================================
// 16. EVENTOS DE FILTROS
// ==========================================

[

    'service',

    'control',

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
// 17. LIMPIAR FILTROS
// ==========================================

$('clear').addEventListener('click', () => {

    [

        'service',

        'control',

        'evaluator',

        'from',

        'to',

        'search'

    ].forEach(id => {

        $(id).value = '';

    });

    render();

});

// ==========================================
// 18. EXPORTACIÓN CSV
// ==========================================

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

        row.map(x =>

            '"' + String(x).replace(/"/g, '""') + '"'

        ).join(';')

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

    a.download = 'PE1167_datos_filtrados.csv';

    a.click();

    URL.revokeObjectURL(url);

});

// ==========================================
// 19. INICIAR DASHBOARD
// ==========================================

setTab('general');
