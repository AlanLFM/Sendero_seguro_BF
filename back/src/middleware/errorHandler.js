export const errorHandler = (err, req, res, next) => {
  console.error('========================================');
  console.error('[ERROR] Error no manejado:');
  console.error('[ERROR] Mensaje:', err.message);
  console.error('[ERROR] Stack:', err.stack);
  console.error('[ERROR] Ruta:', req.method, req.originalUrl);
  console.error('[ERROR] Body:', JSON.stringify(req.body));
  console.error('[ERROR] Params:', JSON.stringify(req.params));
  console.error('========================================');

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'El recurso ya existe (constraint unique)' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia invalida: el recurso relacionado no existe' });
  }

  if (err.code === '23502') {
    return res.status(400).json({ error: 'Campo requerido faltante' });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
};

export const notFoundHandler = (req, res) => {
  console.warn('[404] Ruta no encontrada:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Ruta no encontrada' });
};
