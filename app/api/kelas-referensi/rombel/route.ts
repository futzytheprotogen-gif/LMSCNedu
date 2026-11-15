import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tanganiErrorRbac, wajibAdminSaja } from "@/lib/rbac";

interface BodyRombel {
  jenjang?: string;
  angkatan?: number | null;
  jurusanId?: string | null;
  variasi?: string | null;
}

const TINGKAT_PER_JENJANG: Record<string, number[]> = {
  SMP: [7, 8, 9],
  SMA: [10, 11, 12],
  SMK: [10, 11, 12],
};

export async function POST(request: NextRequest) {
  try {
    await wajibAdminSaja(request);

    const input: unknown = await request.json().catch(() => null);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ pesan: "Data rombel tidak valid." }, { status: 400 });
    }
    const body = input as BodyRombel;
    if (
      (body.jenjang !== undefined && typeof body.jenjang !== "string") ||
      (body.angkatan !== undefined &&
        body.angkatan !== null &&
        typeof body.angkatan !== "number") ||
      (body.jurusanId !== undefined && body.jurusanId !== null && typeof body.jurusanId !== "string") ||
      (body.variasi !== undefined && body.variasi !== null && typeof body.variasi !== "string")
    ) {
      return NextResponse.json({ pesan: "Data rombel tidak valid." }, { status: 400 });
    }

    const jenjang = body.jenjang?.trim().toUpperCase();
    const tingkat = body.angkatan;
    const jurusanId = body.jurusanId?.trim() || null;
    const variasi = body.variasi?.trim().toUpperCase() || null;
    const tingkatValid = jenjang ? TINGKAT_PER_JENJANG[jenjang] : null;

    if (!jenjang || !tingkatValid) {
      return NextResponse.json(
        { pesan: "Jenjang harus SMP, SMA, atau SMK." },
        { status: 400 }
      );
    }
    if (
      tingkat !== null &&
      tingkat !== undefined &&
      (!Number.isInteger(tingkat) || !tingkatValid.includes(tingkat))
    ) {
      return NextResponse.json(
        { pesan: `Tingkat kelas tidak sesuai untuk jenjang ${jenjang}.` },
        { status: 400 }
      );
    }
    if (jenjang === "SMK" && (tingkat == null || !jurusanId)) {
      return NextResponse.json(
        { pesan: "Rombel SMK wajib memiliki tingkat dan jurusan." },
        { status: 400 }
      );
    }
    if ((variasi?.length ?? 0) > 30) {
      return NextResponse.json(
        { pesan: "Variasi rombel maksimal 30 karakter." },
        { status: 400 }
      );
    }
    if (tingkat == null && (jurusanId || variasi)) {
      return NextResponse.json(
        { pesan: "Isi tingkat kelas jika menambahkan jurusan atau variasi rombel." },
        { status: 400 }
      );
    }

    const jurusan = jurusanId
      ? await db.jurusanAkademik.findUnique({ where: { id: jurusanId } })
      : null;
    if (jurusanId && !jurusan) {
      return NextResponse.json({ pesan: "Jurusan tidak ditemukan." }, { status: 404 });
    }

    const label = tingkat == null
      ? jenjang
      : [tingkat, jurusan?.nama ?? jenjang, variasi].filter(Boolean).join(" ");

    const rombel = await db.rombelAkademik.create({
      data: { label, jenjang, angkatan: tingkat ?? null, jurusanId, variasi },
      select: { id: true, label: true, jenjang: true, angkatan: true, jurusanId: true, variasi: true },
    });

    return NextResponse.json({ data: rombel }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { pesan: "Rombel dengan nama tersebut sudah ada." },
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
      return NextResponse.json({ pesan: "ID rombel wajib disertakan." }, { status: 400 });
    }

    const rombel = await db.rombelAkademik.findUnique({
      where: { id },
      select: { id: true, label: true, _count: { select: { siswa: true } } },
    });
    if (!rombel) {
      return NextResponse.json({ pesan: "Rombel tidak ditemukan." }, { status: 404 });
    }
    if (rombel._count.siswa > 0) {
      return NextResponse.json(
        {
          pesan: `Rombel ${rombel.label} masih digunakan oleh ${rombel._count.siswa} siswa. Pindahkan siswa terlebih dahulu.`,
        },
        { status: 409 }
      );
    }

    await db.rombelAkademik.delete({ where: { id } });
    return NextResponse.json({ pesan: `Rombel ${rombel.label} berhasil dihapus.` });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        { pesan: "Rombel masih digunakan dan tidak dapat dihapus." },
        { status: 409 }
      );
    }
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server." }, { status: 500 })
    );
  }
}
