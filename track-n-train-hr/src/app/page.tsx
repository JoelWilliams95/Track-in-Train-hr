import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  // Check if user is already logged in
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("isLoggedIn")?.value === "true";
  const userName = cookieStore.get("userName")?.value;

  // Redirect based on authentication status
  if (isLoggedIn && userName) {
    redirect("/profiles");
  } else {
    redirect("/login");
  }

  return null;
}