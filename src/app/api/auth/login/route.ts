import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Email и пароль обязательны",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: "Неверный email или пароль",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: error.message,
        },
        { status: 400 }
      );
    }

    // Get profile data
    const { data: profile } = await (supabase
      .from("profiles") as any)
      .select("*")
      .eq("id", data.user.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            ...(profile || {}),
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
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
