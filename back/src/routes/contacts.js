import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/contacts
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, nombre, telefono, email, relacion, created_at
       FROM support_contacts WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    console.log(`[CONTACTS] GET /api/contacts - ${result.rows.length} contactos`);
    res.json({ contacts: result.rows });
  } catch (err) {
    console.error('[CONTACTS] Error al listar contactos:', err.message);
    console.error('[CONTACTS] Stack:', err.stack);
    next(err);
  }
});

// POST /api/contacts
router.post('/', async (req, res, next) => {
  try {
    const { nombre, telefono, email, relacion } = req.body;

    if (!nombre || !telefono) {
      return res.status(400).json({ error: 'nombre y telefono son requeridos' });
    }

    const result = await query(
      `INSERT INTO support_contacts (user_id, nombre, telefono, email, relacion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, telefono, email, relacion`,
      [req.user.id, nombre.trim(), telefono.trim(), email?.trim() || null, relacion?.trim() || null]
    );

    console.log('[CONTACTS] Contacto creado:', result.rows[0].id, 'para user:', req.user.boleta);
    res.status(201).json({ message: 'Contacto creado', contact: result.rows[0] });
  } catch (err) {
    console.error('[CONTACTS] Error al crear contacto:', err.message);
    console.error('[CONTACTS] Stack:', err.stack);
    next(err);
  }
});

// PUT /api/contacts/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { nombre, telefono, email, relacion } = req.body;

    if (!nombre || !telefono) {
      return res.status(400).json({ error: 'nombre y telefono son requeridos' });
    }

    const result = await query(
      `UPDATE support_contacts
       SET nombre = $1, telefono = $2, email = $3, relacion = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, nombre, telefono, email, relacion`,
      [nombre.trim(), telefono.trim(), email?.trim() || null, relacion?.trim() || null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado o no pertenece al usuario' });
    }

    console.log('[CONTACTS] Contacto actualizado:', req.params.id);
    res.json({ message: 'Contacto actualizado', contact: result.rows[0] });
  } catch (err) {
    console.error('[CONTACTS] Error al actualizar contacto:', err.message);
    console.error('[CONTACTS] Stack:', err.stack);
    next(err);
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM support_contacts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado o no pertenece al usuario' });
    }

    console.log('[CONTACTS] Contacto eliminado:', req.params.id);
    res.json({ message: 'Contacto eliminado' });
  } catch (err) {
    console.error('[CONTACTS] Error al eliminar contacto:', err.message);
    console.error('[CONTACTS] Stack:', err.stack);
    next(err);
  }
});

export default router;
