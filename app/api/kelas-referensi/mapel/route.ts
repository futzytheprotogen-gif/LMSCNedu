import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibAdminSaja } from "@/lib/rbac";

interface BodyMapel {
  nama?: string;
}

export async function POST(request: NextRequest) {
  try {
    await wajibAdminSaja(request);
    const input: unknown = await request.json().catch(() => null);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ pesan: "Data mata pelajaran tidak valid." }, { status: 400 });
    }
    const body = input as BodyMapel;
    if (body.nama !== undefined && typeof body.nama !== "string") {
      return NextResponse.json({ pesan: "Nama mata pelajaran tidak valid." }, { status: 400 });
    }
    const nama = body.nama?.trim();
    if (!nama) {
      return NextResponse.json({ pesan: "Nama mata pelajaran wajib diisi." }, { status: 400 });
    }
    if (nama.length > 100) {
      return NextResponse.json(
        { pesan: "Nama mata pelajaran maksimal 100 karakter." },
        { status: 400 }
      );
    }

    const mapel = await db.mataPelajaran.create({
      data: { nama },
      select: { id: true, nama: true },
    });
    return NextResponse.json({ data: mapel }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { pesan: "Mata pelajaran tersebut sudah terdaftar." },
        { status: 409 }
      );
    }
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server." }, { status: 500 })
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await wajibAdminSaja(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ pesan: "ID mata pelajaran wajib disertakan." }, { status: 400 });
    }

    const mapel = await db.mataPelajaran.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        _count: {
          select: { guruPengampu: true, kelasGuru: true, asesmen: true },
        },
      },
    });
    if (!mapel) {
      return NextResponse.json({ pesan: "Mata pelajaran tidak ditemukan." }, { status: 404 });
    }

    const jumlahPemakaian =
      mapel._count.guruPengampu + mapel._count.kelasGuru + mapel._count.asesmen;
    if (jumlahPemakaian > 0) {
      return NextResponse.json(
        {
          pesan: `Mata pelajaran ${mapel.nama} masih dipakai oleh guru, kelas, atau asesmen. Hapus penugasan terkait terlebih dahulu.`,
        },
        { status: 409 }
      );
    }

    await db.mataPelajaran.delete({ where: { id } });
    return NextResponse.json({ pesan: `Mata pelajaran ${mapel.nama} berhasil dihapus.` });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        { pesan: "Mata pelajaran masih digunakan dan tidak dapat dihapus." },
        { status: 409 }
      );
    }
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server." }, { status: 500 })
    );
  }
}
