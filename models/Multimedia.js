const mongoose = require('mongoose');

const ElementoMultimediaSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: String,
    imagenUrl: { type: String, required: true }, // Guarda la ruta pública/local
    audioUrl: { type: String, required: true },  // Guarda la ruta pública/local
    tags: [String],                             // Reto de optimización NoSQL
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Multimedia', ElementoMultimediaSchema);