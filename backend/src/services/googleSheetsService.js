// googleSheetsService.js - Versión tolerante a falta de googleapis

let google;
try {
  google = require('googleapis').google;
} catch (err) {
  console.error('googleapis no disponible en este entorno:', err.message);
}

const path = require('path');

// Si googleapis no está disponible (por ejemplo, en Railway si no se instaló)
// exportamos funciones dummy para que el servidor no se caiga al arrancar.
if (!google) {
  const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || 'NO_SPREADSHEET';

  module.exports = {
    async exportAutoevaluaciones() {
      throw new Error(
        `googleapis no está disponible en el servidor. Revisar instalación del paquete y entorno. SpreadsheetId=${SPREADSHEET_ID}`
      );
    },
    async exportHoras() {
      throw new Error(
        `googleapis no está disponible en el servidor. Revisar instalación del paquete y entorno. SpreadsheetId=${SPREADSHEET_ID}`
      );
    },
    async appendAutoevaluaciones() {
      throw new Error(
        `googleapis no está disponible en el servidor. Revisar instalación del paquete y entorno. SpreadsheetId=${SPREADSHEET_ID}`
      );
    }
  };

  return;
}

// ✅ Si llega aquí es porque googleapis sí se pudo cargar

// ✅ Verificar que GOOGLE_SHEETS_ID exista en Railway
const SPREADSHEET_ID = (() => {
  if (!process.env.GOOGLE_SHEETS_ID) {
    throw new Error(
      '❌ CRÍTICO: GOOGLE_SHEETS_ID no está definido en variables de entorno. Verifica Railway.'
    );
  }
  console.log(
    `📋 Usando GOOGLE_SHEETS_ID: ${process.env.GOOGLE_SHEETS_ID.substring(0, 20)}...`
  );
  return process.env.GOOGLE_SHEETS_ID;
})();

class GoogleSheetsService {
  constructor() {
    let authConfig;

    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      // PRODUCCIÓN: desde variable de entorno
      try {
        authConfig = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        this.auth = new google.auth.GoogleAuth({
          credentials: authConfig,
          scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
          ]
        });
        console.log('📌 Usando credenciales desde variable de entorno (PRODUCCIÓN)');
      } catch (error) {
        console.error('❌ Error al parsear GOOGLE_CREDENTIALS_JSON:', error.message);
        throw error;
      }
    } else {
      // DESARROLLO: desde archivo local
      const keyFile = path.resolve(__dirname, '../google-credentials.json');
      this.auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive'
        ]
      });
      console.log('📌 Usando credenciales desde archivo local (DESARROLLO)');
    }

    this.sheets = null;
  }

  async initialize() {
    try {
      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      console.log('✅ GoogleSheetsService inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar GoogleSheetsService:', error.message);
      throw error;
    }
  }

  async exportAutoevaluaciones(data) {
    try {
      console.log('📊 Iniciando exportación de autoevaluaciones...');
      console.log(`📈 Total de registros: ${data.length}`);

      if (!this.sheets) {
        await this.initialize();
      }

      const values = [
        [
          'Nombre Completo',
          'Área',
          'Pregunta',
          'Respuesta',
          'Fecha de Respuesta'
        ]
      ];

      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          values.push([
            `${item.nombre} ${item.apellido}` || '',
            item.areaid || '',
            item.pregunta || '',
            item.respuesta || '',
            item.fecha || ''
          ]);
        });
      }

      console.log(`📝 Preparadas ${values.length} filas (incluyendo encabezados)`);

      try {
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Hoja 1!A1:Z10000'
        });
        console.log('🗑️ Contenido anterior borrado');
      } catch (clearError) {
        console.warn('⚠️ No se pudo limpiar contenido anterior:', clearError.message);
      }

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Hoja 1!A1',
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      await this.formatearHoja();

      console.log('✅ Exportación de autoevaluaciones completada exitosamente');
      console.log(`📊 Filas actualizadas: ${response.data.updatedRows}`);

      return {
        success: true,
        updatedRows: response.data.updatedRows,
        updatedCells: response.data.updatedCells,
        spreadsheetId: SPREADSHEET_ID
      };
    } catch (error) {
      console.error('❌ Error en exportación:', error.message);
      throw new Error(
        `Error al exportar autoevaluaciones a Google Sheets: ${error.message}`
      );
    }
  }

  async exportHoras(data) {
    try {
      console.log('📊 Iniciando exportación de HORAS a Google Sheets...');
      console.log(`📈 Total de registros: ${data.length}`);

      if (!this.sheets) {
        await this.initialize();
      }

      const values = [
        [
          'Nombre Completo',
          'Fecha',
          'Hora de Entrada',
          'Hora de Salida',
          'Total de Horas'
        ]
      ];

      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          const horaEntrada = item.horaentrada ? item.horaentrada.substring(0, 5) : '--:--';
          const horaSalida = item.horasalida ? item.horasalida.substring(0, 5) : '--:--';
          const totalHoras = item.horatotal ? item.horatotal.substring(0, 8) : '--:--:--';

          values.push([
            `${item.nombre} ${item.apellido}` || '',
            item.fecha || '',
            horaEntrada,
            horaSalida,
            totalHoras
          ]);
        });
      }

      console.log(`📝 Preparadas ${values.length} filas (incluyendo encabezados)`);

      try {
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Hoja 1!A1:Z10000'
        });
        console.log('🗑️ Contenido anterior borrado');
      } catch (clearError) {
        console.warn('⚠️ No se pudo limpiar contenido anterior:', clearError.message);
      }

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Hoja 1!A1',
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      await this.formatearHoja();

      console.log('✅ Exportación de HORAS completada exitosamente');
      console.log(`📊 Filas actualizadas: ${response.data.updatedRows}`);

      return {
        success: true,
        updatedRows: response.data.updatedRows,
        updatedCells: response.data.updatedCells,
        spreadsheetId: SPREADSHEET_ID
      };
    } catch (error) {
      console.error('❌ Error en exportación de horas:', error.message);
      throw new Error(`Error al exportar horas a Google Sheets: ${error.message}`);
    }
  }

  async formatearHoja() {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 5
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.25,
                      green: 0.52,
                      blue: 0.95
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 1,
                        green: 1,
                        blue: 1
                      },
                      bold: true,
                      fontSize: 12
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE'
                  }
                },
                fields: 'userEnteredFormat'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 5
                }
              }
            }
          ]
        }
      });

      console.log('✨ Hoja formateada correctamente');
    } catch (formatError) {
      console.warn('⚠️ No se pudo formatear la hoja:', formatError.message);
    }
  }

  async appendAutoevaluaciones(data) {
    try {
      console.log('📊 Iniciando anexión de datos...');

      if (!this.sheets) {
        await this.initialize();
      }

      const values = [];

      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          values.push([
            `${item.nombre} ${item.apellido}` || '',
            item.areaid || '',
            item.pregunta || '',
            item.respuesta || '',
            item.fecha || ''
          ]);
        });
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Hoja 1!A1',
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      });

      console.log('✅ Datos anexados exitosamente');
      console.log(`📊 Filas anexadas: ${response.data.updates.updatedRows}`);

      return {
        success: true,
        updatedRows: response.data.updates.updatedRows,
        spreadsheetId: SPREADSHEET_ID
      };
    } catch (error) {
      console.error('❌ Error al anexar datos:', error.message);
      throw new Error(`Error al anexar datos: ${error.message}`);
    }
  }
}

module.exports = new GoogleSheetsService();
