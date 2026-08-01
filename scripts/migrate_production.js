const { Client } = require('pg');

const connectionString = "postgresql://postgres.hnbxhuqficktoaivrrqj:E0unkZXAaDHP0CEB@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

async function migrate() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to production PostgreSQL database via Pooler.");

    console.log("Adding grupo_id to pacientes...");
    await client.query("ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS grupo_id TEXT;");

    console.log("Adding grupo_id to sesiones_clinicas...");
    await client.query("ALTER TABLE sesiones_clinicas ADD COLUMN IF NOT EXISTS grupo_id TEXT;");

    console.log("Adding anotacion_clinica to sesiones_clinicas...");
    await client.query("ALTER TABLE sesiones_clinicas ADD COLUMN IF NOT EXISTS anotacion_clinica TEXT;");

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
