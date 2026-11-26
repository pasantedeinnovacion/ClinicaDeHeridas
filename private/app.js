
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

// CRITERIOS DEL INDICADOR PE-ID-01

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

// GRUPOS DE VARIABLES

const groups = {

    general: [
        ['__adherence', 'Adherencia general PE-ID-01'],
        ['__criteria_adherence', 'Adherencia por criterio'],
        ['Servicio', 'Aplicaciones por servicio'],
        ['Tipo_Control', 'Tipo de control'],
        ['Evaluador_Autocontrol', 'Evaluador autocontrol'],
        ['Personal_Diligencia', 'Personal que diligencia'],
        ['Valoracion_Riesgos', 'Paquete instruccional a verificar (Valoración de Riesgos)'],
        ['__month', 'Pacientes por mes']
    ],

    mensual: [
        ['__monthly_adherence', 'Evolución mensual de adherencia PE-ID-01'],
        ['__monthly_apps', 'Listas aplicadas por mes']
    ],

    comparativo: [
        ['__compare_adherence', 'Adherencia PE-ID-01 por servicio'],
        ['__compare_count', 'Aplicaciones por servicio'],
        ['__compare_missing', 'Campos vacíos por servicio'],
        ['__compare_variable', 'Comparación de respuestas por servicio']
    ],

    riesgo: [
        ['Percepcion_Sensorial', 'Percepción sensorial'],
        ['Humedad', 'Humedad'],
        ['Actividad_Fisica', 'Actividad física'],
        ['Movilidad', 'Movilidad'],
        ['Nutricion', 'Nutrición'],
        ['Friccion', 'Fricción y deslizamiento'],
        ['Total_Braden', 'Total riesgo LPP - Escala Braden']
    ],

    postural: [
        ['Criterio_R', labels.Criterio_R],
        ...['S', 'T', 'U', 'V', 'W', 'X', 'Y'].map(
            k => ['Criterio_' + k, labels['Criterio_' + k]]
        )
    ],

    prevencion: [
        ...['N', 'O', 'P', 'Q', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF'].map(
            k => ['Criterio_' + k, labels['Criterio_' + k]]
        )
    ],

    calidad: [
        ['__missing', 'Datos vacíos por variable'],
        ['__missingservice', 'Datos vacíos por servicio'],
        ['__missingrows', 'Registros con campos vacíos']
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

// CALCULAR ADHERENCIA PE-ID-01

function calcularAdherencia(
    registros,
    criterios = criteriosAdherencia
) {

    let numerador = 0;
    let denominador = 0;
    let excluidos = 0;

    registros.forEach(registro => {

        criterios.forEach(criterio => {

            const respuesta = String(
                registro[criterio] ?? ''
            ).trim().toLowerCase();

            // RESPUESTAS POSITIVAS

            if (
                [
                    'yes',
                    'checked',
                    'check',
                    'sí',
                    'si'
                ].includes(respuesta)
            ) {

                numerador++;
                denominador++;

            }

            // RESPUESTAS NEGATIVAS

            else if (
                [
                    'no',
                    'unchecked'
                ].includes(respuesta)
            ) {

                denominador++;

            }

            // NO APLICA, VACÍOS Y OTROS VALORES

            else {

                excluidos++;

            }

        });

    });

    return {

        numerador,

        denominador,

        excluidos,

        incumplimientos:
            denominador - numerador,

        porcentaje: denominador > 0
            ? (numerador / denominador) * 100
            : null

    };
}

// OPCIONES DE FILTROS

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

// FILTRAR REGISTROS

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

// GRÁFICAS DE DISTRIBUCIÓN

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
                        class="fill ${label === 'Sin respuesta' ? 'empty' : ''}"
                        style="width:${100 * n / max}%">
                    </div>

                </div>

                <div class="barvalue">

                    ${n}

                    ${
                        showPct && total
                        ? ' · ' + (100 * n / total).toFixed(1) + '%'
                        : ''
                    }

                </div>

            </div>

        `).join('')

        : `
            <div class="empty-state">
                No hay registros para esta selección.
            </div>
        `;
}

// CONTAR RESPUESTAS

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

// GRÁFICAS DE ADHERENCIA

function renderAdherencia(items) {

    $('visual').innerHTML = items.length

        ? items.map(([nombre, a]) => `

            <div class="service-row">

                <div class="service-line">

                    <span title="${esc(nombre)}">
                        ${esc(nombre)}
                    </span>

                    <strong>

                        ${
                            a.porcentaje === null
                            ? 'Sin evaluaciones'
                            : a.porcentaje.toFixed(2) + '%'
                        }

                    </strong>

                </div>

                <div class="service-track">

                    <div
                        class="service-fill"
                        style="width:${a.porcentaje ?? 0}%">
                    </div>

                </div>

                <div class="compare-values">

                    <span>
                        Cumplidos: ${a.numerador}
                    </span>

                    <span>
                        Evaluados: ${a.denominador}
                    </span>

                    <span>
                        Incumplidos: ${a.incumplimientos}
                    </span>

                    <span>
                        Excluidos: ${a.excluidos}
                    </span>

                </div>

            </div>

        `).join('')

        : `
            <div class="empty-state">
                No hay evaluaciones disponibles.
            </div>
        `;
}

// RESUMEN DE SERVICIOS

function renderService(d) {

    const serviceCounts = services.map(s => [

        s,

        d.filter(r => r.Servicio === s).length

    ]);

    const max = Math.max(
        1,
        ...serviceCounts.map(x => x[1])
    );

    $('servicebars').innerHTML = serviceCounts.map(
        ([s, n]) => `

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

        `
    ).join('');

    const indicador = calcularAdherencia(d);

    $('insight').innerHTML = `

        <strong>Indicador PE-ID-01</strong>

        <br><br>

        Adherencia calculada:

        <strong>

            ${
                indicador.porcentaje === null
                ? 'Sin evaluaciones'
                : indicador.porcentaje.toFixed(2) + '%'
            }

        </strong>

        <br>

        Numerador:
        <strong>${indicador.numerador}</strong>

        <br>

        Denominador:
        <strong>${indicador.denominador}</strong>

        <br>

        Criterios incumplidos:
        <strong>${indicador.incumplimientos}</strong>

        <br>

        Respuestas excluidas:
        <strong>${indicador.excluidos}</strong>

        <br><br>

        Registros seleccionados:
        <strong>${d.length}</strong>

        <br>

        <small>
            Cálculo provisional por criterio evaluado.
        </small>

    `;
}

// RENDERIZAR DASHBOARD

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

        d.map(r => r.ID_Aplicacion)
            .filter(Boolean)

    ).size;

    $('records').textContent = d.length;

    let foot =
        'Los vacíos no se consideran automáticamente incumplimientos. Las respuestas No aplica se conservan separadas.';

    // ADHERENCIA GENERAL

    if (key === '__adherence') {

        const indicador = calcularAdherencia(d);

        $('visual').innerHTML = `

            <div style="
                padding:20px;
                text-align:center;
            ">

                <div style="
                    font-size:15px;
                    font-weight:600;
                ">

                    Indicador PE-ID-01

                </div>

                <div style="
                    font-size:48px;
                    font-weight:800;
                    color:#1683ad;
                    margin:15px 0;
                ">

                    ${
                        indicador.porcentaje === null
                        ? 'Sin datos'
                        : indicador.porcentaje.toFixed(2) + '%'
                    }

                </div>

                <div>

                    Adherencia al paquete instruccional
                    de prevención de lesiones por presión

                </div>

                <div style="
                    display:grid;
                    grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
                    gap:12px;
                    margin-top:25px;
                ">

                    <div style="
                        padding:15px;
                        border:1px solid #dbe5eb;
                        border-radius:10px;
                    ">

                        <div>Numerador</div>

                        <strong style="font-size:26px;">

                            ${indicador.numerador}

                        </strong>

                        <div>Criterios cumplidos</div>

                    </div>

                    <div style="
                        padding:15px;
                        border:1px solid #dbe5eb;
                        border-radius:10px;
                    ">

                        <div>Denominador</div>

                        <strong style="font-size:26px;">

                            ${indicador.denominador}

                        </strong>

                        <div>Criterios evaluados</div>

                    </div>

                    <div style="
                        padding:15px;
                        border:1px solid #dbe5eb;
                        border-radius:10px;
                    ">

                        <div>Incumplimientos</div>

                        <strong style="
                            font-size:26px;
                            color:#c54b4b;
                        ">

                            ${indicador.incumplimientos}

                        </strong>

                        <div>Criterios negativos</div>

                    </div>

                    <div style="
                        padding:15px;
                        border:1px solid #dbe5eb;
                        border-radius:10px;
                    ">

                        <div>Excluidos</div>

                        <strong style="font-size:26px;">

                            ${indicador.excluidos}

                        </strong>

                        <div>Vacíos, No aplica y otros</div>

                    </div>

                </div>

                <div style="
                    display:flex;
                    height:20px;
                    background:#e5e7eb;
                    border-radius:8px;
                    overflow:hidden;
                    margin-top:25px;
                ">

                    <div style="
                        background:#1683ad;
                        width:${indicador.porcentaje ?? 0}%;
                    "></div>

                    <div style="
                        background:#d97757;
                        width:${
                            indicador.porcentaje === null
                            ? 0
                            : 100 - indicador.porcentaje
                        }%;
                    "></div>

                </div>

                <div style="
                    margin-top:15px;
                    font-size:13px;
                ">

                    ${
                        indicador.porcentaje === null
                        ? 'No hay criterios evaluados.'
                        : `${indicador.numerador} criterios cumplidos de ${indicador.denominador} evaluados`
                    }

                </div>

            </div>

        `;

        foot =
            'Fórmula provisional: criterios cumplidos / criterios evaluados × 100. Se excluyen vacíos, No aplica y valores no reconocidos.';

    }

    // ADHERENCIA POR CRITERIO

    else if (key === '__criteria_adherence') {

        const resultados = criteriosAdherencia.map(k => [

            labels[k] || k,

            calcularAdherencia(d, [k])

        ]);

        resultados.sort((a, b) =>

            (a[1].porcentaje ?? Infinity) -
            (b[1].porcentaje ?? Infinity)

        );

        renderAdherencia(resultados);

        foot =
            'Los criterios se ordenan de menor a mayor adherencia. Los criterios sin evaluaciones aparecen al final.';

    }

    // ADHERENCIA MENSUAL

    else if (key === '__monthly_adherence') {

        const meses = {};

        d.forEach(r => {

            const fecha = String(
                r.Fecha_Auditoria || ''
            );

            if (
                /^\d{4}-\d{2}-\d{2}/.test(fecha)
            ) {

                const mes = fecha.slice(0, 7);

                if (!meses[mes]) {

                    meses[mes] = [];

                }

                meses[mes].push(r);

            }

        });

        const resultados = Object.entries(meses)

            .sort(([a], [b]) => a.localeCompare(b))

            .map(([mes, registros]) => [

                mes,

                calcularAdherencia(registros)

            ]);

        renderAdherencia(resultados);

        const sinFecha = d.filter(r =>
            !/^\d{4}-\d{2}-\d{2}/.test(
                String(r.Fecha_Auditoria || '')
            )
        ).length;

        foot =
            'La adherencia mensual se calcula dividiendo los criterios cumplidos entre los criterios evaluados de cada mes. ' +
            `Registros excluidos por falta de fecha válida: ${sinFecha}.`;

    }

    // ADHERENCIA POR SERVICIO

    else if (key === '__compare_adherence') {

        const resultados = services.map(servicio => [

            servicio,

            calcularAdherencia(

                d.filter(r =>
                    r.Servicio === servicio
                )

            )

        ]);

        renderAdherencia(resultados);

        foot =
            'Cada servicio tiene su propio numerador y denominador. La adherencia general se calcula sobre todos los criterios evaluados, no mediante un promedio simple de porcentajes.';

    }

    // LISTAS APLICADAS POR MES

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

                    .sort(([a], [b]) =>
                        a.localeCompare(b)
                    )

                    .map(([k, v]) =>
                        [k, v.size]
                    ),

                true

            );

        }

        foot =
            'Se cuentan aplicaciones distintas por mes, no pacientes únicos.';

    }

    // COMPARATIVO DE APLICACIONES

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

    // CAMPOS VACÍOS POR SERVICIO

    else if (key === '__compare_missing') {

        renderBars(

            services.map(s => [

                s,

                d.filter(r => r.Servicio === s)

                    .reduce(

                        (n, r) => n + dataKeys.filter(

                            k => !String(
                                r[k] ?? ''
                            ).trim()

                        ).length,

                        0

                    )

            ])

        );

        foot =
            'Cantidad de celdas vacías por servicio. Algunas preguntas condicionales pueden no aplicar.';

    }

    // COMPARACIÓN DE RESPUESTAS

    else if (key === '__compare_variable') {

        const chosen =
            $('comparefield')?.value ||
            'Criterio_R';

        const subset = services.map(s => {

            const rr = d.filter(
                r => r.Servicio === s
            );

            const yes = rr.filter(r =>

                /^(yes|sí|si|checked|check)$/i.test(

                    String(r[chosen] ?? '').trim()

                )

            ).length;

            const no = rr.filter(r =>

                /^(no|unchecked)$/i.test(

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
                            Otros / No aplica: ${other}
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
            'Distribución descriptiva. Los códigos numéricos no se interpretan automáticamente como Sí o No.';

    }

    // PACIENTES POR MES

    else if (key === '__month') {

        $('visual').innerHTML = `

            <div class="empty-state">

                No es posible calcular pacientes por mes
                sin fechas de auditoría e identificadores
                seudonimizados de paciente.

            </div>

        `;

        foot =
            'Una lista aplicada no equivale necesariamente a un paciente único.';

    }

    // ESCALA BRADEN

    else if (Object.hasOwn(bradenLabels, key)) {

        const available = d.filter(r =>

            String(r[key] ?? '').trim() !== ''

        );

        if (!d.length) {

            $('visual').innerHTML = `

                <div class="empty-state">

                    No hay registros para los filtros
                    seleccionados.

                </div>

            `;

        } else if (!available.length) {

            $('visual').innerHTML = `

                <div class="empty-state">

                    <strong>

                        ${esc(bradenLabels[key])}

                    </strong>

                    <p>

                        No hay respuestas disponibles
                        para esta variable.

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
            'Los porcentajes se calculan sobre los registros seleccionados. La escala Braden no forma parte del cálculo provisional de adherencia.';

    }

    // DATOS VACÍOS POR VARIABLE

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

    // DATOS VACÍOS POR SERVICIO

    else if (key === '__missingservice') {

        renderBars(

            services.map(s => [

                s,

                d.filter(r => r.Servicio === s)

                    .reduce(

                        (sum, r) => sum + dataKeys.filter(

                            k => !String(
                                r[k] ?? ''
                            ).trim()

                        ).length,

                        0

                    )

            ])

        );

        foot =
            'Número de celdas vacías, no número de pacientes.';

    }

    // REGISTROS CON CAMPOS VACÍOS

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

    // GRÁFICAS GENERALES

    else {

        renderBars(counts(d, key), true);

        if (key === 'Servicio') {

            foot =
                'Distribución de registros por servicio.';

        }

    }

    // ACTUALIZAR INFORMACIÓN GENERAL

    $('foot').textContent = foot;

    renderService(d);

    $('charttitle').textContent =

        $('variable').selectedOptions[0]?.textContent ||

        'Resultados';

    $('chartdesc').textContent =

        'Distribución según los filtros seleccionados';

    // BUSCADOR DE REGISTROS

    const q = $('search').value

        .trim()

        .toLowerCase();

    const adherenceViews = [

        '__adherence',

        '__criteria_adherence',

        '__monthly_adherence',

        '__compare_adherence'

    ];

    $('tbody').innerHTML = d.filter(r =>

        !q ||

        [

            r.ID_Aplicacion,

            r.Evaluador_Autocontrol,

            r.Servicio

        ].some(v =>

            String(v || '')

                .toLowerCase()

                .includes(q)

        )

    )

    .slice(0, 100)

    .map(r => {

        const indicador = calcularAdherencia([r]);

        const value = adherenceViews.includes(key)

            ? (

                indicador.porcentaje === null

                    ? 'Sin evaluaciones'

                    : `${indicador.numerador}/${indicador.denominador} · ${indicador.porcentaje.toFixed(2)}%`

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

// TÍTULOS DE LAS SECCIONES

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

        'Indicador PE-ID-01 y caracterización de las auditorías'

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

// CAMBIO DE PESTAÑAS

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

            ${esc(l || labels[k] || k)}

        </option>

    `).join('');

    render();

}

// EVENTOS DE NAVEGACIÓN

document.querySelectorAll('[data-tab]').forEach(b => {

    b.addEventListener(

        'click',

        () => setTab(b.dataset.tab)

    );

});

// EVENTOS DE FILTROS

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

// LIMPIAR FILTROS

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

// EXPORTACIÓN CSV

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

            { type: 'text/csv;charset=utf-8' }

        )

    );

    const a = document.createElement('a');

    a.href = url;

    a.download = 'PE1167_datos_filtrados.csv';

    a.click();

    URL.revokeObjectURL(url);

});

// INICIAR DASHBOARD

setTab('general');
