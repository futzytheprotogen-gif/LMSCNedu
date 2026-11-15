import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibAdminSaja } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    await wajibAdminSaja(request);
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !("nama" in body) || typeof body.nama !== "string") {
      return NextResponse.json({ pesan: "Nama jurusan wajib diisi." }, { status: 400 });
    }

    const nama = body.nama.trim().toUpperCase();
    if (!nama || nama.length > 60) {
      return NextResponse.json({ pesan: "Nama jurusan harus berisi 1–60 karakter." }, { status: 400 });
    }

    const jurusan = await db.jurusanAkademik.create({ data: { nama } });
    return NextResponse.json({ data: jurusan }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ pesan: "Jurusan tersebut sudah terdaftar." }, { status: 409 });
    }
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Jurusan gagal ditambahkan." }, { status: 500 })
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await wajibAdminSaja(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ pesan: "ID jurusan wajib disertakan." }, { status: 400 });
    }

    const jurusan = await db.jurusanAkademik.findUnique({
      where: { id },
      include: { _count: { select: { rombel: true } } },
    });
    if (!jurusan) {
      return NextResponse.json({ pesan: "Jurusan tidak ditemukan." }, { status: 404 });
    }
    if (jurusan._count.rombel > 0) {
      return NextResponse.json(
        { pesan: `Jurusan ${jurusan.nama} masih digunakan oleh ${jurusan._count.rombel} rombel.` },
        { status: 409 }
      );
    }

    await db.jurusanAkademik.delete({ where: { id } });
    return NextResponse.json({ pesan: `Jurusan ${jurusan.nama} berhasil dihapus.` });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Jurusan gagal dihapus." }, { status: 500 })
    );
  }
}
