import { EmployeeSelector } from "@/components/EmployeeSelector";
import {
  getCurrentBinding,
  getCurrentUser,
  getEmployees,
} from "@/lib/employee-actions";
import { bindEmployee } from "./actions";

export default async function EmployeeBindingPage() {
  // 服务器端数据获取
  const user = await getCurrentUser();
  const employees = await getEmployees();
  const currentBinding = await getCurrentBinding(user.id);
  return (
    <EmployeeSelector
      employees={employees}
      currentBindingId={currentBinding?.employee_id}
      onSubmit={bindEmployee}
    />
  );
}
