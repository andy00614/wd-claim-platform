import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface Employee {
  id: number;
  name: string;
  employee_code: number;
  department: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserBinding {
  id: number;
  user_id: string;
  employee_id: number;
  created_at: string | null;
  updated_at: string | null;
  employees: Employee;
}

// 获取当前用户
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

// 获取所有员工数据
export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("employee_code", { ascending: true });

  if (error) {
    console.error("获取员工数据失败:", error);
    return [];
  }

  return data || [];
}

// 获取用户当前绑定
export async function getCurrentBinding(
  userId: string,
): Promise<UserBinding | null> {
  const supabase = await createClient();

  // 首先查询绑定表
  const { data: bindingData, error: bindingError } = await supabase
    .from("user_employee_bindings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (bindingError && bindingError.code !== "PGRST116") {
    // PGRST116 = no rows found
    console.error("获取绑定状态失败:", bindingError);
    return null;
  }

  if (!bindingData) {
    return null;
  }

  // 然后查询员工信息
  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("*")
    .eq("id", bindingData.employee_id)
    .single();

  if (employeeError) {
    console.error("获取员工信息失败:", employeeError);
    return null;
  }

  if (!employeeData) {
    return null;
  }

  // 组合数据
  return {
    ...bindingData,
    employees: employeeData,
  } as UserBinding;
}
