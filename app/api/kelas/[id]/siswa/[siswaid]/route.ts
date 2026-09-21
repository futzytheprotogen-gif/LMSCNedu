import { NextResponse } from "next/server";

export async function DELETE() {
	return NextResponse.json({ pesan: "Endpoint belum tersedia" }, { status: 501 });
}
