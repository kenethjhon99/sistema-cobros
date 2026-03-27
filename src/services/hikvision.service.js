const axios = require("axios");
const pool = require("../db");
const { marcarAsistencia } = require("./asistencia.service");
const {
  ensurePersonaForStudent,
  findStudentPersonaByEmployeeNo,
} = require("./personas.service");

const HIKVISION_IP = process.env.HIKVISION_IP;
const USER = process.env.HIKVISION_USER;
const PASSWORD = process.env.HIKVISION_PASSWORD;

function isHikvisionConfigured() {
  return Boolean(HIKVISION_IP && USER && PASSWORD);
}

function getHikvisionRequestConfig(contentType = "application/json") {
  return {
    auth: {
      username: USER,
      password: PASSWORD,
    },
    headers: {
      "Content-Type": contentType,
    },
    timeout: 15000,
  };
}

function getNombreCompletoEstudiante(estudiante) {
  return [
    estudiante.primer_nombre,
    estudiante.segundo_nombre,
    estudiante.primer_apellido,
    estudiante.segundo_apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getEmployeeNo(estudiante) {
  return String(estudiante.carne || estudiante.id);
}

function buildUserInfoPayload(estudiante) {
  const now = new Date().toISOString().slice(0, 19);

  return {
    UserInfo: {
      employeeNo: getEmployeeNo(estudiante),
      name: getNombreCompletoEstudiante(estudiante).slice(0, 31),
      userType: "normal",
      closeDelayEnabled: false,
      Valid: {
        enable: true,
        beginTime: now,
        endTime: "2037-12-31T23:59:59",
      },
    },
  };
}

function getAxiosErrorMessage(error) {
  if (error.response?.data) {
    if (typeof error.response.data === "string") {
      return error.response.data;
    }

    return JSON.stringify(error.response.data);
  }

  return error.message || "Error desconocido";
}

function getNestedEvent(payload) {
  return (
    payload?.AcsEvent ||
    payload?.AccessControllerEvent ||
    payload?.EventNotificationAlert?.AccessControllerEvent ||
    payload?.event ||
    payload
  );
}

function extractEmployeeNo(payload) {
  const event = getNestedEvent(payload);

  return String(
    event?.employeeNoString ||
      event?.employeeNo ||
      event?.employeeNostring ||
      event?.UserInfo?.employeeNo ||
      ""
  ).trim();
}

function extractDeviceId(payload) {
  const event = getNestedEvent(payload);

  return (
    event?.serialNo ||
    event?.deviceID ||
    event?.deviceId ||
    event?.devIndex ||
    null
  );
}

function extractEventTime(payload) {
  const event = getNestedEvent(payload);
  const raw = event?.dateTime || event?.eventTime || event?.time;
  return raw ? new Date(raw) : new Date();
}

function inferAttendanceTypeFromPayload(payload) {
  const event = getNestedEvent(payload);
  const rawText = [
    event?.attendanceStatus,
    event?.eventName,
    event?.eventDescription,
    event?.eventType,
    event?.major,
    event?.minor,
    event?.currentVerifyMode,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (
    rawText.includes("SALIDA") ||
    rawText.includes("EXIT") ||
    rawText.includes("OUT")
  ) {
    return "SALIDA";
  }

  if (
    rawText.includes("ENTRADA") ||
    rawText.includes("ENTRY") ||
    rawText.includes("IN")
  ) {
    return "ENTRADA";
  }

  return null;
}

async function inferNextAttendanceType(personaId, fecha) {
  const [rows] = await pool.query(
    `SELECT tipo
     FROM asistencia
     WHERE persona_id = ? AND fecha = ?
     ORDER BY id ASC`,
    [personaId, fecha]
  );

  const tipos = rows.map((row) => row.tipo);
  if (!tipos.includes("ENTRADA")) {
    return "ENTRADA";
  }
  if (!tipos.includes("SALIDA")) {
    return "SALIDA";
  }

  return null;
}

async function registrarUsuarioHikvision(estudiante) {
  if (!isHikvisionConfigured()) {
    return {
      ok: false,
      skipped: true,
      employeeNo: getEmployeeNo(estudiante),
      message: "Hikvision no esta configurado en variables de entorno",
    };
  }

  const payload = buildUserInfoPayload(estudiante);
  const employeeNo = payload.UserInfo.employeeNo;

  try {
    const response = await axios.post(
      `http://${HIKVISION_IP}/ISAPI/AccessControl/UserInfo/Record?format=json`,
      payload,
      getHikvisionRequestConfig()
    );

    return {
      ok: true,
      employeeNo,
      message: "Alumno sincronizado con Hikvision. Ya puedes registrar la huella en el equipo.",
      deviceResponse: response.data,
    };
  } catch (createError) {
    try {
      const response = await axios.put(
        `http://${HIKVISION_IP}/ISAPI/AccessControl/UserInfo/SetUp?format=json`,
        payload,
        getHikvisionRequestConfig()
      );

      return {
        ok: true,
        employeeNo,
        message: "Alumno actualizado en Hikvision. Ya puedes registrar la huella en el equipo.",
        deviceResponse: response.data,
      };
    } catch (updateError) {
      return {
        ok: false,
        skipped: false,
        employeeNo,
        message: `No se pudo sincronizar con Hikvision: ${getAxiosErrorMessage(updateError)}`,
        error: getAxiosErrorMessage(updateError),
        createError: getAxiosErrorMessage(createError),
      };
    }
  }
}

async function procesarEvento(payload) {
  const event = getNestedEvent(payload);
  const employeeNo = extractEmployeeNo(payload);
  const eventDate = extractEventTime(payload);
  const fecha = eventDate.toISOString().slice(0, 10);
  const hora = eventDate.toTimeString().slice(0, 8);
  const dispositivoId = extractDeviceId(payload);

  if (!employeeNo) {
    throw new Error("El evento de Hikvision no trae employeeNo");
  }

  const vinculo = await findStudentPersonaByEmployeeNo(employeeNo);
  if (!vinculo) {
    throw new Error(`No existe un estudiante vinculado al employeeNo ${employeeNo}`);
  }

  const persona =
    vinculo.persona_id
      ? vinculo
      : await ensurePersonaForStudent({
          estudianteId: vinculo.estudiante_id,
          institucionId: vinculo.institucion_id,
          creadoPor: "hikvision",
          carne: vinculo.carne,
        });

  let tipo = inferAttendanceTypeFromPayload(payload);
  if (!tipo) {
    tipo = await inferNextAttendanceType(persona.persona_id || persona.id, fecha);
  }

  if (!tipo) {
    return {
      ok: false,
      skipped: true,
      employeeNo,
      message: "El alumno ya tiene entrada y salida registradas hoy",
    };
  }

  const asistencia = await marcarAsistencia({
    personaId: persona.persona_id || persona.id,
    tipo,
    fecha,
    hora,
    dispositivoId,
  });

  await pool.query(
    "INSERT INTO eventos_lector (persona_id, fecha_hora, tipo_evento) VALUES (?, ?, ?)",
    [persona.persona_id || persona.id, eventDate.toISOString().slice(0, 19).replace("T", " "), event?.eventType || tipo]
  );

  return {
    ok: true,
    skipped: false,
    employeeNo,
    tipo,
    asistenciaId: asistencia.asistenciaId,
    personaId: persona.persona_id || persona.id,
    message: `Asistencia ${tipo} registrada correctamente desde Hikvision`,
  };
}

async function obtenerEvento() {
  if (!isHikvisionConfigured()) {
    throw new Error("Hikvision no esta configurado en variables de entorno");
  }

  const xml = `
    <AcsEventCond version="2.0" xmlns="http://www.hikvision.com/ver10/XMLSchema">
      <searchID>1</searchID>
      <searchResultPosition>0</searchResultPosition>
      <maxResults>20</maxResults>
    </AcsEventCond>`;

  const res = await axios.post(
    `http://${HIKVISION_IP}/ISAPI/AccessControl/AcsEvent`,
    xml,
    getHikvisionRequestConfig("application/xml")
  );

  return res.data;
}

module.exports = {
  obtenerEvento,
  procesarEvento,
  registrarUsuarioHikvision,
  isHikvisionConfigured,
};
