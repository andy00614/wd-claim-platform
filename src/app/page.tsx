import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  let redirectPath: string | null = null;

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in, go to login
    redirectPath = "/login";
  } else {
    // Check if employee is bound
    try {
      const employeeResult = await getCurrentEmployee();
      console.log("employeeResult", employeeResult);

      if (!employeeResult.success || !employeeResult.data) {
        // Logged in but no employee bound, go to binding
        console.log("No employee bound, redirecting to binding");
        redirectPath = "/binding";
      } else {
        // User is logged in and has employee bound, go to claims
        redirectPath = "/claims";
      }
    } catch (error) {
      console.log("Error getting employee info", error);
      // Error getting employee info, go to binding
      redirectPath = "/binding";
    } finally {
      // Clear resources if needed
      if (redirectPath) {
        redirect(redirectPath);
      }
    }
  }

  // Handle the case where user is not logged in
  if (redirectPath) {
    redirect(redirectPath);
  }

  // This should never be reached
  return null;
}
