const isAdmin = (req, res, next) => {
  const role = req.user?.role || req.user?.rol;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol administrador.' });
  }

  return next();
};

module.exports = isAdmin;
