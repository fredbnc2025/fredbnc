const { execSync } = require('child_process');
const path = require('path');

const pyScript = path.join(__dirname, 'create_sell_package.py');
console.log('Ejecutando generador universal de paquetes ZIP...');
try {
  execSync(`python3 "${pyScript}"`, { stdio: 'inherit' });
  console.log('✅ Paquete ZIP generado exitosamente.');
} catch (err) {
  console.error('Error al generar el ZIP:', err);
  process.exit(1);
}
