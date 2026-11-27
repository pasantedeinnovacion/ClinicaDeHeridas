# Dashboard Clínica de Heridas – HUN

**Hospital Universitario Nacional de Colombia**  
**Proyecto:** PE 1167  
**Indicador:** PE-ID-01  
**Estado:** En desarrollo y validación institucional.

## 1. Descripción del proyecto

El aplicativo Dashboard Clínica de Heridas es una herramienta tecnológica desarrollada para facilitar la consulta, visualización, seguimiento y análisis de la adherencia al paquete instruccional de prevención de lesiones por presión (LPP) del Hospital Universitario Nacional de Colombia (HUN).

El sistema permite consultar los registros almacenados en REDCap mediante su API, procesar la información y presentarla a través de un tablero interactivo, facilitando el seguimiento de las prácticas asistenciales y la identificación de oportunidades de mejora.

La herramienta centraliza la información y disminuye la necesidad de realizar procesos manuales de exportación, consolidación y análisis de bases de datos.

## 2. Objetivo general

Desarrollar un aplicativo web que permita realizar el seguimiento de la adherencia al paquete instruccional de prevención de lesiones por presión mediante la integración con REDCap, facilitando la visualización y el análisis de los autocontroles realizados por el personal asistencial.

### 2.1. Objetivos específicos

- Automatizar la consulta de información registrada en REDCap.
- Facilitar el seguimiento del indicador PE-ID-01.
- Visualizar el comportamiento mensual de la adherencia.
- Comparar los resultados entre los servicios asistenciales.
- Identificar oportunidades de mejora en las prácticas de prevención de lesiones por presión.
- Analizar la calidad y completitud de los registros.
- Implementar mecanismos de autenticación para restringir el acceso a usuarios autorizados.

## 3. Alcance del aplicativo

El aplicativo está orientado exclusivamente al análisis de los autocontroles relacionados con el paquete instruccional de prevención de lesiones por presión.

### 3.1. Servicios incluidos

| Servicio en REDCap | Servicio en el aplicativo |
|---|---|
| Cuidado Crítico | UCI |
| Hospitalización | Hospitalización |
| Salas de Cirugía | Salas de Cirugía |

### 3.2. Criterios de inclusión

Para que un registro sea incluido en el análisis debe cumplir las siguientes condiciones:

- Tipo de control: Autocontrol.
- Personal que diligencia: Personal del Servicio.
- Paquete instruccional seleccionado: Valoración de Riesgos.
- Evaluador de autocontrol correspondiente a uno de los tres servicios incluidos.

Los registros correspondientes a controles externos y evaluadores ajenos al alcance definido no forman parte de la población analizada.

## 4. Funcionalidades principales

### 4.1. Resumen general

Presenta una visión consolidada de los registros disponibles, incluyendo:

- Número de listas de chequeo aplicadas.
- Número de registros disponibles.
- Adherencia general.
- Adherencia por criterio evaluado.
- Distribución de aplicaciones por servicio.
- Información del evaluador y tipo de control.

### 4.2. Adherencia por mes

Permite realizar el seguimiento temporal del indicador mediante:

- Evolución mensual de la adherencia.
- Número de listas de chequeo aplicadas por mes.
- Identificación de variaciones en los resultados.

Los periodos sin información no se interpretan automáticamente como una adherencia del 0 %.

### 4.3. Comparativo de servicios

Permite comparar los resultados entre Salas de Cirugía, UCI y Hospitalización.

Incluye:

- Número de aplicaciones por servicio.
- Porcentaje de adherencia por servicio.
- Comparación de respuestas por variable.
- Identificación de campos sin diligenciar.

### 4.4. Valoración del riesgo

Presenta las variables relacionadas con la escala de Braden:

- Percepción sensorial.
- Humedad.
- Actividad física.
- Movilidad.
- Nutrición.
- Fricción y deslizamiento.
- Puntaje total de riesgo de lesiones por presión.

### 4.5. Cambios posturales

Permite analizar el cumplimiento de los cambios posturales y los motivos registrados cuando estos no se realizan.

Entre los motivos analizados se encuentran:

- Paciente sedente en silla.
- Cambio de posición independiente.
- No adherencia.
- Deterioro hemodinámico.
- Indicación médica.
- Indicación quirúrgica.
- Otros motivos registrados.

### 4.6. Prevención y cuidado

Presenta información relacionada con las medidas preventivas implementadas durante la atención asistencial:

- Identificación del riesgo en el tablero.
- Identificación en la manilla del paciente.
- Registro en el formato de recibo y entrega de turno.
- Registro en la tarjeta de administración de medicamentos.
- Condiciones de la ropa de cama.
- Uso y condiciones del pañal.
- Utilización de apósitos multicapa.
- Uso de aditamentos liberadores de presión.
- Educación al paciente y su familia.

### 4.7. Calidad de datos

Permite identificar posibles oportunidades de mejora en el diligenciamiento de los instrumentos mediante:

- Campos vacíos por variable.
- Campos vacíos por servicio.
- Registros con información faltante.
- Registros completos.

Los campos vacíos pueden corresponder a preguntas condicionales que no aplican, por lo que no representan necesariamente incumplimientos asistenciales.

## 5. Filtros del aplicativo

| Filtro | Descripción |
|---|---|
| Servicio | Permite seleccionar uno o todos los servicios incluidos. |
| Tipo de control | Filtro fijo establecido en Autocontrol. |
| Personal que diligencia | Filtro fijo establecido en Personal del mismo servicio. |
| Evaluador | Permite seleccionar el evaluador de autocontrol. |
| Fecha inicial | Establece el inicio del periodo de análisis. |
| Fecha final | Establece el final del periodo de análisis. |

Los filtros actualizan dinámicamente los resultados, las gráficas y las tablas del aplicativo.

## 6. Indicador PE-ID-01

**Nombre:** Adherencia a Protocolo Paquete Instruccional Prevención de Lesiones de Piel.

### 6.1. Fórmula implementada

El aplicativo utiliza provisionalmente una metodología de cálculo basada en el cumplimiento individual de los criterios evaluados.

**Adherencia (%) = (Número de criterios cumplidos / Número total de criterios evaluados) × 100**

### 6.2. Numerador

Corresponde al número de respuestas positivas de los criterios incluidos en el cálculo.

Se reconocen las siguientes respuestas:

- Yes.
- Checked.
- Check.
- Sí.

### 6.3. Denominador

Corresponde al número total de respuestas válidas, incluyendo tanto los criterios cumplidos como los no cumplidos.

Las respuestas negativas reconocidas son No y Unchecked.

### 6.4. Criterios incluidos

| Variable interna | Criterio evaluado |
|---|---|
| Criterio_N | Identificación del riesgo en el tablero. |
| Criterio_O | Identificación del riesgo en la manilla. |
| Criterio_P | Registro en el formato de recibo y entrega de turno. |
| Criterio_Q | Registro en la tarjeta de administración de medicamentos. |
| Criterio_R | Cumplimiento de cambios posturales. |
| Criterio_Z | Condiciones adecuadas de la ropa de cama. |
| Criterio_AD | Utilización de apósitos multicapa. |
| Criterio_AE | Uso de aditamentos liberadores de presión durante procedimientos quirúrgicos. |
| Criterio_AF | Educación al paciente y su familia. |

### 6.5. Tratamiento de respuestas faltantes

Las respuestas vacías, no aplicables o no reconocidas por la fórmula se excluyen del numerador y del denominador.

Cuando no existen criterios evaluados, el aplicativo presenta el estado «Sin evaluaciones».

### 6.6. Ejemplo ilustrativo

| Concepto | Cantidad |
|---|---:|
| Criterios cumplidos | 850 |
| Criterios no cumplidos | 150 |
| Criterios excluidos | 50 |
| Total de criterios evaluados | 1.000 |
| Adherencia | 85 % |

Los valores anteriores son ficticios y se presentan exclusivamente para explicar el funcionamiento de la fórmula.

**Nota:** La fórmula y los criterios incluidos están pendientes de validación institucional. Los resultados no deben considerarse una medición oficial hasta contar con dicha aprobación.

## 7. Arquitectura del sistema

El aplicativo utiliza una arquitectura web compuesta por una interfaz de usuario, funciones de servidor, un servicio de autenticación y una fuente de información institucional.

| Componente | Tecnología | Función |
|---|---|---|
| Frontend | HTML5, CSS3 y JavaScript | Visualización e interacción con los datos. |
| Backend | Node.js y Netlify Functions | Consulta, procesamiento y entrega de información. |
| Fuente de datos | REDCap API | Obtención de registros institucionales. |
| Autenticación | OTP mediante correo electrónico | Validación de usuarios autorizados. |
| Correo electrónico | Brevo API | Envío de códigos de acceso. |
| Alojamiento | Netlify | Despliegue del aplicativo y ejecución de funciones. |
| Control de versiones | Git | Gestión y seguimiento de cambios. |

## 8. Flujo de funcionamiento

1. El usuario ingresa al aplicativo.
2. El sistema solicita su correo electrónico.
3. El backend verifica que el correo esté autorizado.
4. Se genera y envía un código de acceso OTP mediante Brevo.
5. El usuario introduce el código recibido.
6. El sistema valida el código y establece la sesión.
7. El backend realiza la consulta a REDCap.
8. Los registros se filtran, normalizan y clasifican por servicio.
9. El frontend recibe la información procesada.
10. Se generan los indicadores, las gráficas y las tablas.
11. El usuario puede consultar, filtrar y exportar los resultados según las autorizaciones institucionales.
12. El usuario puede finalizar su sesión mediante el botón Cerrar sesión.

## 9. Integración con REDCap

La integración se realiza mediante solicitudes HTTP de tipo POST a la API de REDCap.

El backend es responsable de:

- Gestionar el token de acceso.
- Solicitar las variables necesarias.
- Aplicar los criterios de inclusión.
- Normalizar las respuestas.
- Identificar el servicio correspondiente.
- Validar los registros.
- Entregar la información procesada al frontend.

### 9.1. Variables principales

| Variable REDCap | Descripción |
|---|---|
| record_id | Identificador de la aplicación. |
| control | Tipo de control realizado. |
| evaluador | Evaluador de autocontrol. |
| personal_que_diligencia | Personal que diligencia el instrumento. |
| paquete_instruccional_a_au | Paquete instruccional seleccionado. |
| fecha | Fecha de auditoría. |
| percepcion | Percepción sensorial. |
| humedad | Humedad. |
| actividad | Actividad física. |
| movilidad | Movilidad. |
| nutricion | Nutrición. |
| friccion | Fricción y deslizamiento. |
| total_riesgo_de_lpp_escala | Puntaje total de la escala de Braden. |

### 9.2. Identificación del servicio

Para los registros de autocontrol, el servicio se obtiene a partir del campo evaluador, debido a la lógica condicional del instrumento de REDCap.

| Evaluador | Servicio asignado |
|---|---|
| Autocontrol Cuidado Crítico | UCI |
| Autocontrol Hospitalización | Hospitalización |
| Autocontrol Salas de Cirugía | Salas de Cirugía |

Esta transformación evita descartar autocontroles cuyo campo de servicio asociado al control externo no se encuentra diligenciado.

## 10. Estructura del proyecto

### Directorio netlify/functions/

- **auth.mjs:** Gestión de autenticación y validación de códigos OTP.
- **dashboard.mjs:** Control de acceso y entrega de los recursos privados del aplicativo.
- **redcap.mjs:** Consulta, filtrado y transformación de registros de REDCap.
- **shared.mjs:** Funciones compartidas del backend.

### Directorio private/

- **index.html:** Estructura principal del dashboard.
- **styles.css:** Diseño visual y adaptación a diferentes tamaños de pantalla.
- **app.js:** Lógica de filtros, indicadores, gráficas, tablas y exportación.
- **etiquetas.js:** Diccionario de etiquetas utilizadas en el aplicativo.
- **datos.js:** Recurso de datos utilizado por el frontend, generado dinámicamente en el entorno desplegado.

### Directorio public/

- **login.html:** Interfaz de inicio de sesión.
- **login.css:** Estilos de autenticación.
- **login.js:** Lógica del formulario de acceso.
- **logout.js:** Gestión del cierre de sesión.
- **logo.png:** Identidad gráfica institucional.

### Archivos de configuración

- **netlify.toml:** Configuración del despliegue, funciones y redireccionamientos.
- **package.json:** Configuración del proyecto y dependencias.
- **.gitignore:** Exclusión de archivos sensibles y recursos locales.
- **README.md:** Documentación técnica y funcional.

## 11. Variables de entorno

Las credenciales deben configurarse mediante las variables de entorno de Netlify.

| Variable | Descripción |
|---|---|
| REDCAP_API_URL | Dirección de la API de REDCap. |
| REDCAP_API_TOKEN | Token de acceso al proyecto REDCap. |
| BREVO_API_KEY | Credencial para el envío de correos. |
| BREVO_SENDER_EMAIL | Correo electrónico remitente autorizado. |
| AUTHORIZED_EMAILS | Listado de correos autorizados para ingresar. |
| AUTH_SECRET | Secreto utilizado por el sistema de autenticación. |

Los valores reales de estas variables no deben almacenarse en el repositorio, incluirse en el código fuente ni publicarse en la documentación.

## 12. Seguridad y protección de la información

El aplicativo incorpora mecanismos orientados a restringir el acceso y proteger las credenciales utilizadas durante su funcionamiento.

Entre las medidas implementadas se encuentran:

- Autenticación mediante códigos OTP.
- Validación de correos electrónicos autorizados.
- Consulta de REDCap desde el backend.
- Gestión de credenciales mediante variables de entorno.
- Protección de los recursos privados del dashboard mediante validación de sesión.
- Cierre de sesión.
- Exclusión de archivos locales sensibles del repositorio.

### Consideraciones institucionales

- El acceso debe limitarse al personal autorizado.
- No se deben publicar bases de datos institucionales en repositorios de código.
- Los tokens y las credenciales deben mantenerse bajo custodia.
- La exportación de información debe realizarse conforme a las políticas institucionales.
- Se debe aplicar el principio de minimización de datos.
- El alojamiento y tratamiento de información institucional en servicios externos requieren las autorizaciones correspondientes.

La implementación de estos mecanismos no sustituye una evaluación institucional de seguridad, privacidad y protección de datos.

## 13. Exportación de información

El aplicativo permite exportar los registros seleccionados en formato CSV, compatible con herramientas de análisis como Microsoft Excel.

La exportación respeta los filtros activos del dashboard.

Esta funcionalidad facilita la elaboración de informes, la revisión de resultados y los procesos de seguimiento institucional, siempre que se cuente con la autorización correspondiente.

## 14. Instalación y despliegue

### Requisitos

- Node.js compatible con el entorno de Netlify.
- Git.
- Cuenta de Netlify.
- Acceso autorizado a la API de REDCap.
- Cuenta y credenciales de Brevo.

### Procedimiento general

1. Clonar el repositorio del proyecto.
2. Instalar las dependencias mediante npm install.
3. Configurar las variables de entorno.
4. Vincular el repositorio con Netlify.
5. Verificar la configuración del archivo netlify.toml.
6. Realizar el despliegue.
7. Comprobar el inicio de sesión.
8. Validar la conexión con REDCap.
9. Verificar los registros y resultados del dashboard.

## 15. Mantenimiento y diagnóstico

El aplicativo incorpora mensajes de diagnóstico que permiten identificar posibles inconvenientes durante la consulta y procesamiento de información.

Los principales controles corresponden a:

- Registros recibidos desde REDCap.
- Registros de autocontrol.
- Registros del personal del servicio.
- Registros de los servicios autorizados.
- Registros finales disponibles.
- Distribución de registros por servicio.

Los mensajes del backend pueden consultarse mediante los registros de ejecución de Netlify Functions.

Los mensajes del frontend pueden consultarse mediante la consola de herramientas de desarrollo del navegador.

No se deben incluir tokens, credenciales ni información identificable de pacientes en los mensajes de diagnóstico.

## 16. Limitaciones actuales

- La fórmula de adherencia se encuentra pendiente de validación institucional.
- Los resultados dependen de la calidad de los registros diligenciados en REDCap.
- El número de aplicaciones no equivale necesariamente al número de pacientes únicos.
- El cálculo de pacientes únicos requiere un identificador apropiado y autorizado.
- Los campos vacíos pueden corresponder a preguntas que no aplican.
- Los cambios en el diccionario de datos de REDCap pueden requerir ajustes en el backend.
- El funcionamiento depende de la disponibilidad de REDCap, Netlify y Brevo.

## 17. Mejoras futuras

- Validación institucional de la fórmula del indicador.
- Incorporación de metas oficiales de adherencia.
- Implementación de alertas ante resultados inferiores a las metas establecidas.
- Generación automatizada de informes periódicos.
- Comparación entre periodos de evaluación.
- Fortalecimiento de la gestión de usuarios y permisos.
- Incorporación de mecanismos de trazabilidad de accesos.
- Optimización del procesamiento de grandes volúmenes de información.
- Implementación de pruebas automatizadas.

## 18. Beneficios esperados

- Disminución del tiempo dedicado a la consolidación manual de información.
- Disponibilidad centralizada de resultados.
- Fortalecimiento del seguimiento a las prácticas asistenciales.
- Identificación oportuna de oportunidades de mejora.
- Apoyo a la toma de decisiones basada en datos.
- Mejor seguimiento de los procesos de prevención de lesiones por presión.

## 19. Uso institucional

El aplicativo está orientado al apoyo de los procesos de seguimiento, análisis y mejoramiento continuo relacionados con la Clínica de Heridas del Hospital Universitario Nacional de Colombia.

Los resultados presentados constituyen una herramienta de apoyo y no sustituyen la revisión profesional, la validación de los indicadores ni los procedimientos institucionales establecidos.

---

**Hospital Universitario Nacional de Colombia**

Clínica de Heridas | Proyecto PE 1167 | Indicador PE-ID-01

2026
