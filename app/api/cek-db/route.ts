import mariadb from "mariadb";

export const dynamic = "force-dynamic";

export async function GET() {
  let conn: Awaited<ReturnType<typeof mariadb.createConnection>> | null = null;
  try {
    const b = (value?: string) => value?.trim().replace(/^["']|["']$/g, "");
    conn = await mariadb.createConnection({
      host: b(process.env.DB_HOST),
      port: Number(b(process.env.DB_PORT)),
      user: b(process.env.DB_USER),
      password: b(process.env.DB_PASSWORD),
      database: b(process.env.DB_NAME),
      ssl: true,
      connectTimeout: 15000,
    });
    await conn.query("SELECT 1");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Pemeriksaan koneksi database gagal:", error);
    return Response.json(
      { ok: false, pesan: "Koneksi database belum tersedia." },
      { status: 503 }
    );
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch (error) {
        console.error("Gagal menutup koneksi pemeriksaan database:", error);
      }
    }
  }
}