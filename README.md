# 🌍 MundoBanderas - Enciclopedia Vexilológica & Suite Editorial Amazon KDP

> **Plataforma web profesional, interactiva y lista para producción** para la exploración, catalogación vexilológica, diseño y publicación editorial de banderas del mundo y fichas geográficas en alta definición y vectores nativos SVG/PDF.

---

## ✨ Características Principales

### 1. 🌐 Base de Datos Exhaustiva (249 Países y Territorios)
- Datos 100% verificados conforme al estándar internacional **ISO 3166-1** (Alpha-2 y Alpha-3).
- Capitales oficiales, idiomas nacionales, monedas vigentes (con códigos ISO 4217), gentilicios, poblaciones, superficies territoriales y husos horarios.
- Descripción vexilológica y heráldica detallada del significado de cada bandera, franjas, escudos, proporciones históricas y fechas de adopción.
- Datos de subdivisiones políticas (departamentos, provincias, estados, regiones) con mapas georreferenciados.

### 2. 📚 Motor Editorial Amazon KDP (Generador de Libros de 265 Páginas)
- **1-Clic Full Book Builder**: Genera en segundos un manuscrito completo listo para imprenta bajo demanda en Amazon Kindle Direct Publishing (KDP).
- **Formatos soportados**:
  - Estándar 8.5" x 11" (Letter) con y sin sangría (bleed).
  - Trazado vectorial nativo con `svg2pdf.js` y `jsPDF` (resolución infinita sin artefactos ni pixelado).
  - Portada y contraportada con cálculo automático de grosor de lomo (*spine calculation*) según cantidad de páginas y gramaje de papel.
  - Índice clasificado por continentes, fichas por país y apéndices estadísticos mundiales.

### 3. 🎨 Vectorial Puro (SVG & PDF)
- Banderas en SVG puro descargables individualmente o por paquetes comprimidos.
- Fichas técnicas en PDF vectorial con banderas trazadas nativamente, mapas de límites políticos y tablas de información.
- Diseñador y Taller de Banderas (*Flag Studio*): Permite crear y exportar banderas personalizadas con capas, símbolos y paletas normalizadas.

### 4. 🧭 Herramientas Interactivas
- **Comparador Vexilológico**: Análisis comparativo de dos países (similitudes cromáticas, ratios de aspecto, historia compartida).
- **Quiz de Banderas & Capitales**: Modos de juego educativo con sistema de puntuación y rachas.
- **Globo Terráqueo 3D**: Integración tridimensional con Three.js para exploración geoespacial.
- **Vista Satelital & Cartografía**: Mapas vectoriales e interactivos con Leaflet y D3 Geo.

### 5. 💎 Modelo de Negocio SaaS Integrado
- Sistema de membresías Freemium / Pro (Planes Mensual, Anual y Vitalicio).
- Control de acceso a descargas ilimitadas de PDFs vectoriales y compilación para Amazon KDP.
- Fácil integración con pasarelas de pago como Stripe, Lemon Squeezy o PayPal.

---

## 🛠️ Pila Tecnológica (Tech Stack)

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Estilos** | Tailwind CSS v4 |
| **Generación PDF** | jsPDF, svg2pdf.js, html2canvas |
| **Visualización Geográfica** | Three.js, Leaflet, D3 Geo, TopoJSON |
| **Iconografía & Animación** | Lucide React, Motion |
| **Empaquetado y Compresión** | JSZip |

---

## 🚀 Instalación y Puesta en Marcha

### Requisitos previos
- Node.js versión 18.0.0 o superior
- Gestor de paquetes npm, pnpm o yarn

### Pasos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en `http://localhost:3000`.

3. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos optimizados y estáticos se generarán en la carpeta `dist/`.

4. **Previsualizar la compilación de producción:**
   ```bash
   npm run preview
   ```

---

## 📁 Estructura del Proyecto

```text
├── public/                 # Archivos estáticos y paquete de código fuente
├── src/
│   ├── components/         # Componentes modulares de React
│   │   ├── AmazonKdpPublishModal.tsx   # Modal del motor editorial KDP
│   │   ├── CountryDetailsModal.tsx     # Ficha detallada del país
│   │   ├── CountryPdfModal.tsx         # Previsualizador y exportador PDF
│   │   ├── FlagComparator.tsx          # Comparador vexilológico
│   │   ├── FlagCreator.tsx             # Creador de banderas
│   │   ├── FlagQuiz.tsx                # Juego de trivia y preguntas
│   │   ├── FlagsGallery.tsx            # Galería y buscador de banderas
│   │   ├── GlobeQuiz.tsx               # Trivia con globo 3D
│   │   ├── Map3DRealtime.tsx           # Renderizado 3D con Three.js
│   │   ├── SubscriptionModal.tsx       # Pasarela de planes Pro / SaaS
│   │   └── VexillologyGuide.tsx        # Guía técnica de vexilología
│   ├── data/               # Base de datos fáctica de los 249 países
│   │   ├── countries.ts    # Índice maestro y unificación
│   │   ├── america.ts      # Países de América
│   │   ├── europe.ts       # Países de Europa
│   │   ├── asia.ts         # Países de Asia
│   │   ├── africa.ts       # Países de África
│   │   ├── oceania.ts      # Países de Oceanía
│   │   └── politicalDivisions.ts # Subdivisiones administrativas
│   ├── services/           # Lógica de negocio y generación de documentos
│   │   ├── kdpPdfGeneratorService.ts   # Motor vectorial de libros PDF para KDP
│   │   ├── pdfExportService.ts         # Exportador de fichas individuales
│   │   ├── countryService.ts           # Consultas y filtros de países
│   │   └── subscriptionService.ts      # Gestión de estados de suscripción
│   ├── types.ts            # Definiciones de tipos e interfaces TypeScript
│   ├── App.tsx             # Componente raíz y navegación principal
│   └── main.tsx            # Punto de entrada de la aplicación
├── package.json            # Dependencias y scripts de ejecución
├── tsconfig.json           # Configuración del compilador TypeScript
├── vite.config.ts          # Configuración de Vite
└── README.md               # Este archivo de documentación
```

---

## 🌐 Despliegue en Producción (1-Clic)

La aplicación es una SPA (Single Page Application) estática y ultrarrápida. Puede desplegarse sin costo o a bajo costo en:

- **Vercel**: Conectar el repositorio de GitHub y seleccionar Framework "Vite".
- **Netlify**: Arrastrar la carpeta `dist/` o enlazar Git con comando `npm run build` y directorio `dist`.
- **Cloudflare Pages**: Rendimiento global instantáneo y coste $0 en capa gratuita.
- **Render / AWS S3 + CloudFront / GitHub Pages**: Compatible al 100%.

---

## 📄 Licencia

Este paquete incluye derechos de uso, modificación, despliegue y comercialización conforme a los términos del acuerdo de cesión de software adjunto en `LICENCIA_COMERCIAL_TRANSFERENCIA.md`.
