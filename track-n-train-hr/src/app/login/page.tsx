import LoginFormClient from "./LoginFormClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // Check if user is already logged in
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("isLoggedIn")?.value === "true";
  const userName = cookieStore.get("userName")?.value;

  // If already logged in with valid session, redirect to profiles
  if (isLoggedIn && userName) {
    redirect("/profiles");
  }

  return (
    <div className="flex items-center justify-center transition-colors login-page-background">
      {/* Optional overlay for better form visibility */}
      <div className="login-page-overlay" />

      <div style={{
        marginTop: '20px',
        marginRight: '20px',
        marginBottom: '20px',
        marginLeft: '20px',
        position: 'relative',
        zIndex: 2
      }}>
        <LoginFormClient />
      </div>
    </div>
  );
}