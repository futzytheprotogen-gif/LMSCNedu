import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibLogin, tanganiErrorRbac } from "@/lib/rbac";

export const dynamic = "force-dynamic";

async function bolehAksesFilePrivat(url: string, sesi: Awaited<ReturnType<typeof wajibLogin>>) {
  const parsedUrl = new URL(url);

  if (parsedUrl.pathname.startsWith("/foto-profil/")) {
    const fotoProfil = await Promise.all([
      db.guru.findFirst({ where: { fotoProfil: url }, select: { id: true } }),
      db.siswa.findFirst({ where: { fotoProfil: url }, select: { id: true } }),
      db.admin.findFirst({ where: { fotoProfil: url }, select: { id: true } }),
    ]);
    if (fotoProfil.some(Boolean)) return true;
  }

  const [materi, tugas, pengumpulan] = await Promise.all([
    db.materi.findFirst({
      where: { url },
      select: { guruId: true, kelasId: true },
    }),
    db.tugas.findFirst({
      where: { lampiran: url },
      select: {
        guruId: true,
        kelasTujuan: { select: { kelasId: true } },
      },
    }),
    db.submissionTugas.findFirst({
      where: { fileUrl: url },
      select: {
        siswaId: true,
        tugas: {
          select: {
            guruId: true,
          },
        },
      },
    }),
  ]);

  if (materi) {
    if (sesi.role === "GURU") {
      if (materi.guruId === sesi.userId) return true;
      const mengajarDiKelas = await db.kelasGuru.findFirst({
        where: { kelasId: materi.kelasId, guruId: sesi.userId },
        select: { kelasId: true },
      });
      if (mengajarDiKelas) return true;
    }

    if (sesi.role === "SISWA") {
      const ikutKelas = await db.kelasSiswa.findFirst({
        where: { kelasId: materi.kelasId, siswaId: sesi.userId },
        select: { kelasId: true },
      });
      if (ikutKelas) return true;
    }
  }

  if (tugas) {
    if (sesi.role === "GURU" && tugas.guruId === sesi.userId) return true;

    if (sesi.role === "SISWA" && tugas.kelasTujuan.length > 0) {
      const ikutKelas = await db.kelasSiswa.findFirst({
        where: {
          siswaId: sesi.userId,
          kelasId: { in: tugas.kelasTujuan.map(({ kelasId }) => kelasId) },
        },
        select: { kelasId: true },
      });
      if (ikutKelas) return true;
    }
  }

  if (pengumpulan) {
    if (sesi.role === "SISWA" && pengumpulan.siswaId === sesi.userId) return true;
    if (sesi.role === "GURU" && pengumpulan.tugas.guruId === sesi.userId) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibLogin(request);
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ pesan: "File tidak ditemukan." }, { status: 404 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ pesan: "File tidak ditemukan." }, { status: 404 });
    }

    if (
      parsedUrl.protocol !== "https:" ||
      !parsedUrl.hostname.endsWith(".private.blob.vercel-storage.com") ||
      !(await bolehAksesFilePrivat(url, sesi))
    ) {
      return NextResponse.json({ pesan: "File tidak ditemukan." }, { status: 404 });
    }

    const file = await get(url, { access: "private" });
    if (!file || file.statusCode !== 200) {
      return NextResponse.json({ pesan: "File tidak ditemukan." }, { status: 404 });
    }

    return new NextResponse(file.stream, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": "inline",
        "Content-Length": String(file.blob.size),
        "Content-Type": file.blob.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const responRbac = tanganiErrorRbac(error);
    if (responRbac) return responRbac;

    console.error("Gagal mengambil file privat:", error);
    return NextResponse.json({ pesan: "Terjadi kesalahan di server." }, { status: 500 });
  }
}
