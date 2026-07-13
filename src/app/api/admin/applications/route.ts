import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, data: null, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const profileQuery = await (supabase
      .from("profiles") as any)
      .select("role")
      .eq("id", session.user.id)
      .single();
    const profile = profileQuery.data;

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Доступ запрещён" },
        { status: 403 }
      );
    }

    const { data, error } = await (supabase
      .from("farmer_applications") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch applications error:", error);
      return NextResponse.json(
        { success: false, data: null, error: "Ошибка загрузки заявок" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin applications GET error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "id и status обязательны",
        },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Статус должен быть 'approved' или 'rejected'",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, data: null, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const profileQuery = await (supabase
      .from("profiles") as any)
      .select("role")
      .eq("id", session.user.id)
      .single();
    const profile = profileQuery.data;

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Доступ запрещён" },
        { status: 403 }
      );
    }

    // Update the application status
    const { error: updateError } = await (supabase
      .from("farmer_applications") as any)
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("Update application error:", updateError);
      return NextResponse.json(
        { success: false, data: null, error: "Ошибка обновления заявки" },
        { status: 500 }
      );
    }

    // If approved, update the user's role to farmer
    if (status === "approved") {
      const appQuery = await (supabase
        .from("farmer_applications") as any)
        .select("user_id")
        .eq("id", id)
        .single();
      const application = appQuery.data;

      if (application?.user_id) {
        await (supabase
          .from("profiles") as any)
          .update({ role: "farmer" })
          .eq("id", application.user_id);
      }
    }

    return NextResponse.json(
      { success: true, data: { message: "Статус обновлён" }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin applications PATCH error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
