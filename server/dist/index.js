import 'dotenv/config'; // carga server/.env en desarrollo (en producción vienen del entorno)
import { app } from './app.js';
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
