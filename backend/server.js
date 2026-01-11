import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;
const app = express();

// Configuración de CORS mejorada
app.use(cors({
    origin: '*', // Permite peticiones desde cualquier origen (incluyendo tu 127.0.0.1:5500)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const pool = new Pool({
    connectionString: "postgresql://postgres.lagplzujbvvamujmcorb:BasededatosDSI@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
});

// --- RUTAS ---

app.post('/login', async (req, res) => {
    const { cedula, clave } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE cedula = $1', [cedula]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(clave, user.clave);
            if (match) return res.json({ usuario: { id: user.id, nombre: user.nombre, cedula: user.cedula } });
        }
        res.status(401).json({ error: 'Credenciales incorrectas' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, cedula, nombre FROM usuarios ORDER BY id ASC');
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/usuarios', async (req, res) => {
    const { cedula, nombre, clave } = req.body;
    try {
        const hash = await bcrypt.hash(clave, 10);
        await pool.query('INSERT INTO usuarios (cedula, nombre, clave) VALUES ($1, $2, $3)', [cedula, nombre, hash]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/usuarios/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/asignaturas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM asignatura ORDER BY id ASC');
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/asignaturas', async (req, res) => {
    const { codigo, nombre, creditos } = req.body;
    try {
        await pool.query('INSERT INTO asignatura (codigo, nombre, creditos) VALUES ($1, $2, $3)', [codigo, nombre, creditos]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/asignaturas/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM asignatura WHERE id = $1', [req.params.id]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/estudiantes', async (req, res) => {
    const { cedula, nombre } = req.body;
    try {
        const existe = await pool.query('SELECT id FROM estudiantes WHERE cedula = $1', [cedula]);
        if (existe.rows.length > 0) return res.json(existe.rows[0]);
        const nuevo = await pool.query('INSERT INTO estudiantes (cedula, nombre) VALUES ($1, $2) RETURNING id', [cedula, nombre]);
        res.json(nuevo.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/inscripciones', async (req, res) => {
    const { estudiante_id, asignatura_id, periodo, nota_final } = req.body;
    try {
        await pool.query(
            'INSERT INTO notas (estudiante_id, asignatura_id, nota_final, periodo) VALUES ($1, $2, $3, $4)',
            [estudiante_id, asignatura_id, nota_final, periodo]
        );
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/notas', async (req, res) => {
    try {
        const query = `
            SELECT n.*, e.nombre as estudiante_nombre, e.cedula as estudiante_cedula 
            FROM notas n 
            JOIN estudiantes e ON n.estudiante_id = e.id
            ORDER BY n.id DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(3000, () => console.log(`🚀 Servidor listo en Puerto 3000`));