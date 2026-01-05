const bcrypt = require('bcrypt');

async function run() {
  const passwordPlano = 'Admin2025'; // puedes poner otra
  const hash = await bcrypt.hash(passwordPlano, 10);
  console.log('Hash generado:', hash);
}

run();
