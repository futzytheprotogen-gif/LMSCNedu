"use client";

import { useParams } from "next/navigation";
import { DetailKelasAdminTier } from "@/components/AdminTierViews";

export default function HalamanDetailKelasKepsek() {
  const { id } = useParams<{ id: string }>();
  return <DetailKelasAdminTier peran="Kepsek" awalan="/kepsek" id={id} />;
}