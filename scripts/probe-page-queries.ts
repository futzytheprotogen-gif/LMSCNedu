import "dotenv/config";
import { db } from "../lib/db";

async function probe(label: string, operation: () => Promise<unknown>) {
  try {
    const result = await operation();
    console.log(`${label}: OK`, Array.isArray(result) ? `rows=${result.length}` : "completed");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : "Unknown error";
    console.log(`${label}: FAILED - ${message}`);
    return null;
  }
}

async function main() {
  await probe("jurusan query", () =>
    db.jurusanAkademik.findMany({
      take: 1,
      include: { _count: { select: { rombel: true } } },
    })
  );
  await probe("rombel query", () =>
    db.rombelAkademik.findMany({
      take: 1,
      orderBy: [{ angkatan: "asc" }, { jurusan: { nama: "asc" } }, { variasi: "asc" }],
      include: {
        jurusan: { select: { id: true, nama: true } },
        _count: { select: { siswa: true } },
      },
    })
  );
  await probe("mapel query", () =>
    db.mataPelajaran.findMany({
      take: 1,
      include: {
        _count: { select: { guruPengampu: true, kelasGuru: true, asesmen: true } },
      },
    })
  );

  const member = await db.kelasSiswa.findFirst({ select: { siswaId: true } });
  if (member) {
    const memberships = await probe("student class query", () =>
      db.kelasSiswa.findMany({
        where: { siswaId: member.siswaId },
        select: { kelasId: true },
      })
    );
    if (memberships && Array.isArray(memberships)) {
      const kelasIds = memberships.map((item) => (item as { kelasId: string }).kelasId);
      if (kelasIds.length) {
        await probe("student task query", () =>
          db.tugasKelas.findMany({
            where: { kelasId: { in: kelasIds } },
            include: {
              kelas: { select: { id: true, judul: true } },
              tugas: {
                include: {
                  guru: { select: { id: true, nama: true } },
                  submission: {
                    where: { siswaId: member.siswaId },
                    select: { fileUrl: true, waktuKumpul: true, nilai: true, catatanNilai: true },
                  },
                },
              },
            },
            orderBy: { dikirimAt: "desc" },
          })
        );
      }
    }
  } else {
    console.log("student task query: skipped (no class membership)");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
