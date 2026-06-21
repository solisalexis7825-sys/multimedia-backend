const mongoose = require('mongoose');

const ElementoMultimediaSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: String,
    imagenUrl: { type: String, required: true }, // Guarda la ruta pública/local [cite: 134]
    audioUrl: { type: String, required: true },  // Guarda la ruta pública/local [cite: 134]
    tags: [String],                             // Reto de optimización NoSQL [cite: 154]
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Multimedia', ElementoMultimediaSchema);