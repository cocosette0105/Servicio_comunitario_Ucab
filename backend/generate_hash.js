const bcrypt = require('bcryptjs');

// La nueva contraseña que queremos encriptar
const newPassword = 'fefy1234';

async function generateHash() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        console.log(`Contraseña: ${newPassword}`);
        console.log(`Nuevo Hash: ${hash}`);
    } catch (error) {
        console.error('Error al generar el hash:', error);
    }
}

generateHash();
