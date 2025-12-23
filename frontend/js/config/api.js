// Configuración de API Base URL
// Apunta al backend en Railway en lugar de Render
const API_BASE_URL = 'https://checklist-production-a2fe.up.railway.app';

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_BASE_URL };
}
