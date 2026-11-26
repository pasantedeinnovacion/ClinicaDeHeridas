
// ==========================================
// CLÍNICA DE HERIDAS - HUN
// DASHBOARD PE-ID-01
// AUTOCONTROL ASISTENCIAL
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
// 01. NORMALIZACIÓN DE DATOS
// ==========================================

function normalizarTexto(valor) {
    return texto(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function normalizarControl(valor) {

    const v = normalizarTexto(valor);

    if ([
        'autocontrol',
        'auto control',
        'auto-control'
    ].includes(v)) {
        return 'Autocontrol';
    }

    return texto(valor);
}

const services = [
    'Salas de Cirugía',
    'UCI',
    'Hospitalización'
];

function normalizarServicio(valor) {

    const servicios = {
        'cuidado critico': 'UCI',
        'uci': 'UCI',
        'hospitalizacion': 'Hospitalización',
        'salas de cirugia': 'Salas de Cirugía'
    };

    return servicios[normalizarTexto(valor)] || '';
}

// ==========================================
// 02. FILTRAR AUTOCONTROL DEL SERVICIO
// ==========================================

const all = (window.PE1167_DATA || [])

    .map(r => ({
        ...r,

        Servicio: normalizarServicio(r.Servicio),

        Tipo_Control: normalizarControl(
            r.Tipo_Control
        ),

        Evaluador: texto(
            r.Evaluador_Autocontrol
        ),

        Personal_Diligencia: texto(
            r.Personal_Diligencia
        )

    }))

    .filter(r =>

        r.Tipo_Control === 'Autocontrol' &&

        services.includes(r.Servicio) &&

        normalizarTexto(r.Personal_Diligencia) ===
            'personal del servicio' &&

        ['checked', '1'].includes(
            normalizarTexto(r.Valoracion_Riesgos)
        )

    );

// ==========================================
// 03. ETIQUETAS
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

    Evaluador: 'Personal de autocontrol',

    Evaluador_Autocontrol: 'Personal de autocontrol',

    Personal_Diligencia: 'Personal que diligencia',

    Tipo_Control: 'Tipo de control'

};

// ==========================================
// 04. CRITERIOS DE ADHERENCIA
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
// 05. CÁLCULO DEL INDICADOR PE-ID-01
// ==========================================

function calcularAdherencia(
    registros,
    criterios = criteriosAdherencia
) {

    let numerador = 0;
    let denominador = 0;
    let excluidos = 0;

    registros.forEach(registro => {

        criterios.forEach(criterio => {

            const respuesta = normalizarTexto(
                registro[criterio]
            );

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
// 06. FORMATO DE NÚMEROS
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
// 07. GRUPOS DE VARIABLES
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
            'Evaluador',
            'Personal de autocontrol'
        ],

        [
            'Personal_Diligencia',
            'Personal que diligencia'
        ],

        [
            'Valoracion_Riesgos',
            'Valoración de riesgos'
        ],

        [
            '__month',
            'Pacientes por mes'
        ]

    ],

    mensual: [

        [
            '__monthly_adherence',
            'Evolución mensual de adherencia'
        ],

        [
            '__monthly_apps',
            'Listas aplicadas por mes'
        ]

    ],

    comparativo: [

        [
            '__compare_adherence',
            'Adherencia PE-ID-01 por servicio'
        ],

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
        ]

    ],

    riesgo: Object.entries(bradenLabels),

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

let compareField = 'Criterio_R';

let periodoMensual = '12';

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
// 08. FILTROS
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

// ==========================================
// 09. AUTOCONTROL FIJO
// ==========================================

function iniciarControles() {

    const control = $('control');

    if (!control) return;

    control.innerHTML = `

        <option value="Autocontrol">
            Autocontrol
        </option>

    `;

    control.value = 'Autocontrol';

    control.disabled = true;

}

// ==========================================
// 10. PERSONAL SEGÚN SERVICIO
// ==========================================

function refreshEvaluators() {

    const servicio = $('service').value;

    const registros = all.filter(r =>

        services.includes(r.Servicio) &&

        (!servicio || r.Servicio === servicio)

    );

    const evaluadores = valoresUnicos(

        registros,

        'Evaluador'

    );

    llenarSelect(

        'evaluator',

        evaluadores,

        'Todo el personal'

    );

    if (!evaluadores.length) {

        $('evaluator').innerHTML += `

            <option disabled>
                Sin personal disponible
            </option>

        `;

    }

}

// ==========================================
// 11. OBTENER REGISTROS FILTRADOS
// ==========================================

function rows() {

    const servicio = $('service').value;

    const evaluador = $('evaluator').value;

    const desde = $('from').value;

    const hasta = $('to').value;

    return all.filter(r => {

        if (r.Tipo_Control !== 'Autocontrol') {

            return false;

        }

        if (!services.includes(r.Servicio)) {

            return false;

        }

        if (servicio && r.Servicio !== servicio) {

            return false;

        }

        if (evaluador && r.Evaluador !== evaluador) {

            return false;

        }

        const fecha = texto(
            r.Fecha_Auditoria
        ).slice(0, 10);

        if (
            (desde || hasta) &&
            !fechaValida(fecha)
        ) {

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
// 12. VALIDACIÓN DE FECHAS
// ==========================================

function fechaValida(valor) {

    const fecha = texto(valor).slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {

        return false;

    }

    const d = new Date(
        fecha + 'T12:00:00Z'
    );

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

function indiceMes(mes) {

    const [anio, numero] = mes.split('-').map(Number);

    return anio * 12 + numero - 1;

}

function mesesConsecutivos(a, b) {

    return indiceMes(b) - indiceMes(a) === 1;

}

function mesDesdeIndice(indice) {

    const anio = Math.floor(indice / 12);

    const mes = indice % 12 + 1;

    return `${anio}-${String(mes).padStart(2, '0')}`;

}

// ==========================================
// 13. TARJETAS SUPERIORES
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
// 14. GRÁFICA MENSUAL CORREGIDA
// ==========================================

function generarGraficaMensual(d, contenedor) {

    const historico = obtenerAdherenciaMensual(d);

    const selector = `

        <div style="
            display:flex;
            justify-content:flex-end;
            align-items:center;
            gap:10px;
            margin-bottom:15px;
        ">

            <label style="
                font-size:12px;
                color:#687b91;
                font-weight:600;
            ">

                Periodo

                <select
                    data-periodo-mensual
                    style="
                        padding:8px;
                        margin-left:6px;
                        border:1px solid #dbe4ee;
                        border-radius:8px;
                        background:white;
                        color:#27415b;
                    "
                >

                    ${[

                        ['6', 'Últimos 6 meses'],

                        ['12', 'Últimos 12 meses'],

                        ['24', 'Últimos 24 meses'],

                        ['all', 'Histórico completo']

                    ].map(([valor, nombre]) => `

                        <option
                            value="${valor}"
                            ${periodoMensual === valor
                                ? 'selected'
                                : ''}
                        >
                            ${nombre}
                        </option>

                    `).join('')}

                </select>

            </label>

        </div>

    `;

    if (!historico.length) {

        return selector + `

            <div class="empty-state">

                No hay registros de autocontrol
                con fechas válidas.

            </div>

        `;

    }

    const primerMes = indiceMes(
        historico[0].mes
    );

    const ultimoMes = indiceMes(
        historico[historico.length - 1].mes
    );

    const inicio = periodoMensual === 'all'

        ? primerMes

        : Math.max(
            primerMes,
            ultimoMes - Number(periodoMensual) + 1
        );

    const mapa = new Map(

        historico.map(p => [p.mes, p])

    );

    const datos = [];

    for (let i = inicio; i <= ultimoMes; i++) {

        const mes = mesDesdeIndice(i);

        datos.push(

            mapa.get(mes) || {

                mes,

                numerador: 0,

                denominador: 0,

                porcentaje: null

            }

        );

    }

    if (!datos.some(p => p.porcentaje !== null)) {

        return selector + `

            <div class="empty-state">

                No hay criterios evaluados
                para este periodo.

            </div>

        `;

    }

    const anchoDisponible = contenedor

        ? contenedor.clientWidth

        : 0;

    const width = Math.max(

        360,

        anchoDisponible,

        datos.length * 78 + 100

    );

    const height = 290;

    const left = 50;
    const right = 45;
    const top = 35;
    const bottom = 45;

    const plotWidth = width - left - right;

    const plotHeight = height - top - bottom;

    const x = i => datos.length === 1

        ? left + plotWidth / 2

        : left + i * plotWidth / (datos.length - 1);

    const y = v =>

        top + plotHeight * (1 - v / 100);

    // EJE VERTICAL 0% - 100%

    const grid = [0, 25, 50, 75, 100].map(v => `

        <line
            x1="${left}"
            y1="${y(v)}"
            x2="${width - right}"
            y2="${y(v)}"
            class="line-grid"
        />

        <text
            x="${left - 10}"
            y="${y(v) + 4}"
            text-anchor="end"
            class="line-label"
        >
            ${v}%
        </text>

    `).join('');

    // CONSTRUIR LÍNEA

    let path = '';

    let anterior = null;

    datos.forEach((p, i) => {

        if (p.porcentaje === null) {

            anterior = null;

            return;

        }

        const conectar =

            anterior !== null &&

            mesesConsecutivos(anterior, p.mes);

        path +=

            `${conectar ? 'L' : 'M'} ` +

            `${x(i)} ${y(p.porcentaje)} `;

        anterior = p.mes;

    });

    // PUNTOS Y PORCENTAJES

    const puntos = datos.map((p, i) => {

        if (p.porcentaje === null) {

            return '';

        }

        return `

            <circle
                cx="${x(i)}"
                cy="${y(p.porcentaje)}"
                r="5"
                class="line-point"
            >

                <title>

                    ${esc(nombreMes(p.mes))}

                    · ${formatoPorcentaje(p.porcentaje)}

                    · ${p.numerador}/${p.denominador}

                </title>

            </circle>

            <text
                x="${x(i)}"
                y="${y(p.porcentaje) - 13}"
                text-anchor="middle"
                class="line-value"
            >

                ${formatoPorcentaje(p.porcentaje)}

            </text>

        `;

    }).join('');

    // ETIQUETAS DE LOS MESES

    const etiquetas = datos.map((p, i) => `

        <text
            x="${x(i)}"
            y="${height - 15}"
            text-anchor="middle"
            class="line-label"
        >

            ${esc(nombreMes(p.mes))}

        </text>

    `).join('');

    return selector + `

        <div style="
            width:100%;
            overflow-x:auto;
            padding-bottom:8px;
        ">

            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 ${width} ${height}"
                role="img"
                aria-label="Evolución mensual de adherencia"
                style="
                    display:block;
                    width:${width}px !important;
                    min-width:${width}px;
                    max-width:none;
                    height:${height}px !important;
                "
            >

                ${grid}

                <path
                    d="${path}"
                    class="line-path"
                />

                ${puntos}

                ${etiquetas}

            </svg>

        </div>

        <div style="
            font-size:11px;
            color:#8190a2;
            margin-top:8px;
        ">

            Periodo basado en el último mes disponible.
            Los meses sin evaluaciones no equivalen al 0%.

        </div>

    `;

}

// ==========================================
// 15. ADHERENCIA POR SERVICIO
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
// 16. GRÁFICA CIRCULAR
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
// 17. RESUMEN GENERAL
// ==========================================

function renderOverview(d) {

    renderKpis(d);

    if ($('overview')) {

        $('overview').hidden = tab !== 'general';

    }

    if (tab !== 'general') return;

    if ($('monthlyLine')) {

        $('monthlyLine').innerHTML =

            generarGraficaMensual(
                d,
                $('monthlyLine')
            );

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
// 18. GRÁFICAS DE BARRAS
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
                        class="fill ${
                            label === 'Sin respuesta'
                                ? 'empty'
                                : ''
                        }"
                        style="width:${100 * n / max}%"
                    ></div>

                </div>

                <div class="barvalue">

                    ${formatoNumero(n)}

                    ${

                        showPct && total

                            ? ' · ' +
                                (100 * n / total).toFixed(1) +
                                '%'

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
// 19. GRÁFICAS DE ADHERENCIA
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

                        Cumplidos:
                        ${formatoNumero(a.numerador)}

                    </span>

                    <span>

                        Evaluados:
                        ${formatoNumero(a.denominador)}

                    </span>

                    <span>

                        Incumplidos:
                        ${formatoNumero(a.incumplimientos)}

                    </span>

                    <span>

                        Excluidos:
                        ${formatoNumero(a.excluidos)}

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
// 20. PANEL SECUNDARIO
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

                        <span>

                            ${esc(s)}

                        </span>

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

            <strong>

                Indicador PE-ID-01

            </strong>

            <br><br>

            Tipo de control:

            <strong>Autocontrol</strong>

            <br>

            Personal:

            <strong>Del servicio</strong>

            <br><br>

            Adherencia:

            <strong>

                ${formatoPorcentaje(a.porcentaje)}

            </strong>

            <br>

            Numerador:

            <strong>

                ${formatoNumero(a.numerador)}

            </strong>

            <br>

            Denominador:

            <strong>

                ${formatoNumero(a.denominador)}

            </strong>

            <br>

            Incumplimientos:

            <strong>

                ${formatoNumero(a.incumplimientos)}

            </strong>

            <br>

            Respuestas excluidas:

            <strong>

                ${formatoNumero(a.excluidos)}

            </strong>

            <br><br>

            <small>

                Cálculo provisional por criterio evaluado.
                No incluye control externo.

            </small>

        `;

    }

}

// ==========================================
// 21. COMPARACIÓN DE VARIABLES
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

                <strong>

                    ${esc(s)}

                </strong>

                <div class="compare-values">

                    ${

                        distribucion.length

                            ? distribucion.map(
                                ([respuesta, n]) => `

                                    <span>

                                        ${esc(respuesta)}:

                                        ${formatoNumero(n)}

                                    </span>

                                `
                            ).join('')

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
                        ${k === compareField
                            ? 'selected'
                            : ''}
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
// 22. CALIDAD DE DATOS
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
// 23. RENDERIZAR DASHBOARD
// ==========================================

function render() {

    const d = rows();

    const key = $('variable').value;

    renderOverview(d);

    let advertencia = '';

    if (!all.length) {

        advertencia =
            'No se encontraron registros que cumplan ' +
            'las condiciones de autocontrol, personal ' +
            'del servicio y valoración de riesgos. ' +
            'Verifique las etiquetas de REDCap.';

    } else if (
        $('from').value &&
        $('to').value &&
        $('from').value > $('to').value
    ) {

        advertencia =
            'La fecha inicial no puede ser posterior a la final.';

    } else if (
        !all.some(r => fechaValida(r.Fecha_Auditoria))
    ) {

        advertencia =
            'No hay fechas de auditoría válidas disponibles.';

    }

    actualizarTexto('datewarn', advertencia);

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

            'Fórmula provisional: criterios cumplidos / ' +

            'criterios evaluados × 100. ' +

            'Solo autocontrol del personal del servicio. ' +

            'Se excluyen vacíos, No aplica y valores no reconocidos.';

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

            generarGraficaMensual(d, $('visual'));

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

            'Número de listas de autocontrol aplicadas por mes. ' +

            'No equivale a pacientes únicos.';

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

            'Número de aplicaciones distintas de autocontrol por servicio.';

    }

    // COMPARACIÓN DE VARIABLES

    else if (key === '__compare_variable') {

        renderComparacionVariable(d);

        foot =

            'Distribución de respuestas originales por servicio. ' +

            'Los códigos numéricos no se interpretan automáticamente como cumplimiento.';

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

            'Las 20 variables con mayor número de campos vacíos. ' +

            'Algunas preguntas pueden ser condicionales.';

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

        'Distribución de autocontrol según los filtros seleccionados'

    );

    renderService(d);

    renderTable(d, key);

}

// ==========================================
// 24. TABLA DE REGISTROS
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

            r.Tipo_Control,

            r.Personal_Diligencia

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

                        Autocontrol

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
// 25. TÍTULOS DE SECCIONES
// ==========================================

const titles = {

    general: [

        'Resumen general',

        'Indicador PE-ID-01 y caracterización del autocontrol asistencial'

    ],

    mensual: [

        'Adherencia por mes',

        'Seguimiento temporal del autocontrol del personal del servicio'

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

        'Completitud de registros de autocontrol y respuestas faltantes'

    ]

};

// ==========================================
// 26. NAVEGACIÓN ENTRE PESTAÑAS
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
// 27. EVENTOS DE FILTROS
// ==========================================

$('service').addEventListener(

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
// 28. SELECTOR DE PERIODO MENSUAL
// ==========================================

document.addEventListener('change', e => {

    if (
        e.target.matches('[data-periodo-mensual]')
    ) {

        const valor = e.target.value;

        if (['6', '12', '24', 'all'].includes(valor)) {

            periodoMensual = valor;

            render();

        }

    }

});

// ==========================================
// 29. LIMPIAR FILTROS
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

    $('control').value = 'Autocontrol';

    $('control').disabled = true;

    periodoMensual = '12';

    refreshEvaluators();

    render();

});

// ==========================================
// 30. EXPORTACIÓN CSV
// ==========================================

function csvCell(valor) {

    let v = String(valor ?? '');

    // Evitar fórmulas ejecutables en Excel.

    if (

        /^[\s]*[=+\-@]/.test(v) ||

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

        'Valoracion_Riesgos',

        ...Object.keys(labels).filter(

            k => k.startsWith('Criterio_')

        ),

        ...Object.keys(bradenLabels)

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

    a.download = 'PE1167_autocontrol_filtrado.csv';

    document.body.appendChild(a);

    a.click();

    a.remove();

    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 1000);

});

// ==========================================
// 31. AJUSTE RESPONSIVE DE GRÁFICAS
// ==========================================

let resizeTimer;

window.addEventListener('resize', () => {

    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {

        if (
            tab === 'general' ||
            $('variable').value === '__monthly_adherence'
        ) {

            render();

        }

    }, 200);

});

// ==========================================
// 32. INICIAR DASHBOARD
// ==========================================

iniciarControles();

refreshEvaluators();

setTab('general');
