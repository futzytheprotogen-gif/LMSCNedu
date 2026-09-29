import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibSiswa, tanganiErrorRbac, ForbiddenError } from "@/lib/rbac";

interface KonteksRute {
  params: Promise<{ id: string }>;
}

interface BodySubmit {
  fileUrl?: string;
}

// ------------------------------------------------------------
// POST /api/tugas/[id]/submit
// Body: { fileUrl: string } — fileUrl didapat dari /api/upload
// (folder "jawaban-tugas") yang dipanggil terpisah dari frontend
// SEBELUM route ini dipanggil.
// ------------------------------------------------------------

export async function POST(request: NextRequest, { params }: KonteksRute) {
  try {
    const sesi = await wajibSiswa(request);
    const { id } = await params;

    const body: BodySubmit = await request.json().catch(() => ({}));
    if (!body.fileUrl || typeof body.fileUrl !== "string") {
      return NextResponse.json(
        { pesan: "fileUrl wajib disertakan (upload file dulu lewat /api/upload)" },
        { status: 400 }
      );
    }

    const tugas = await db.tugas.findUnique({
      where: { id },
      include: { kelasTujuan: { select: { kelasId: true } } },
    });
    if (!tugas) {
      return NextResponse.json({ pesan: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const kelasTujuanIds = tugas.kelasTujuan.map((kt) => kt.kelasId);
    if (kelasTujuanIds.length === 0) {
      return NextResponse.json(
        { pesan: "Tugas ini belum dikirim ke kelas manapun" },
        { status: 400 }
      );
    }

    const siswaIkutKelas = await db.kelasSiswa.findFirst({
      where: { siswaId: sesi.userId, kelasId: { in: kelasTujuanIds } },
    });
    if (!siswaIkutKelas) {
      throw new ForbiddenError("Tugas ini tidak dikirim ke kelasmu");
    }

    const submission = await db.submissionTugas.upsert({
      where: { tugasId_siswaId: { tugasId: id, siswaId: sesi.userId } },
      update: { fileUrl: body.fileUrl, waktuKumpul: new Date() },
      create: { tugasId: id, siswaId: sesi.userId, fileUrl: body.fileUrl },
    });

    return NextResponse.json(
      {
        data: {
          fileUrl: submission.fileUrl,
          waktuKumpul: submission.waktuKumpul,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}