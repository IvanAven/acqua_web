# ACQUA - Sistema de Gestión de Pedidos de Agua Purificada

![ACQUA](https://img.shields.io/badge/ACQUA-Water%20Delivery-0EA5E9)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)

Sistema completo de gestión de pedidos de agua purificada con panel administrativo, sistema de cupones y descuentos para clientes frecuentes.

## 🚀 Características

### Para Clientes
- ✅ Registro e inicio de sesión con JWT
- ✅ Crear pedidos de garrafones con fecha y hora de entrega
- ✅ Ver historial completo de pedidos
- ✅ Sistema de cupones de descuento
- ✅ Cupones automáticos cada 5 pedidos entregados (20% OFF)
- ✅ Dashboard con estadísticas personales

### Para Administradores
- ✅ Panel completo de administración
- ✅ Gestión de pedidos (cambiar estados: pendiente, en camino, entregado, cancelado)
- ✅ Gestión de clientes
- ✅ Crear y gestionar cupones de descuento
- ✅ Estadísticas generales del negocio
- ✅ Vista de cupones activos, expirados y agotados

### Sistema de Cupones
- ✅ Cupones manuales creados por admin
- ✅ Cupones automáticos para clientes leales
- ✅ Validación en tiempo real
- ✅ Porcentaje de descuento configurable
- ✅ Fecha de expiración
- ✅ Límite de usos (opcional)

## 🎨 Diseño

- **Tema**: Fresco y limpio (tema de agua)
- **Colores**: Sky Blue (#0EA5E9) con glassmorphism
- **Fuentes**: Outfit (headings) + Inter (body)
- **UI**: Componentes Shadcn/UI con Tailwind CSS

## 🛠️ Stack Tecnológico

**Frontend:**
- React 18
- React Router
- Axios
- Tailwind CSS
- Shadcn/UI Components
- Lucide Icons
- Sonner (Toasts)

**Backend:**
- FastAPI (Python)
- MongoDB con Motor (async)
- JWT Authentication (python-jose)
- Password Hashing (bcrypt)
- Pydantic (validación)

## 📋 Requisitos Previos

- Node.js 18+
- Python 3.11+
- MongoDB 5.0+
- Yarn

## 🚀 Instalación

### 1. Clonar el repositorio

\`\`\`bash
git clone https://github.com/IvanAven/acqua_web.git
cd acqua_web
\`\`\`

### 2. Configurar Backend

\`\`\`bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\\Scripts\\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus configuraciones
\`\`\`

**Variables de entorno del backend (.env):**
\`\`\`env
MONGO_URL=mongodb://localhost:27017
DB_NAME=acqua_db
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=tu-clave-secreta-super-segura-aqui
\`\`\`

### 3. Configurar Frontend

\`\`\`bash
cd frontend

# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus configuraciones
\`\`\`

**Variables de entorno del frontend (.env):**
\`\`\`env
REACT_APP_BACKEND_URL=http://localhost:8001
\`\`\`

### 4. Iniciar MongoDB

\`\`\`bash
# Si tienes MongoDB instalado localmente
sudo systemctl start mongodb

# O usa MongoDB Atlas (cloud)
# y actualiza MONGO_URL en backend/.env
\`\`\`

### 5. Ejecutar la Aplicación

**Backend:**
\`\`\`bash
cd backend
uvicorn server:app --reload --port 8001
\`\`\`

**Frontend:**
\`\`\`bash
cd frontend
yarn start
\`\`\`

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- Docs API: http://localhost:8001/docs

## 🔐 Credenciales por Defecto

**Administrador:**
- Email: `admin@acqua.com`
- Contraseña: `admin123`

⚠️ **IMPORTANTE:** Cambia estas credenciales en producción

## 📁 Estructura del Proyecto

\`\`\`
acqua_web/
├── backend/
│   ├── server.py           # API FastAPI
│   ├── requirements.txt    # Dependencias Python
│   └── .env               # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/        # Páginas principales
│   │   ├── context/      # Context API (Auth)
│   │   └── hooks/        # Custom hooks
│   ├── package.json
│   └── .env
└── design_guidelines.json  # Guías de diseño UI/UX
\`\`\`

## 🎯 Endpoints API Principales

### Autenticación
- `POST /api/auth/register` - Registrar nuevo cliente
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Pedidos
- `POST /api/orders` - Crear pedido
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/{id}` - Ver pedido específico
- `PUT /api/orders/{id}/status` - Actualizar estado (admin)
- `DELETE /api/orders/{id}` - Eliminar pedido (admin)

### Cupones
- `POST /api/coupons` - Crear cupón (admin)
- `GET /api/coupons` - Listar cupones (admin)
- `POST /api/coupons/validate` - Validar cupón
- `GET /api/coupons/my-coupons` - Cupones del cliente
- `DELETE /api/coupons/{code}` - Eliminar cupón (admin)

### Clientes y Estadísticas
- `GET /api/customers` - Listar clientes (admin)
- `GET /api/stats` - Estadísticas generales

## 💰 Sistema de Precios

- **Precio por garrafón**: $50 MXN
- **Cupones automáticos**: 20% OFF cada 5 pedidos entregados
- **Cupones manuales**: Configurable por admin (1-100%)

## 🚀 Deployment en Producción

### Opción 1: Emergent Hosting (Recomendado)
El proyecto está optimizado para Emergent con:
- 50 créditos gratis/mes
- Dominio personalizado
- MongoDB incluido
- SSL automático

### Opción 2: Deployment Manual
Ver archivo `DEPLOYMENT_GUIDE.md` para instrucciones detalladas de deployment en VPS, Heroku, DigitalOcean, etc.

## 📸 Screenshots

### Landing Page
![Landing](docs/screenshots/landing.png)

### Dashboard Cliente
![Customer Dashboard](docs/screenshots/customer-dashboard.png)

### Dashboard Admin
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

### Sistema de Cupones
![Coupons](docs/screenshots/coupons.png)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto fue desarrollado con Emergent AI Agent Platform.

## 👨‍💻 Autor

**Ivan Aven**
- GitHub: [@IvanAven](https://github.com/IvanAven)

## 🙏 Agradecimientos

- Emergent AI por la plataforma de desarrollo
- Shadcn/UI por los componentes
- Comunidad Open Source

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
