# Guía de despliegue en un VPS Ubuntu

Objetivo: que al entrar en `https://ejemploweb.com` se vea el proyecto funcionando, con HTTPS, y que se arranque solo si el VPS se reinicia o el proceso se cae.

> Sustituye `ejemploweb.com` por tu dominio real y `IP_DEL_VPS` por la IP pública que te dé tu proveedor, en todos los comandos.

## Qué vamos a montar y por qué

```
Internet ──► Caddy (80/443, HTTPS automático) ──► Node/Express (127.0.0.1:3001)
                                                   ├─ API  /api/*
                                                   ├─ Front compilado (client/dist)
                                                   └─ PostgreSQL (127.0.0.1:5432)
```

- **Node instalado directamente en el VPS**, sin Docker. Para un proyecto de un solo servicio es lo más ligero y lo más fácil de depurar.
- **systemd** mantiene el proceso vivo: lo arranca al encender el servidor y lo relanza si se cae (`Restart=always`).
- **Caddy** hace de puerta de entrada: obtiene y renueva solo el certificado HTTPS (Let's Encrypt) y reenvía el tráfico a Node.
- **Ubuntu 24.04 LTS** es la versión recomendada para el VPS. Con 1 GB de RAM es suficiente.

## Orden recomendado

1. Apuntar el dominio al VPS (paso 1). Hazlo el primero porque la propagación puede tardar de minutos a unas horas, y mientras tanto sigues con el resto.
2. Preparar el servidor (pasos 2 a 4).
3. Subir el código y arrancarlo (pasos 5 a 8), y crear la base de datos (paso 9).
4. Poner Caddy delante (paso 10).
5. Probar que sobrevive a reinicios y caídas (paso 12).

---

## 1. Conectar el dominio con el VPS

**No hace falta ningún traspaso del dominio.** El dominio puede seguir registrado donde está; solo hay que decirle, mediante registros DNS, a qué IP debe apuntar.

1. Anota la **IP pública** del VPS (en el panel de tu proveedor).
2. Entra en el panel DNS de donde compraste el dominio (el registrador) y crea estos registros:

| Tipo | Nombre / Host    | Valor        | TTL               |
| ---- | ---------------- | ------------ | ----------------- |
| `A`  | `@` (el dominio) | `IP_DEL_VPS` | 300 (o el mínimo) |
| `A`  | `www`            | `IP_DEL_VPS` | 300 (o el mínimo) |

3. Si ya había registros `A` o `AAAA` antiguos para `@` o `www` (por ejemplo, una página de «dominio aparcado»), **elimínalos o edítalos**. Si dejas un `AAAA` (IPv6) que apunta a otro sitio, Caddy no podrá obtener el certificado.
4. Si tu registrador ofrece «redirección» o «parking» del dominio, desactívalo.

Comprueba la propagación desde tu ordenador (puede tardar un rato):

```bash
dig +short ejemploweb.com
dig +short www.ejemploweb.com
```

Ambos deben devolver `IP_DEL_VPS`. Sin `dig`, usa https://dnschecker.org.

> Alternativa: si prefieres gestionar el DNS en el panel de tu proveedor del VPS, cambia los _nameservers_ del dominio en el registrador a los del proveedor y crea ahí los mismos registros. Funciona igual, pero es un paso más y no aporta nada para este caso.

---

## 2. Primer acceso y usuario no-root

Conéctate por SSH con los datos que te dio el proveedor:

```bash
ssh root@IP_DEL_VPS
```

Actualiza el sistema y crea un usuario normal para ejecutar la aplicación (llamado `deploy` en esta guía):

```bash
apt update && apt upgrade -y
adduser deploy                 # te pedirá una contraseña
usermod -aG sudo deploy
```

Copia tu clave SSH al nuevo usuario. **Desde tu ordenador**:

```bash
ssh-copy-id deploy@IP_DEL_VPS
```

Comprueba que entras con `ssh deploy@IP_DEL_VPS`. A partir de aquí trabaja con ese usuario y usa `sudo` cuando haga falta.

### Endurecer el acceso SSH (recomendado)

Una vez que compruebes que entras con tu clave, desactiva el login de root y por contraseña:

```bash
sudo nano /etc/ssh/sshd_config.d/99-hardening.conf
```

```
PermitRootLogin no
PasswordAuthentication no
```

```bash
sudo systemctl restart ssh
```

> No cierres la sesión actual hasta haber abierto otra en una terminal nueva y confirmado que sigue funcionando.

---

## 3. Firewall y actualizaciones automáticas

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Solo quedan abiertos SSH, HTTP y HTTPS. El puerto 3001 de Node **no** se abre: solo es accesible desde Caddy dentro del mismo servidor.

Parches de seguridad automáticos:

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades   # responde "Yes"
```

---

## 4. Instalar Node 26, pnpm y git

```bash
sudo apt install -y curl git ca-certificates gnupg

# Node 26 desde NodeSource
curl -fsSL https://deb.nodesource.com/setup_26.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm (Node 25+ ya no incluye Corepack, así que se instala con npm)
sudo npm install -g pnpm@10

node -v    # debe mostrar v26.x
pnpm -v    # debe mostrar 10.x
```

Node queda en `/usr/bin/node`, una ruta fija que el servicio de systemd usará más adelante.

---

## 5. Subir el código al VPS

El proyecto todavía no es un repositorio git. Lo más cómodo es subirlo a un repositorio **privado** de GitHub (o GitLab) y clonarlo en el VPS; así las actualizaciones futuras son un `git pull`.

### 5.1. En tu ordenador (una sola vez)

```bash
cd /Users/mfernandezd/Documents/www/personal/dym
git init
git add .
git status        # revisa que no se cuelen node_modules, dist ni .env
git commit -m "Proyecto inicial"
```

Crea un repositorio privado vacío en GitHub y súbelo:

```bash
git remote add origin git@github.com:TU_USUARIO/dym.git
git branch -M main
git push -u origin main
```

> Antes de hacer el commit, asegúrate de que el logo (`client/public/assets/DyMLogo_Vector/DyMLogo_MicLeft.svg`) está en su sitio, porque se incluye en el build.

### 5.2. En el VPS: dar acceso de lectura al repositorio

Genera una clave solo para este servidor:

```bash
ssh-keygen -t ed25519 -C "vps-dym" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Copia la clave pública que imprime y añádela en GitHub: repositorio → **Settings → Deploy keys → Add deploy key** (sin permiso de escritura).

Clona el proyecto:

```bash
cd ~
git clone git@github.com:TU_USUARIO/dym.git
cd dym
```

> Alternativa sin git: desde tu ordenador, `rsync -av --exclude node_modules --exclude dist --exclude .git ./ deploy@IP_DEL_VPS:~/dym/`. Funciona, pero tendrás que repetirlo a mano en cada actualización.

---

## 6. Instalar dependencias y compilar

```bash
cd ~/dym
pnpm install --frozen-lockfile
pnpm build
```

Esto genera `client/dist` (el front) y `server/dist` (el servidor compilado).

> Si el VPS tiene poca RAM (512 MB) y el build se queda sin memoria, crea un swap de 1 GB:
> `sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

Prueba rápida a mano (cancela con `Ctrl+C` cuando veas que funciona):

```bash
NODE_ENV=production PORT=3001 node server/dist/index.js
```

En otra terminal del VPS: `curl -s localhost:3001/api/hello` debe devolver el JSON con el mensaje.

---

## 7. Servicio systemd (arranque automático y reinicio ante fallos)

Crea el fichero del servicio:

```bash
sudo nano /etc/systemd/system/dym.service
```

```ini
[Unit]
Description=DYM (Node + Express)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/dym
Environment=NODE_ENV=production
Environment=PORT=3001
# Variables secretas (DATABASE_URL...). El "-" evita error si el fichero aún no existe (se crea en el paso 9)
EnvironmentFile=-/etc/dym.env
ExecStart=/usr/bin/node server/dist/index.js

# Si el proceso se cae o termina por cualquier motivo, se relanza a los 3 s
Restart=always
RestartSec=3

# Endurecimiento básico
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Actívalo y arráncalo:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now dym
sudo systemctl status dym        # debe poner "active (running)"
```

- `enable` hace que arranque con el sistema.
- `Restart=always` lo relanza si falla.

Ver los logs en directo: `journalctl -u dym -f`

---

## 8. Permitir reiniciar el servicio sin contraseña (para las actualizaciones)

Para que el script de actualización pueda reiniciar el servicio sin pedir la contraseña de `sudo`:

```bash
sudo visudo -f /etc/sudoers.d/deploy
```

```
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart dym
```

---

## 9. Base de datos PostgreSQL

El proyecto todavía no usa base de datos, pero así queda lista. PostgreSQL se instala en el mismo VPS y **solo acepta conexiones locales**: no se expone a internet.

### 9.1. Instalar

```bash
sudo apt install -y postgresql
sudo systemctl is-enabled postgresql    # debe decir "enabled" (arranca con el sistema)
sudo systemctl status postgresql
psql --version                          # Ubuntu 24.04 trae la 16
```

Comprueba que solo escucha en local y **no abras el puerto 5432 en el firewall**:

```bash
sudo ss -tlnp | grep 5432               # debe mostrar 127.0.0.1:5432
```

### 9.2. Crear usuario y base de datos

Genera una contraseña aleatoria (solo caracteres hexadecimales, para que no dé problemas dentro de una URL) y guárdala en tu gestor de contraseñas:

```bash
openssl rand -hex 24
```

Entra en la consola de Postgres y crea el usuario y la base de datos, sustituyendo `LA_CONTRASEÑA` por la generada:

```bash
sudo -u postgres psql
```

```sql
CREATE ROLE dym_app WITH LOGIN PASSWORD 'LA_CONTRASEÑA';
CREATE DATABASE dym OWNER dym_app;
\q
```

Comprueba que se puede conectar con ese usuario:

```bash
psql "postgresql://dym_app:LA_CONTRASEÑA@localhost:5432/dym" -c '\conninfo'
```

### 9.3. Pasarle la conexión a la aplicación

La cadena de conexión es un secreto: va en un fichero fuera del repositorio, legible solo por el usuario que ejecuta la app.

```bash
sudo nano /etc/dym.env
```

```
DATABASE_URL=postgresql://dym_app:LA_CONTRASEÑA@localhost:5432/dym
```

```bash
sudo chown root:deploy /etc/dym.env
sudo chmod 640 /etc/dym.env
sudo systemctl restart dym
```

El servicio del paso 7 ya carga ese fichero (`EnvironmentFile`), así que la app recibe `process.env.DATABASE_URL`. Además, `After=postgresql.service` hace que al arrancar el VPS primero suba la base de datos y después la app.

### 9.4. Crear las tablas y los datos (migraciones)

El esquema y los datos iniciales se crean con migraciones (carpeta `server/migrations/`). El driver `pg` y `server/src/db.ts` ya vienen en el proyecto. Con el código ya clonado y compilado (paso 6) y la `DATABASE_URL` configurada (paso 9.3), aplica las migraciones cargando las variables del fichero:

```bash
cd ~/dym
set -a; source /etc/dym.env; set +a
pnpm migrate
```

Si no hay migraciones todavía, dirá `No migrations to run!`. En cada actualización se ejecutan solas desde `deploy.sh` (paso 13).

Para trabajar en tu ordenador necesitas tu propio Postgres local con una base de datos de desarrollo (por ejemplo con `brew install postgresql@16`, o con Docker: `docker run -d --name dym-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=dym -p 5432:5432 postgres:16`). No uses la base de datos del VPS desde tu ordenador.

### 9.5. Copias de seguridad diarias

Un VPS puede perderse o corromperse; sin copias, perderías los datos. Crea una copia diaria comprimida y conserva las de los últimos 14 días:

```bash
sudo mkdir -p /var/backups/dym
sudo chown postgres:postgres /var/backups/dym
sudo nano /etc/cron.d/dym-backup
```

```
0 3 * * * postgres pg_dump dym | gzip > /var/backups/dym/dym-$(date +\%F).sql.gz && find /var/backups/dym -name 'dym-*.sql.gz' -mtime +14 -delete
```

Prueba que funciona sin esperar a las 3:00:

```bash
sudo -u postgres bash -c 'pg_dump dym | gzip > /var/backups/dym/prueba.sql.gz' && ls -lh /var/backups/dym
```

Para restaurar una copia en una base de datos vacía:

```bash
gunzip -c /var/backups/dym/dym-AAAA-MM-DD.sql.gz | sudo -u postgres psql dym
```

> Las copias están en el mismo disco que la base de datos. Cópialas de vez en cuando fuera del VPS (a tu ordenador con `scp`/`rsync`, o a un almacenamiento externo), o activa los snapshots/backups de tu proveedor.

---

## 10. Caddy: dominio, HTTPS y proxy

Instala Caddy desde su repositorio oficial:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Configura el sitio:

```bash
sudo nano /etc/caddy/Caddyfile
```

Sustituye todo el contenido por:

```
ejemploweb.com {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3001
}

www.ejemploweb.com {
	redir https://ejemploweb.com{uri} permanent
}
```

Valida y aplica:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

En el primer arranque, Caddy pide solo el certificado a Let's Encrypt. Esto **solo funciona si el DNS del paso 1 ya apunta al VPS** y los puertos 80 y 443 están abiertos. Si falla, mira `journalctl -u caddy -n 50`.

Caddy también se arranca solo con el sistema y se relanza si falla.

---

## 11. Probar

Abre `https://ejemploweb.com`: debe verse la home con el candado de HTTPS. Comprueba además:

- `https://www.ejemploweb.com` redirige a `https://ejemploweb.com`.
- `http://ejemploweb.com` redirige a HTTPS.
- Una ruta inventada (`https://ejemploweb.com/loquesea`) te lleva a la home.
- `https://ejemploweb.com/api/hello` devuelve el JSON.

---

## 12. Comprobar que sobrevive a caídas y reinicios

**Caída del proceso:**

```bash
sudo systemctl status dym | grep "Main PID"
sudo kill -9 <ese PID>
sleep 5
sudo systemctl status dym        # vuelve a estar active (running) con otro PID
```

**Reinicio del servidor:**

```bash
sudo reboot
```

Espera un minuto, vuelve a entrar y comprueba `https://ejemploweb.com`. Debe funcionar sin que toques nada. Comprueba también que la base de datos ha vuelto sola: `sudo systemctl status postgresql`.

---

## 13. Actualizar la web en el futuro

Crea este script en el VPS:

```bash
nano ~/dym/deploy.sh
chmod +x ~/dym/deploy.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /home/deploy/dym

git pull --ff-only
pnpm install --frozen-lockfile
pnpm build

# Aplicar migraciones pendientes (carga DATABASE_URL de /etc/dym.env)
set -a; source /etc/dym.env; set +a
pnpm migrate

sudo systemctl restart dym

echo "Desplegado."
```

Flujo de trabajo: haces `git push` desde tu ordenador, entras al VPS y ejecutas:

```bash
~/dym/deploy.sh
```

> Durante el reinicio (1-2 segundos) la web no responde. Para un proyecto de este tamaño es aceptable.

---

## Comandos útiles

| Qué                            | Comando                            |
| ------------------------------ | ---------------------------------- |
| Estado de la app               | `sudo systemctl status dym`        |
| Logs de la app en directo      | `journalctl -u dym -f`             |
| Reiniciar la app               | `sudo systemctl restart dym`       |
| Entrar en la base de datos     | `sudo -u postgres psql dym`        |
| Estado de PostgreSQL           | `sudo systemctl status postgresql` |
| Logs de Caddy                  | `journalctl -u caddy -n 50`        |
| Recargar config de Caddy       | `sudo systemctl reload caddy`      |
| Ver qué escucha en cada puerto | `sudo ss -tlnp`                    |

## Problemas frecuentes

- **Caddy no consigue el certificado:** el DNS aún no apunta al VPS (`dig +short ejemploweb.com`), hay un registro `AAAA` antiguo, o los puertos 80/443 están cerrados (`sudo ufw status`).
- **502 Bad Gateway:** Node no está escuchando. Mira `sudo systemctl status dym` y `journalctl -u dym -n 50`.
- **El servicio no arranca (`status=203/EXEC`):** la ruta de `ExecStart` no es correcta (`which node`) o falta compilar (`pnpm build`).
- **La home carga pero sin logo:** falta `DyMLogo_MicLeft.svg` en `client/public/assets/DyMLogo_Vector/` antes del build.
- **`pnpm: command not found` en el script:** `pnpm` se instaló con `sudo npm install -g`; comprueba `which pnpm`.
