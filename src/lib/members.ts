import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Member = Tables<"members">;

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw new Error(`회원 목록 조회 실패: ${error.message}`);
  return data;
}

export async function getMember(id: number): Promise<Member | null> {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`회원 조회 실패: ${error.message}`);
  return data;
}
