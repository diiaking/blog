"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";

export type ActionState = {
  ok: boolean;
  message: string;
} | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNIQUE_VIOLATION = "23505";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readId(formData: FormData) {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validate(email: string, name: string): string | null {
  if (!email || !name) return "이메일과 이름을 모두 입력해 주세요.";
  if (!EMAIL_PATTERN.test(email)) return "이메일 형식이 올바르지 않아요.";
  if (name.length > 50) return "이름은 50자 이하로 입력해 주세요.";
  return null;
}

export async function createMember(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = readText(formData, "email").toLowerCase();
  const name = readText(formData, "name");

  const invalid = validate(email, name);
  if (invalid) return { ok: false, message: invalid };

  const { error } = await supabaseAdmin.from("members").insert({ email, name });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, message: "이미 가입된 이메일이에요." };
    }
    return { ok: false, message: `회원 추가 실패: ${error.message}` };
  }

  revalidatePath("/members");
  return { ok: true, message: "회원을 추가했어요." };
}

export async function updateMember(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);
  const email = readText(formData, "email").toLowerCase();
  const name = readText(formData, "name");

  if (!id) return { ok: false, message: "잘못된 회원 ID예요." };

  const invalid = validate(email, name);
  if (invalid) return { ok: false, message: invalid };

  const { data, error } = await supabaseAdmin
    .from("members")
    .update({ email, name })
    .eq("id", id)
    .select("id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, message: "다른 회원이 이미 쓰고 있는 이메일이에요." };
    }
    return { ok: false, message: `회원 수정 실패: ${error.message}` };
  }
  if (data.length === 0) return { ok: false, message: "해당 회원을 찾을 수 없어요." };

  revalidatePath("/members");
  return { ok: true, message: "회원 정보를 수정했어요." };
}

export async function deleteMember(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);
  if (!id) return { ok: false, message: "잘못된 회원 ID예요." };

  const { data, error } = await supabaseAdmin
    .from("members")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, message: `회원 삭제 실패: ${error.message}` };
  if (data.length === 0) return { ok: false, message: "해당 회원을 찾을 수 없어요." };

  revalidatePath("/members");
  return { ok: true, message: "회원을 삭제했어요." };
}
