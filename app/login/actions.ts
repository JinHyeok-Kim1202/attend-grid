"use server";

import { signIn } from "@/auth";

type LoginFormState = {
  error: string;
};

function isRedirectError(error: unknown): error is Error & { digest: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export async function authenticate(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email: typeof email === "string" ? email : "",
      password: typeof password === "string" ? password : "",
      redirectTo: "/",
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "CredentialsSignin"
    ) {
        return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    if (error instanceof Error) {
      return { error: "로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요." };
    }

    throw error;
  }

  return { error: "" };
}
