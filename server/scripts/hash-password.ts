// Uso: pnpm --filter server hash-password "mi contraseña"  → pega el resultado en ADMIN_PASSWORD_HASH
import { AuthService } from '../src/services/auth.service.js';

const password = process.argv[2];
if (!password) {
  console.error('Uso: pnpm --filter server hash-password "<contraseña>"');
  process.exit(1);
}
console.log(AuthService.hashPassword(password));
