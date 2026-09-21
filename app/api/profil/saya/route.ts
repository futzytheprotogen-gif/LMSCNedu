import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibLogin, tanganiErrorRbac } from "@/lib/rbac";

// ------------------------------------------------------------
// GET /api/profil/saya — profil lengkap milik sendiri, buat semua
// role (Admin/Kepsek/Kurikulum/Guru/Siswa). Field yang dikunci
// (email, NIS/NIK, jurusan) TETAP ikut dibalikin di sini (biar
// kelihatan di halaman profil), tapi frontend gak ngasih cara buat
// ubahnya — itu cuma bisa admin lewat dashboard.
// ------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibLogin(request);
    const profil = await ambilProfilLengkap(sesi.userId, sesi.role);

    if (!profil) {
      return NextResponse.json({ pesan: "Profil tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: profil });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// PATCH /api/profil/saya — cuma boleh ubah nama, deskripsi, fotoProfil
// Body: { nama?: string, deskripsi?: string, fotoProfil?: string }
// ------------------------------------------------------------

interface BodyEditProfil {
  nama?: string;
  deskripsi?: string;
  fotoProfil?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const sesi = await wajibLogin(request);
    const body: BodyEditProfil = await request.json().catch(() => ({}));

    const dataUpdate = {
      nama: body.nama?.trim(),
      deskripsi: body.deskripsi?.trim(),
      fotoProfil: body.fotoProfil,
    };

    if (sesi.role === "GURU") {
      await db.guru.update({ where: { id: sesi.userId }, data: dataUpdate });
    } else if (sesi.role === "SISWA") {
      await db.siswa.update({ where: { id: sesi.userId }, data: dataUpdate });
    } else {
      await db.admin.update({ where: { id: sesi.userId }, data: dataUpdate });
    }

    const profilTerbaru = await ambilProfilLengkap(sesi.userId, sesi.role);
    return NextResponse.json({ data: profilTerbaru });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}

// ------------------------------------------------------------
// Helper dipakai GET & PATCH di file ini — juga diekspor biar
// dipakai app/api/profil/[userId]/route.ts (lihat file itu)
// ------------------------------------------------------------

export async function ambilProfilLengkap(userId: string, role: string) {
  if (role === "GURU") {
    const guru = await db.guru.findUnique({
      where: { id: userId },
      include: { mapelDiampu: { include: { mapel: { select: { nama: true } } } } },
    });
    if (!guru) return null;
    return {
      id: guru.id,
      role: "GURU" as const,
      nama: guru.nama,
      email: guru.email,
      fotoProfil: guru.fotoProfil,
      deskripsi: guru.deskripsi,
      jenisKelamin: guru.jenisKelamin,
      mapelDiampu: guru.mapelDiampu.map((m) => m.mapel.nama),
    };
  }

  if (role === "SISWA") {
    const siswa = await db.siswa.findUnique({
      where: { id: userId },
      include: { rombel: { select: { label: true } } },
    });
    if (!siswa) return null;
    return {
      id: siswa.id,
      role: "SISWA" as const,
      nama: siswa.nama,
      email: siswa.email,
      nis: siswa.nis.toString(),
      fotoProfil: siswa.fotoProfil,
      deskripsi: siswa.deskripsi,
      jenisKelamin: siswa.jenisKelamin,
      rombel: siswa.rombel.label,
    };
  }

  // ADMIN / KEPSEK / KURIKULUM
  const admin = await db.admin.findUnique({ where: { id: userId } });
  if (!admin) return null;
  return {
    id: admin.id,
    role: admin.role,
    nama: admin.nama,
    email: admin.email,
    fotoProfil: admin.fotoProfil,
    deskripsi: admin.deskripsi,
  };
}