import mariadb from "mariadb";

export const dynamic = "force-dynamic";

const b = (v?: string) => v?.trim().replace(/^["']|["']$/g, "");

export async function GET() {
  const info = {
    host: b(process.env.DB_HOST),
    port: b(process.env.DB_PORT),
    dbName: b(process.env.DB_NAME),
    userEndsWithRoot: b(process.env.DB_USER)?.endsWith(".root"),
    passwordLength: process.env.DB_PASSWORD?.length,
    dbSslRaw: process.env.DB_SSL,
  };

  try {
    const conn = await mariadb.createConnection({
      host: b(process.env.DB_HOST),
      port: Number(b(process.env.DB_PORT)),
      user: b(process.env.DB_USER),
      password: b(process.env.DB_PASSWORD),
      database: b(process.env.DB_NAME),
      ssl: true,
      connectTimeout: 15000,
    });
    await conn.query("SELECT 1");
    await conn.end();
    return Response.json({ ok: true, info });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return Response.json(
      { ok: false, code: err.code, message: err.message, info },
      { status: 500 }
    );
  }
}