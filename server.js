require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Multimedia = require('./models/Multimedia');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir archivos estáticos

// Asegurar que la carpeta 'uploads' exista localmente
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Configuración de almacenamiento con Multer 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🚀 Conectado con éxito a MongoDB Atlas'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// ==========================================
// OPERACIONES CRUD
// ==========================================

// 1. CREATE: Subir archivos y guardar documento en NoSQL 
app.post('/api/multimedia', upload.fields([{ name: 'imagen' }, { name: 'audio' }]), async (req, res) => {
    try {
        const { titulo, descripcion, tags } = req.body;
        
        if (!req.files['imagen'] || !req.files['audio']) {
            return res.status(400).json({ error: 'Falta seleccionar imagen o audio.' });
        }

        // CORRECCIÓN DE CONTENIDO MIXTO: Forzamos el uso de HTTPS en producción para Render
        const baseURl = process.env.NODE_ENV === 'production' 
            ? 'https://multimedia-backend-p6xb.onrender.com' 
            : `${req.protocol}://${req.get('host')}`;

        // Si por alguna razón local req.protocol es http, nos aseguramos que en Render use https://
        const baseURlSegura = baseURl.replace("http://multimedia-backend-p6xb.onrender.com", "https://multimedia-backend-p6xb.onrender.com");

        const imagenUrl = `${baseURlSegura}/uploads/${req.files['imagen'][0].filename}`;
        const audioUrl = `${baseURlSegura}/uploads/${req.files['audio'][0].filename}`;

        const listaTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

        const nuevoElemento = new Multimedia({
            titulo,
            descripcion,
            imagenUrl,
            audioUrl,
            tags: listaTags
        });

        await nuevoElemento.save();
        res.status(201).json({ mensaje: 'Guardado con éxito en la nube', elemento: nuevoElemento });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar el elemento.' });
    }
});

// 2. READ: Extraer todos los documentos de la BD 
app.get('/api/multimedia', async (req, res) => {
    try {
        const elementos = await Multimedia.find().sort({ fechaCreacion: -1 }); // Extraer todos 
        res.json(elementos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los datos.' });
    }
});

// 3. UPDATE: Actualizar datos de un registro
app.put('/api/multimedia/:id', async (req, res) => {
    try {
        const { titulo, descripcion, tags } = req.body;
        const listaTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

        const elementoActualizado = await Multimedia.findByIdAndUpdate(
            req.params.id,
            { titulo, descripcion, tags: listaTags },
            { new: true } // Retorna el documento modificado
        );
        res.json({ mensaje: 'Actualizado con éxito', elemento: elementoActualizado });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar.' });
    }
});

// 4. DELETE: Eliminar de MongoDB
app.delete('/api/multimedia/:id', async (req, res) => {
    try {
        await Multimedia.findByIdAndDelete(req.params.id); // Borrar registro de BD
        res.json({ mensaje: 'Elemento eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar.' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`📡 Servidor Backend corriendo en http://localhost:${PORT}`);
});