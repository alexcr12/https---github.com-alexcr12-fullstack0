// src/utils/logger.js

const STORAGE_KEY = 'powerfit_logs';

function guardarLog(tipo, mensaje) {
  const nuevoLog = {
    fecha: new Date().toLocaleString('es-PE'),
    tipo,
    mensaje,
  };

  const logsActuales = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  logsActuales.push(nuevoLog);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logsActuales));

  const estilos = {
    INFO: 'color: #3b82f6; font-weight: bold;',
    EXITO: 'color: #22c55e; font-weight: bold;',
    ERROR: 'color: #ef4444; font-weight: bold;',
    ALERTA: 'color: #eab308; font-weight: bold;',
  };
  console.log(`%c[${tipo}] ${nuevoLog.fecha} → ${mensaje}`, estilos[tipo]);
}

export const logInfo = (mensaje) => guardarLog('INFO', mensaje);
export const logExito = (mensaje) => guardarLog('EXITO', mensaje);
export const logError = (mensaje) => guardarLog('ERROR', mensaje);
export const logAlerta = (mensaje) => guardarLog('ALERTA', mensaje);

export function obtenerLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function limpiarLogs() {
  localStorage.removeItem(STORAGE_KEY);
}