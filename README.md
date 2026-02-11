# Escáner IG (sin login)

App web (Vite + React + TypeScript) para comparar **seguidos vs seguidores** usando la **exportación oficial** de Instagram (Data Download) en formato **JSON o HTML**.

- **Sin login**: no pide usuario/contraseña.
- **Sin scraping**: no usa APIs privadas ni hacks.
- **Privacidad**: se procesa localmente en tu navegador.
- **Resultado útil**: lista de “personas que sigues y NO te siguen”, con botón para abrir perfiles y opción de copiar la lista.

## Demo local (rápido)

```bash
npm install
npm run dev
```

Luego abre `http://localhost:5173/`.

## Cómo usar la app

1. Descarga tu información desde Instagram/Meta (ver sección siguiente).
2. Descomprime el ZIP.
3. En la app, sube:
   - **Seguidores**: `followers_1.json` o `followers_1.html` (y si hay `followers_2.*`, también).
   - **Seguidos**: `following.json` o `following.html`.
4. Mira el listado y abre perfiles para dejar de seguir manualmente (la app NO automatiza unfollow).

## Cómo descargar los archivos de Instagram (seguidores y seguidos)

Los nombres de menú cambian según versión/idioma, por eso dejo **3 caminos**:

### Opción A (app Instagram usando el buscador)
1. Instagram → tu perfil → menú ☰
2. Entra a **Configuración y actividad** (a veces “Configuración y privacidad”).
3. En el buscador escribe: `descargar` / `información` / `datos`.
4. Entra en **Descargar tu información** (o “Download your information”).
5. Selecciona la cuenta y elige **Seguidores y seguidos**.

### Opción B (Centro de cuentas / Accounts Center, si aparece)
1. Instagram → menú ☰ → **Configuración y actividad**
2. Entra a **Centro de cuentas** (Meta).
3. **Tu información y permisos** → **Descargar tu información**
4. Elige Instagram → **Seguidores y seguidos**

### Opción C (portal web oficial)
1. Abre el Centro de cuentas en el navegador: `https://accountscenter.meta.com/`
2. **Tu información y permisos** → **Descargar tu información**
3. Selecciona Instagram → **Seguidores y seguidos**

### Al descargar el ZIP
Dentro del zip, busca archivos típicos (pueden ser **.json** o **.html**):
- `followers_1.json` o `followers_1.html` (a veces `followers_2.*`, `followers_3.*`, etc.)
- `following.json` o `following.html`

Ruta típica (puede variar): `connections/followers_and_following/`

> Nota (Windows): a veces el explorador muestra “Tipo: Chrome HTML Document” aunque el archivo sea `.json`. Revisa la extensión real.

## Páginas legales (confianza)

- **Política de Privacidad**: `/#/privacy`
- **Términos y Condiciones**: `/#/terms`

## Build

```bash
npm run build
```

## Creador / redes

- Web / Portafolio: `https://ciscodedev.netlify.app/`
- GitHub: `https://github.com/Cristiancano1236`
- Instagram: `https://www.instagram.com/cristiancano1236/`
- YouTube: `https://www.youtube.com/@Ciscodedev`
- Donaciones (PayPal): `https://www.paypal.com/donate/?hosted_button_id=8HMKJZY4E29RY`
