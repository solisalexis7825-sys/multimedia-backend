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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🚀 Conectado con éxito a MongoDB Atlas'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

app.get('/', (req, res) => {
    res.send('🚀 El Servidor Backend NoSQL está corriendo perfectamente en la nube de Render.');
});

// 1. CREATE
app.post('/api/multimedia', upload.fields([{ name: 'imagen' }, { name: 'audio' }]), async (req, res) => {
    try {
        const { titulo, descripcion, tags } = req.body;
        if (!req.files['imagen'] || !req.files['audio']) {
            return res.status(400).json({ error: 'Falta seleccionar imagen o audio.' });
        }
        const baseURl = process.env.NODE_ENV === 'production' ? 'https://multimedia-backend-p6xb.onrender.com' : `${req.protocol}://${req.get('host')}`;
        const baseURlSegura = baseURl.replace("http://multimedia-backend-p6xb.onrender.com", "https://multimedia-backend-p6xb.onrender.com");

        const imagenUrl = `${baseURlSegura}/uploads/${req.files['imagen'][0].filename}`;
        const audioUrl = `${baseURlSegura}/uploads/${req.files['audio'][0].filename}`;
        const listaTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

        const nuevoElemento = new Multimedia({ titulo, descripcion, imagenUrl, audioUrl, tags: listaTags });
        await nuevoElemento.save();
        res.status(201).json({ mensaje: 'Guardado con éxito', elemento: nuevoElemento });
    } catch (error) { res.status(500).json({ error: 'Error al guardar.' }); }
});

// 2. READ
app.get('/api/multimedia', async (req, res) => {
    try {
        const elementos = await Multimedia.find().sort({ fechaCreacion: -1 });
        res.json(elementos);
    } catch (error) { res.status(500).json({ error: 'Error al obtener los datos.' }); }
});

// 3. UPDATE (¡Optimizado y protegido contra datos nulos!)
app.put('/api/multimedia/:id', upload.fields([{ name: 'imagen' }, { name: 'audio' }]), async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar primero el elemento para no perder datos previos
        const elementoExistente = await Multimedia.findById(id);
        if (!elementoExistente) {
            return res.status(404).json({ error: 'Elemento no encontrado.' });
        }

        // Validar textos: si no se envían, dejamos los valores que ya tenía guardados
        const tituloFinal = req.body.titulo || elementoExistente.titulo;
        const descripcionFinal = req.body.descripcion !== undefined ? req.body.descripcion : elementoExistente.descripcion;
        
        let listaTags = elementoExistente.tags;
        if (req.body.tags !== undefined) {
            listaTags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
        }

        let imagenUrl = elementoExistente.imagenUrl;
        let audioUrl = elementoExistente.audioUrl;

        const baseURl = process.env.NODE_ENV === 'production' ? 'https://multimedia-backend-p6xb.onrender.com' : `${req.protocol}://${req.get('host')}`;
        const baseURlSegura = baseURl.replace("http://multimedia-backend-p6xb.onrender.com", "https://multimedia-backend-p6xb.onrender.com");

        // Si se subió una nueva imagen
        if (req.files && req.files['imagen'] && req.files['imagen'][0]) {
            imagenUrl = `${baseURlSegura}/uploads/${req.files['imagen'][0].filename}`;
        }

        // Si se subió un nuevo audio
        if (req.files && req.files['audio'] && req.files['audio'][0]) {
            audioUrl = `${baseURlSegura}/uploads/${req.files['audio'][0].filename}`;
        }

        // Actualizar el documento en MongoDB Atlas
        const elementoActualizado = await Multimedia.findByIdAndUpdate(
            id,
            { titulo: tituloFinal, descripcion: descripcionFinal, tags: listaTags, imagenUrl, audioUrl },
            { new: true }
        );

        res.json({ mensaje: 'Actualizado con éxito', elemento: elementoActualizado });
    } catch (error) {
        console.error("Error en PUT:", error);
        res.status(500).json({ error: 'Error al actualizar el elemento.' });
    }
});

// 4. DELETE
app.delete('/api/multimedia/:id', async (req, res) => {
    try {
        await Multimedia.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Elemento eliminado correctamente.' });
    } catch (error) { res.status(500).json({ error: 'Error al eliminar.' }); }
});

app.listen(PORT, () => { console.log(`📡 Servidor Backend corriendo en http://localhost:${PORT}`); });