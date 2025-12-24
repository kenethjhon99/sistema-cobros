const pool = require('../db');
// Obtener todos los estudiantes
const obtenerEstudiantes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estudiantes');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los estudiantes' });
    }
};
// Crear un nuevo estudiante
const crearEstudiante = async (req, res) => {
    try {
        const {
            cui,
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            grado_id,
        } = req.body;
        if (!cui || !primer_nombre || !primer_apellido || !grado_id) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        const creado_por = 'admin_demo';
        const query = `
            INSERT INTO estudiantes
            (cui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, grado_id, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            cui,
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            grado_id,
            creado_por,
        ];
        const [result] = await pool.query(query, params);
        const [rows] = await pool.query('SELECT * FROM estudiantes WHERE id = ?', [
            result.insertId,
        ]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el estudiante' });
    }   
};
module.exports = {
    obtenerEstudiantes,
    crearEstudiante,
};