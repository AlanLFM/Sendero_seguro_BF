import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/zones
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT z.*, ST_AsText(z.geom) AS geom_text
       FROM zones z
       WHERE z.is_active = TRUE
       ORDER BY z.created_at DESC`
    );

    console.log(`[ZONES] GET /api/zones - ${result.rows.length} zonas`);
    res.json({ zones: result.rows });
  } catch (err) {
    console.error('[ZONES] Error al listar zonas:', err.message);
    console.error('[ZONES] Stack:', err.stack);
    next(err);
  }
});

// POST /api/zones
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, description, geom, riskLevel, color } = req.body;

    if (!name || !geom) {
      return res.status(400).json({ error: 'name y geom son requeridos' });
    }

    const result = await query(
      `INSERT INTO zones (name, description, geom, risk_level, color, created_by)
       VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, $6)
       RETURNING id, name, description, risk_level, color, created_at`,
      [name.trim(), description?.trim() || null, geom, riskLevel || 'medium', color || '#FF0000', req.user.id]
    );

    console.log('[ZONES] Zona creada:', result.rows[0].id);
    res.status(201).json({ message: 'Zona creada', zone: result.rows[0] });
  } catch (err) {
    console.error('[ZONES] Error al crear zona:', err.message);
    console.error('[ZONES] Stack:', err.stack);
    next(err);
  }
});

export default router;
