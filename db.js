const express = require('express');
const { sequelize } = require('../config/sequelize');

const router = express.Router();

// Helper to get user tables from SQLite
async function listTables() {
  const [rows] = await sequelize.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
  );
  return rows.map((r) => r.name);
}

// GET /api/db/tables → list table names
router.get('/tables', async (req, res) => {
  try {
    const tables = await listTables();
    res.json({ success: true, tables });
  } catch (error) {
    console.error('List tables error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list tables' });
  }
});

// GET /api/db/table/:name → fetch rows from a specific table
// Query params: limit (default 50, max 200), offset (default 0)
router.get('/table/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const tables = await listTables();
    if (!tables.includes(name)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Unknown table name' });
    }

    // Safe-ish: we validated the table name against the real list
    const [rows] = await sequelize.query(`SELECT * FROM ${name} LIMIT ${limit} OFFSET ${offset};`);

    res.json({ success: true, table: name, count: rows.length, rows, limit, offset });
  } catch (error) {
    console.error('Fetch table rows error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch table rows' });
  }
});

// GET /api/db/table/:name/columns → list column info
router.get('/table/:name/columns', async (req, res) => {
  try {
    const { name } = req.params;
    const tables = await listTables();
    if (!tables.includes(name)) {
      return res.status(400).json({ error: 'Validation Error', message: 'Unknown table name' });
    }

    // PRAGMA table_info returns column metadata
    const [cols] = await sequelize.query(`PRAGMA table_info(${name});`);
    res.json({ success: true, table: name, columns: cols });
  } catch (error) {
    console.error('Fetch table columns error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch table columns' });
  }
});

module.exports = router;


