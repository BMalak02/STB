import { Platform } from 'react-native';

// 🔧 CONFIGURATION: Mets à jour NGROK_URL à chaque redémarrage du tunnel backend
const NGROK_URL = 'https://elk-freckled-balancing.ngrok-free.dev'; // ← Tunnel ngrok actif

// IP locale du PC sur le réseau Wi-Fi (alternative si même réseau)
const LOCAL_IP = '192.168.0.185';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5001/api';
  }
  // Utilise ngrok si configuré, sinon IP locale
  if (NGROK_URL && !NGROK_URL.includes('YOUR-NGROK-URL')) {
    return `${NGROK_URL}/api`;
  }
  return `http://${LOCAL_IP}:5001/api`;
};

export const ENV = {
  API_URL: getApiUrl(),
  TIMEOUT: 30000, // Augmenté pour OCR qui peut prendre du temps
};
