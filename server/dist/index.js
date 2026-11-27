import 'dotenv/config'; // carga server/.env en desarrollo (en producción vienen del entorno)
import { app } from './app.js';
import { AppDataSource } from './data-source.js';
const PORT = process.env.PORT || 3001;
await AppDataSource.initialize();
console.log('Conectado a la base de datos');
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
