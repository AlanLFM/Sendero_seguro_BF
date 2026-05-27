import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/routes
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, ST_AsText(r.geom) AS geom_text
       FROM routes r
       WHERE r.is_active = TRUE
       ORDER BY r.created_at DESC`
    );

    console.log(`[ROUTES] GET /api/routes - ${result.rows.length} rutas`);
    res.json({ routes: result.rows });
  } catch (err) {
    console.error('[ROUTES] Error al listar rutas:', err.message);
    console.error('[ROUTES] Stack:', err.stack);
    next(err);
  }
});

// POST /api/routes
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, description, geom, riskLevel } = req.body;

    if (!name || !geom) {
      return res.status(400).json({ error: 'name y geom son requeridos' });
    }

    const result = await query(
      `INSERT INTO routes (name, description, geom, risk_level, created_by)
       VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5)
       RETURNING id, name, description, risk_level, distance_m, created_at`,
      [name.trim(), description?.trim() || null, geom, riskLevel || 'low', req.user.id]
    );

    console.log('[ROUTES] Ruta creada:', result.rows[0].id);
    res.status(201).json({ message: 'Ruta creada', route: result.rows[0] });
  } catch (err) {
    console.error('[ROUTES] Error al crear ruta:', err.message);
    console.error('[ROUTES] Stack:', err.stack);
    next(err);
  }
});

export default router;
