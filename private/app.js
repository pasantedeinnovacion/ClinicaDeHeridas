
// ==========================================
// DASHBOARD PE-ID-01 - HUN
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

const texto = v => String(v ?? '').trim();

// ==========================================
// NORMALIZACIÓN DE DATOS REDCAP
// ==========================================

function normalizarControl(valor) {

    const v = texto(valor).toLowerCase();

    if (v.includes('auto')) {
        return 'Autocontrol';
    }

    if (v.includes('extern')) {
        return 'Control Externo';
    }

    return texto(valor);
}

const all = (window.PE1167_DATA || []).map(r => {

    const control = normalizarControl(r.Tipo_Control);

    const autocontrol = texto(r.Evaluador_Autocontrol);

    const externo = texto(r.Evaluador_Externo);

    return {
        ...r,

        Tipo_Control: control,

        Evaluador: control === 'Control Externo'
            ? externo
            : control === 'Autocontrol'
                ? autocontrol
                : autocontrol || externo
    };

});

const services = [
    'Salas de Cirugía',
    'UCI',
    'Hospitalización'
];

// ==========================================
// ETIQUETAS
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
    ...bradenLabels,
    Evaluador: 'Evaluador',
    Evaluador_Externo: 'Evaluador externo'
};

// ==========================================
// CRITERIOS DE ADHERENCIA PE-ID-01
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
    'sí',
    'si'
]);

const negativos = new Set([
    'no',
    'unchecked'
]);

function calcularAdherencia(
    registros,
    criterios = criteriosAdherencia
) {

    let numerador = 0;
    let denominador = 0;
    let excluidos = 0;

    registros.forEach(registro => {

        criterios.forEach(criterio => {

            const respuesta = texto(
                registro[criterio]
            ).toLowerCase();

            if (positivos.has(respuesta)) {

                numerador++;
                denominador++;

            } else if (negativos.has(respuesta)) {

                denominador++;

            } else {

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
            ? numerador / denominador * 100
            : null
    };
}

// ==========================================
// FORMATO DE NÚMEROS
// ==========================================

function formatoNumero(valor) {

    return new Intl.NumberFormat('es-CO')
        .format(valor);

}

function formatoPorcentaje(valor) {

    return valor === null
        ? 'Sin evaluaciones'
        : valor.toLocaleString('es-CO', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
        }) + '%';

}

function actualizarTexto(id, valor) {

    const elemento = $(id);

    if (elemento) {
        elemento.textContent = valor;
    }

}

function aplicaciones(d) {

    return new Set(
        d.map(r => texto(r.ID_Aplicacion))
            .filter(Boolean)
    ).size;

}

// ==========================================
// GRUPOS DE VARIABLES
// ==========================================

const groups = {

    general: [
        ['__adherence', 'Adherencia general PE-ID-01'],
        ['__criteria_adherence', 'Adherencia por criterio'],
        ['Servicio', 'Aplicaciones por servicio'],
        ['Tipo_Control', 'Tipo de control'],
        ['Evaluador', 'Evaluador'],
        ['Personal_Diligencia', 'Personal que diligencia'],
        ['Valoracion_Riesgos', 'Valoración de riesgos'],
        ['__month', 'Pacientes por mes']
    ],

    mensual: [
        ['__monthly_adherence', 'Evolución mensual de adherencia'],
        ['__monthly_apps', 'Listas aplicadas por mes']
    ],

    comparativo: [
        ['__compare_adherence', 'Adherencia PE-ID-01 por servicio'],
        ['__compare_count', 'Aplicaciones por servicio'],
        ['__compare_missing', 'Campos vacíos por servicio'],
        ['__compare_variable', 'Comparación de respuestas por servicio']
    ],

    riesgo: Object.entries(bradenLabels),

    postural: [
        ['Criterio_R', labels.Criterio_R],
        ...['S', 'T', 'U', 'V', 'W', 'X', 'Y'].map(
            k => [
                'Criterio_' + k,
                labels['Criterio_' + k]
            ]
        )
    ],

    prevencion: [
        ...[
            'N', 'O', 'P', 'Q', 'Z',
            'AA', 'AB', 'AC', 'AD', 'AE', 'AF'
        ].map(k => [
            'Criterio_' + k,
            labels['Criterio_' + k]
        ])
    ],

    calidad: [
        ['__missing', 'Datos vacíos por variable'],
        ['__missingservice', 'Datos vacíos por servicio'],
        ['__missingrows', 'Registros con campos vacíos']
    ]

};

let tab = 'general';

let compareField = 'Criterio_R';

const dataKeys = [
    ...new Set([
        ...Object.keys(labels).filter(
            k => k.startsWith('Criterio_')
        ),
        ...criteriosAdherencia,
        ...Object.keys(bradenLabels),
        'Tipo_Control',
        'Evaluador',
        'Personal_Diligencia',
        'Valoracion_Riesgos'
    ])
];

// ==========================================
// FILTROS
// ==========================================

function valoresUnicos(registros, campo) {

    return [
        ...new Set(
            registros.map(r => texto(r[campo]))
                .filter(Boolean)
        )
    ].sort((a, b) =>
        a.localeCompare(b, 'es')
    );

}

function llenarSelect(id, valores, placeholder) {

    const elemento = $(id);

    if (!elemento) return;

    const anterior = elemento.value;

    elemento.innerHTML = `
        <option value="">
            ${esc(placeholder)}
        </option>

        ${valores.map(v => `
            <option value="${esc(v)}">
                ${esc(v)}
            </option>
        `).join('')}
    `;

    if (valores.includes(anterior)) {
        elemento.value = anterior;
    }

}

function iniciarControles() {

    const controles = [
        ...new Set([
            'Autocontrol',
            'Control Externo',
            ...valoresUnicos(all, 'Tipo_Control')
        ])
    ];

    llenarSelect(
        'control',
        controles,
        'Todos los controles'
    );

}

function refreshEvaluators() {

    const control = $('control').value;

    const servicio = $('service').value;

    const registros = all.filter(r =>

        services.includes(r.Servicio) &&

        (!control || r.Tipo_Control === control) &&

        (!servicio || r.Servicio === servicio)

    );

    const evaluadores = valoresUnicos(
        registros,
        'Evaluador'
    );

    llenarSelect(
        'evaluator',
        evaluadores,
        'Todos los evaluadores'
    );

    if (!evaluadores.length) {

        $('evaluator').innerHTML += `
            <option disabled>
                Sin evaluadores disponibles
            </option>
        `;

    }

}

function rows() {

    const servicio = $('service').value;
    const control = $('control').value;
    const evaluador = $('evaluator').value;

    const desde = $('from').value;
    const hasta = $('to').value;

    return all.filter(r => {

        if (!services.includes(r.Servicio)) {
            return false;
        }

        if (servicio && r.Servicio !== servicio) {
            return false;
        }

        if (control && r.Tipo_Control !== control) {
            return false;
        }

        if (evaluador && r.Evaluador !== evaluador) {
            return false;
        }

        const fecha = texto(
            r.Fecha_Auditoria
        ).slice(0, 10);

        if ((desde || hasta) && !fechaValida(fecha)) {
            return false;
        }

        if (desde && fecha < desde) {
            return false;
        }

        if (hasta && fecha > hasta) {
            return false;
        }

        return true;

    });

}

// ==========================================
// VALIDACIÓN Y AGRUPACIÓN DE FECHAS
// ==========================================

function fechaValida(valor) {

    const fecha = texto(valor).slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const d = new Date(fecha + 'T12:00:00Z');

    return !Number.isNaN(d.getTime()) &&
        d.toISOString().slice(0, 10) === fecha;

}

function agruparMeses(d) {

    const meses = {};

    d.forEach(r => {

        if (!fechaValida(r.Fecha_Auditoria)) {
            return;
        }

        const mes = texto(
            r.Fecha_Auditoria
        ).slice(0, 7);

        (meses[mes] ??= []).push(r);

    });

    return Object.entries(meses)
        .sort(([a], [b]) => a.localeCompare(b));

}

function obtenerAdherenciaMensual(d) {

    return agruparMeses(d).map(
        ([mes, registros]) => ({
            mes,
            ...calcularAdherencia(registros)
        })
    );

}

function nombreMes(mes) {

    return new Date(
        mes + '-01T12:00:00'
    ).toLocaleDateString('es-CO', {
        month: 'short',
        year: '2-digit'
    });

}

function mesesConsecutivos(a, b) {

    const [ya, ma] = a.split('-').map(Number);

    const [yb, mb] = b.split('-').map(Number);

    return yb * 12 + mb - (ya * 12 + ma) === 1;

}

// ==========================================
// TARJETAS SUPERIORES
// ==========================================

function renderKpis(d) {

    const a = calcularAdherencia(d);

    actualizarTexto(
        'adherenceKpi',
        a.porcentaje === null
            ? '—'
            : formatoPorcentaje(a.porcentaje)
    );

    actualizarTexto(
        'apps',
        formatoNumero(aplicaciones(d))
    );

    actualizarTexto(
        'numerator',
        formatoNumero(a.numerador)
    );

    actualizarTexto(
        'denominator',
        formatoNumero(a.denominador)
    );

    actualizarTexto(
        'records',
        formatoNumero(d.length)
    );

}

// ==========================================
// GRÁFICA MENSUAL DE LÍNEAS
// ==========================================

function generarGraficaMensual(d) {

    const datos = obtenerAdherenciaMensual(d);

    if (!datos.some(p => p.porcentaje !== null)) {

        return `
            <div class="empty-state">
                No hay evaluaciones con fechas válidas
                para generar la gráfica mensual.
            </div>
        `;

    }

    const width = Math.max(
        500,
        datos.length * 65 + 90
    );

    const height = 290;

    const left = 50;
    const right = 35;
    const top = 30;
    const bottom = 45;

    const plotWidth = width - left - right;

    const plotHeight = height - top - bottom;

    const x = i => datos.length === 1
        ? left + plotWidth / 2
        : left + i * plotWidth / (datos.length - 1);

    const y = v =>
        top + plotHeight * (1 - v / 100);

    const grid = [0, 25, 50, 75, 100].map(v => `

        <line
            x1="${left}"
            y1="${y(v)}"
            x2="${width - right}"
            y2="${y(v)}"
            stroke="#e4ebf2"
            stroke-width="1"
            stroke-dasharray="4 4"
        />

        <text
            x="${left - 10}"
            y="${y(v) + 4}"
            text-anchor="end"
            font-size="11"
            fill="#8292a3"
        >
            ${v}%
        </text>

    `).join('');

    let path = '';

    let anterior = null;

    datos.forEach((p, i) => {

        if (p.porcentaje === null) {

            anterior = null;
            return;

        }

        const conectar = anterior !== null &&
            mesesConsecutivos(anterior, p.mes);

        path +=
            `${conectar ? 'L' : 'M'} ` +
            `${x(i)} ${y(p.porcentaje)} `;

        anterior = p.mes;

    });

    const puntos = datos.map((p, i) => {

        if (p.porcentaje === null) {
            return '';
        }

        return `

            <circle
                cx="${x(i)}"
                cy="${y(p.porcentaje)}"
                r="5"
                fill="#1683ad"
                stroke="white"
                stroke-width="2"
            >

                <title>
                    ${esc(nombreMes(p.mes))}:
                    ${formatoPorcentaje(p.porcentaje)}
                    (${p.numerador}/${p.denominador})
                </title>

            </circle>

            <text
                x="${x(i)}"
                y="${y(p.porcentaje) - 12}"
                text-anchor="middle"
                font-size="10"
                font-weight="700"
                fill="#1683ad"
            >
                ${formatoPorcentaje(p.porcentaje)}
            </text>

        `;

    }).join('');

    const etiquetas = datos.map((p, i) => `

        <text
            x="${x(i)}"
            y="${height - 15}"
            text-anchor="middle"
            font-size="11"
            fill="#8292a3"
        >
            ${esc(nombreMes(p.mes))}
        </text>

    `).join('');

    return `

        <div style="overflow-x:auto;width:100%;">

            <svg
                viewBox="0 0 ${width} ${height}"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Evolución mensual de adherencia"
                style="
                    display:block;
                    width:100%;
                    min-width:${Math.min(width, 500)}px;
                    height:auto;
                "
            >

                ${grid}

                <path
                    d="${path}"
                    fill="none"
                    stroke="#1683ad"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />

                ${puntos}

                ${etiquetas}

            </svg>

        </div>

    `;

}

// ==========================================
// GRÁFICA DE ADHERENCIA POR SERVICIO
// ==========================================

function generarServicios(d) {

    return services.map(servicio => {

        const registros = d.filter(
            r => r.Servicio === servicio
        );

        const a = calcularAdherencia(registros);

        return `

            <div class="overview-service">

                <div class="overview-service-head">

                    <span>
                        ${esc(servicio)}
                    </span>

                    <strong>
                        ${formatoPorcentaje(a.porcentaje)}
                    </strong>

                </div>

                <div class="overview-track">

                    <div
                        class="overview-fill"
                        style="width:${a.porcentaje ?? 0}%"
                    ></div>

                </div>

                <small>

                    ${formatoNumero(a.numerador)}

                    de

                    ${formatoNumero(a.denominador)}

                    criterios cumplidos

                </small>

            </div>

        `;

    }).join('');

}

// ==========================================
// GRÁFICA CIRCULAR
// ==========================================

function generarDonut(d) {

    const a = calcularAdherencia(d);

    if (a.porcentaje === null) {

        return `
            <div class="empty-state">
                Sin criterios evaluados.
            </div>
        `;

    }

    const p = a.porcentaje;

    return `

        <div class="donut-layout">

            <div
                class="donut"
                style="
                    background:conic-gradient(
                        #1683ad 0% ${p}%,
                        #d97757 ${p}% 100%
                    );
                "
            >

                <div class="donut-center">

                    <strong>
                        ${formatoPorcentaje(p)}
                    </strong>

                    <small>Adherencia</small>

                </div>

            </div>

            <div class="donut-legend">

                <div class="legend-item">

                    <span class="legend-dot positive"></span>

                    <div>

                        Criterios cumplidos

                        <strong>
                            ${formatoNumero(a.numerador)}
                        </strong>

                    </div>

                </div>

                <div class="legend-item">

                    <span class="legend-dot negative"></span>

                    <div>

                        Criterios incumplidos

                        <strong>
                            ${formatoNumero(a.incumplimientos)}
                        </strong>

                    </div>

                </div>

            </div>

        </div>

    `;

}

// ==========================================
// RESUMEN GENERAL
// ==========================================

function renderOverview(d) {

    renderKpis(d);

    if ($('overview')) {

        $('overview').hidden = tab !== 'general';

    }

    if (tab !== 'general') return;

    if ($('monthlyLine')) {

        $('monthlyLine').innerHTML =
            generarGraficaMensual(d);

    }

    if ($('overviewServices')) {

        $('overviewServices').innerHTML =
            generarServicios(d);

    }

    if ($('overviewDonut')) {

        $('overviewDonut').innerHTML =
            generarDonut(d);

    }

}

// ==========================================
// GRÁFICAS DE BARRAS
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
                    title="${esc(label)}"
                >
                    ${esc(label)}
                </div>

                <div class="track">

                    <div
                        class="fill ${label === 'Sin respuesta' ? 'empty' : ''}"
                        style="width:${100 * n / max}%"
                    ></div>

                </div>

                <div class="barvalue">

                    ${formatoNumero(n)}

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

function counts(d, key) {

    const o = Object.create(null);

    d.forEach(r => {

        const v = texto(r[key]) || 'Sin respuesta';

        o[v] = (o[v] || 0) + 1;

    });

    return Object.entries(o).sort(
        (a, b) => b[1] - a[1]
    );

}

// ==========================================
// GRÁFICAS DE ADHERENCIA
// ==========================================

function renderAdherencia(items) {

    $('visual').innerHTML = items.length

        ? items.map(([nombre, a]) => `

            <div class="service-row">

                <div class="service-line">

                    <span title="${esc(nombre)}">
                        ${esc(nombre)}
                    </span>

                    <strong>
                        ${formatoPorcentaje(a.porcentaje)}
                    </strong>

                </div>

                <div class="service-track">

                    <div
                        class="service-fill"
                        style="width:${a.porcentaje ?? 0}%"
                    ></div>

                </div>

                <div class="compare-values">

                    <span>
                        Cumplidos: ${formatoNumero(a.numerador)}
                    </span>

                    <span>
                        Evaluados: ${formatoNumero(a.denominador)}
                    </span>

                    <span>
                        Incumplidos: ${formatoNumero(a.incumplimientos)}
                    </span>

                    <span>
                        Excluidos: ${formatoNumero(a.excluidos)}
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

// ==========================================
// PANEL SECUNDARIO DE SERVICIOS
// ==========================================

function renderService(d) {

    const serviceCounts = services.map(s => [
        s,
        d.filter(r => r.Servicio === s).length
    ]);

    const max = Math.max(
        1,
        ...serviceCounts.map(x => x[1])
    );

    if ($('servicebars')) {

        $('servicebars').innerHTML = serviceCounts.map(
            ([s, n]) => `

                <div class="service-row">

                    <div class="service-line">

                        <span>${esc(s)}</span>

                        <strong>
                            ${formatoNumero(n)} registros
                        </strong>

                    </div>

                    <div class="service-track">

                        <div
                            class="service-fill"
                            style="width:${100 * n / max}%"
                        ></div>

                    </div>

                </div>

            `
        ).join('');

    }

    const a = calcularAdherencia(d);

    if ($('insight')) {

        $('insight').innerHTML = `

            <strong>Indicador PE-ID-01</strong>

            <br><br>

            Adherencia:
            <strong>
                ${formatoPorcentaje(a.porcentaje)}
            </strong>

            <br>

            Numerador:
            <strong>${formatoNumero(a.numerador)}</strong>

            <br>

            Denominador:
            <strong>${formatoNumero(a.denominador)}</strong>

            <br>

            Incumplimientos:
            <strong>${formatoNumero(a.incumplimientos)}</strong>

            <br>

            Respuestas excluidas:
            <strong>${formatoNumero(a.excluidos)}</strong>

            <br><br>

            <small>
                Cálculo provisional por criterio evaluado.
            </small>

        `;

    }

}

// ==========================================
// COMPARACIÓN DE VARIABLES
// ==========================================

function renderComparacionVariable(d) {

    if (!dataKeys.includes(compareField)) {

        compareField = dataKeys[0] || 'Criterio_R';

    }

    const subset = services.map(s => {

        const rr = d.filter(
            r => r.Servicio === s
        );

        const distribucion = counts(
            rr,
            compareField
        );

        return `

            <div class="compare-row">

                <strong>${esc(s)}</strong>

                <div class="compare-values">

                    ${
                        distribucion.length

                        ? distribucion.map(([respuesta, n]) => `

                            <span>

                                ${esc(respuesta)}:

                                ${formatoNumero(n)}

                            </span>

                        `).join('')

                        : '<span>Sin registros</span>'
                    }

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
                        ${k === compareField ? 'selected' : ''}
                    >
                        ${esc(labels[k] || k)}
                    </option>

                `).join('')}

            </select>

        </label>

        ${subset.join('')}

    `;

    $('comparefield').addEventListener(
        'change',
        e => {

            compareField = e.target.value;

            render();

        }
    );

}

// ==========================================
// CALIDAD DE DATOS
// ==========================================

function contarVacios(registros) {

    return registros.reduce(
        (total, r) => total +
            dataKeys.filter(
                k => !texto(r[k])
            ).length,
        0
    );

}

// ==========================================
// RENDERIZAR DASHBOARD
// ==========================================

function render() {

    const d = rows();

    const key = $('variable').value;

    renderOverview(d);

    actualizarTexto(
        'datewarn',
        all.some(r => fechaValida(r.Fecha_Auditoria))
            ? ''
            : 'No hay fechas de auditoría válidas disponibles.'
    );

    let foot =
        'Los datos vacíos no se consideran automáticamente incumplimientos.';

    // ADHERENCIA GENERAL

    if (key === '__adherence') {

        const a = calcularAdherencia(d);

        $('visual').innerHTML = `

            <div style="
                padding:15px;
                text-align:center;
            ">

                <div style="
                    font-size:14px;
                    font-weight:600;
                ">
                    Indicador PE-ID-01
                </div>

                <div style="
                    font-size:42px;
                    font-weight:800;
                    color:#1683ad;
                    margin:12px 0;
                ">

                    ${formatoPorcentaje(a.porcentaje)}

                </div>

                <div>

                    ${formatoNumero(a.numerador)}

                    criterios cumplidos de

                    ${formatoNumero(a.denominador)}

                    evaluados.

                </div>

            </div>

            ${generarDonut(d)}

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
            'Criterios ordenados de menor a mayor adherencia.';

    }

    // ADHERENCIA MENSUAL

    else if (key === '__monthly_adherence') {

        $('visual').innerHTML =
            generarGraficaMensual(d);

        const sinFecha = d.filter(
            r => !fechaValida(r.Fecha_Auditoria)
        ).length;

        foot =
            'Adherencia calculada por criterio evaluado en cada mes. ' +
            `Registros sin fecha válida: ${sinFecha}.`;

    }

    // LISTAS APLICADAS POR MES

    else if (key === '__monthly_apps') {

        const resultados = agruparMeses(d).map(
            ([mes, registros]) => [
                nombreMes(mes),
                aplicaciones(registros)
            ]
        );

        renderBars(resultados);

        foot =
            'Número de listas aplicadas por mes. No equivale a pacientes únicos.';

    }

    // ADHERENCIA POR SERVICIO

    else if (key === '__compare_adherence') {

        renderAdherencia(

            services.map(s => [
                s,
                calcularAdherencia(
                    d.filter(r => r.Servicio === s)
                )
            ])

        );

        foot =
            'Cada servicio tiene su propio numerador y denominador.';

    }

    // APLICACIONES POR SERVICIO

    else if (
        key === '__compare_count' ||
        key === 'Servicio'
    ) {

        renderBars(

            services.map(s => [
                s,
                aplicaciones(
                    d.filter(r => r.Servicio === s)
                )
            ]),

            true

        );

        foot =
            'Número de aplicaciones distintas por servicio.';

    }

    // COMPARACIÓN DE VARIABLES

    else if (key === '__compare_variable') {

        renderComparacionVariable(d);

        foot =
            'Distribución de las respuestas originales por servicio. Los códigos numéricos no se interpretan automáticamente como cumplimiento.';

    }

    // PACIENTES POR MES

    else if (key === '__month') {

        $('visual').innerHTML = `

            <div class="empty-state">

                No es posible calcular pacientes únicos
                sin un identificador seudonimizado
                de paciente.

            </div>

        `;

        foot =
            'Una lista aplicada no equivale necesariamente a un paciente único.';

    }

    // ESCALA BRADEN

    else if (Object.hasOwn(bradenLabels, key)) {

        const disponibles = d.filter(
            r => texto(r[key]) !== ''
        );

        if (!d.length) {

            $('visual').innerHTML = `

                <div class="empty-state">
                    No hay registros para esta selección.
                </div>

            `;

        } else {

            let items = counts(d, key);

            if (key === 'Total_Braden') {

                items.sort(([a], [b]) => {

                    if (a === 'Sin respuesta') return 1;

                    if (b === 'Sin respuesta') return -1;

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
            `${disponibles.length} de ${d.length} registros con respuesta. ` +
            'La escala Braden no forma parte del cálculo provisional de adherencia.';

    }

    // DATOS VACÍOS POR VARIABLE

    else if (key === '__missing') {

        renderBars(

            dataKeys.map(k => [
                labels[k] || k,
                d.filter(r => !texto(r[k])).length
            ])

            .sort((a, b) => b[1] - a[1])

            .slice(0, 20)

        );

        foot =
            'Las 20 variables con mayor número de campos vacíos. Algunas preguntas pueden ser condicionales.';

    }

    // DATOS VACÍOS POR SERVICIO

    else if (
        key === '__missingservice' ||
        key === '__compare_missing'
    ) {

        renderBars(

            services.map(s => [
                s,
                contarVacios(
                    d.filter(r => r.Servicio === s)
                )
            ])

        );

        foot =
            'Cantidad de celdas vacías por servicio, no número de pacientes.';

    }

    // REGISTROS CON CAMPOS VACÍOS

    else if (key === '__missingrows') {

        renderBars(

            [
                [
                    'Con campos vacíos',
                    d.filter(r =>
                        dataKeys.some(k => !texto(r[k]))
                    ).length
                ],
                [
                    'Sin campos vacíos',
                    d.filter(r =>
                        dataKeys.every(k => texto(r[k]))
                    ).length
                ]
            ],

            true

        );

    }

    // DISTRIBUCIONES GENERALES

    else {

        renderBars(
            counts(d, key),
            true
        );

    }

    actualizarTexto('foot', foot);

    actualizarTexto(
        'charttitle',
        $('variable').selectedOptions[0]?.textContent ||
        'Resultados'
    );

    actualizarTexto(
        'chartdesc',
        'Distribución según los filtros seleccionados'
    );

    renderService(d);

    renderTable(d, key);

}

// ==========================================
// TABLA DE REGISTROS
// ==========================================

function renderTable(d, key) {

    const q = texto(
        $('search').value
    ).toLowerCase();

    const adherenceViews = [
        '__adherence',
        '__criteria_adherence',
        '__monthly_adherence',
        '__compare_adherence'
    ];

    const registros = d.filter(r =>

        !q ||

        [
            r.ID_Aplicacion,
            r.Evaluador,
            r.Servicio,
            r.Tipo_Control
        ].some(v =>

            texto(v).toLowerCase().includes(q)

        )

    );

    $('tbody').innerHTML = registros

        .slice(0, 100)

        .map(r => {

            let value;

            if (adherenceViews.includes(key)) {

                const a = calcularAdherencia([r]);

                value = a.porcentaje === null

                    ? 'Sin evaluaciones'

                    : `${a.numerador}/${a.denominador} · ${formatoPorcentaje(a.porcentaje)}`;

            } else if (key === '__compare_variable') {

                value = texto(r[compareField]);

            } else if (key === '__monthly_apps') {

                value = texto(r.Fecha_Auditoria);

            } else if (key === '__compare_count') {

                value = texto(r.ID_Aplicacion);

            } else if (
                key === '__missing' ||
                key === '__missingservice' ||
                key === '__compare_missing' ||
                key === '__missingrows'
            ) {

                value = `${contarVacios([r])} campos vacíos`;

            } else if (key === '__month') {

                value = 'Paciente único no disponible';

            } else {

                value = texto(r[key]);

            }

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
                        ${esc(r.Evaluador || 'Sin respuesta')}
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
// TÍTULOS DE SECCIONES
// ==========================================

const titles = {

    general: [
        'Resumen general',
        'Indicador PE-ID-01 y caracterización de auditorías'
    ],

    mensual: [
        'Adherencia por mes',
        'Seguimiento temporal del indicador PE-ID-01'
    ],

    comparativo: [
        'Comparativo de servicios',
        'Salas de Cirugía, UCI y Hospitalización'
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
// NAVEGACIÓN ENTRE PESTAÑAS
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

    actualizarTexto(
        'sectiontitle',
        titles[t][0]
    );

    actualizarTexto(
        'sectiondesc',
        titles[t][1]
    );

    $('variable').innerHTML = groups[t].map(
        ([k, l]) => `

            <option value="${esc(k)}">

                ${esc(l || labels[k] || k)}

            </option>

        `
    ).join('');

    render();

}

document.querySelectorAll('[data-tab]').forEach(b => {

    b.addEventListener(
        'click',
        () => setTab(b.dataset.tab)
    );

});

// ==========================================
// EVENTOS DE FILTROS
// ==========================================

$('service').addEventListener(
    'change',
    () => {

        refreshEvaluators();

        render();

    }
);

$('control').addEventListener(
    'change',
    () => {

        refreshEvaluators();

        render();

    }
);

[
    'evaluator',
    'from',
    'to',
    'variable'
].forEach(id => {

    $(id).addEventListener(
        'change',
        render
    );

});

$('search').addEventListener(
    'input',
    () => renderTable(
        rows(),
        $('variable').value
    )
);

// ==========================================
// LIMPIAR FILTROS
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

    refreshEvaluators();

    render();

});

// ==========================================
// EXPORTACIÓN CSV
// ==========================================

function csvCell(valor) {

    let v = String(valor ?? '');

    // Evitar fórmulas ejecutables en Excel.

    if (/^[\s]*[=+\-@]/.test(v) || /^[\t\r\n]/.test(v)) {

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

    const blob = new Blob(

        ['\ufeff' + csv],

        {
            type: 'text/csv;charset=utf-8'
        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = 'PE1167_datos_filtrados.csv';

    a.click();

    URL.revokeObjectURL(url);

});

// ==========================================
// INICIAR DASHBOARD
// ==========================================

iniciarControles();

refreshEvaluators();

setTab('general');
