const db = require('./src/db');
const { hashPassword } = require('./src/adminAuth');

async function setupAdmin() {
  const phoneNumber = process.env.ADMIN_PHONE || process.argv[2] || '+251900000000';
  const password = process.env.ADMIN_PASSWORD || process.argv[3];

  if (!password || password.length < 10) {
    console.error('❌ Usage: node setup_admin.js <phoneNumber> <strongPassword>');
    console.error('   Or set ADMIN_PASSWORD (>= 10 characters) in environment.');
    process.exit(1);
  }

  try {
    const pwHash = await hashPassword(password);
    const res = await db.query(
      `INSERT INTO users (display_name, phone_number, password_hash, role)
       VALUES ('Super Admin', $1, $2, 'admin')
       ON CONFLICT (phone_number)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', is_active = TRUE
       RETURNING id, display_name, phone_number, role`,
      [phoneNumber, pwHash]
    );
    console.log('✅ Admin user created/updated securely:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

setupAdmin();
