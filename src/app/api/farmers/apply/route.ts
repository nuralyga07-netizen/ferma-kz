import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, phone, farm_name, city, products, experience, bio } =
      body;

    // Validate required fields
    if (!full_name || !phone || !farm_name || !city || !products) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Заполните все обязательные поля",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Необходимо авторизоваться",
        },
        { status: 401 }
      );
    }

    const { error } = await (supabase as any)
      .from("farmer_applications")
      .insert({
        user_id: session.user.id,
        full_name,
        phone,
        farm_name,
        city,
        products,
        experience: experience || null,
        bio: bio || null,
        status: "pending",
      });

    if (error) {
      console.error("Application insert error:", error);
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Ошибка при отправке заявки. Попробуйте позже.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { message: "Заявка успешно отправлена" },
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Farmer apply error:", error);
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
