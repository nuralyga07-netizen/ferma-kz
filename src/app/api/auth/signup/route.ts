import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const signupSchema = z.object({
  email: z
    .string()
    .email("Введите корректный email")
    .min(1, "Email обязателен"),
  password: z
    .string()
    .min(6, "Пароль должен быть не менее 6 символов")
    .max(100),
  full_name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(100),
  role: z.enum(["customer", "farmer"], {
    message: "Роль должна быть 'customer' или 'farmer'",
  }),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: firstError?.message || "Ошибка валидации",
        },
        { status: 400 }
      );
    }

    const { email, password, full_name, role, phone } = parsed.data;

    const supabase = await createClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            full_name,
            role,
          },
        },
      }
    );

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: "Этот email уже зарегистрирован",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: signUpError.message,
        },
        { status: 400 }
      );
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Не удалось создать пользователя",
        },
        { status: 500 }
      );
    }

    // Create profile in the profiles table
    const { error: profileError } = await (supabase
      .from("profiles") as any)
      .insert({
        id: user.id,
        email,
        full_name,
        role,
        phone: phone || null,
        is_verified: false,
      });

    if (profileError) {
      // Log the error but don't fail — auth user was created
      console.error("Profile creation error:", profileError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name,
            role,
          },
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Внутренняя ошибка сервера",
      },
      { status: 500 }
    );
  }
}
