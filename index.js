const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');

const authRoutes = require('./routes/auth.routes');
const componentsRoutes = require('./routes/components.routes');
const movementsRoutes = require('./routes/movements.routes');
const alertsRoutes = require('./routes/alerts.routes');
const reportsRoutes = require('./routes/reports.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

// Permitir temporalmente solicitudes desde cualquier frontend.
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'InventoryPro Backend funcionando correctamente'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/components', componentsRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexión con PostgreSQL establecida correctamente');

    await sequelize.sync();
    console.log('Tablas verificadas correctamente');

    app.listen(PORT, () => {
      console.log(`Servidor funcionando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();