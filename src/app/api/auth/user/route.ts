import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Не авторизован",
        },
        { status: 401 }
      );
    }

    // Get profile data
    const { data: profile } = await (supabase
      .from("profiles") as any)
      .select("*")
      .eq("id", session.user.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: session.user.id,
            email: session.user.email,
            ...(profile || {}),
          },
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
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
