import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wajibGuru, tanganiErrorRbac } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const sesi = await wajibGuru(request);
    const daftarSubmission = await db.submissionAsesmen.findMany({
      where: {
        asesmen: { is: { guruId: sesi.userId } },
        waktuSelesai: { not: null },
        nilai: { not: null },
      },
      select: { nilai: true, waktuSelesai: true },
    });

    const bulanIni = new Date();
    bulanIni.setDate(1);
    const rentangBulan = Array.from({ length: 6 }, (_, indeks) => {
      const tanggal = new Date(bulanIni.getFullYear(), bulanIni.getMonth() - 5 + indeks, 1);
      const kunci = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, "0")}`;
      return {
        kunci,
        label: tanggal.toLocaleDateString("id-ID", { month: "short" }),
        totalNilai: 0,
        jumlah: 0,
      };
    });
    const posisiBulan = new Map(rentangBulan.map((bulan, indeks) => [bulan.kunci, indeks]));

    for (const submission of daftarSubmission) {
      if (submission.nilai === null || submission.waktuSelesai === null) continue;
      const tanggal = submission.waktuSelesai;
      const kunci = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, "0")}`;
      const posisi = posisiBulan.get(kunci);
      if (posisi === undefined) continue;
      rentangBulan[posisi].totalNilai += submission.nilai;
      rentangBulan[posisi].jumlah += 1;
    }

    return NextResponse.json({
      data: {
        trenNilai: rentangBulan.map((bulan) => ({
          label: bulan.label,
          nilai: bulan.jumlah ? Math.round((bulan.totalNilai / bulan.jumlah) * 100) / 100 : null,
          jumlah: bulan.jumlah,
        })),
      },
    });
  } catch (error) {
    return (
      tanganiErrorRbac(error) ??
      NextResponse.json({ pesan: "Terjadi kesalahan di server" }, { status: 500 })
    );
  }
}