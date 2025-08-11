"use server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Missing credentials.", success: false };
  }

  try {
    // Read users data directly from file instead of making HTTP request
    const usersPath = path.join(process.cwd(), "data", "users.json");

    // Check if users file exists
    if (!fs.existsSync(usersPath)) {
      return { error: "System error: User database not found.", success: false };
    }

    const usersData = fs.readFileSync(usersPath, "utf8");
    const users = JSON.parse(usersData);

    const user = users.find((u: any) => u.email === email);
    if (!user) {
      return { error: "Email not found.", success: false };
    }
    if (user.password !== password) {
      return { error: "Incorrect password.", success: false };
    }

    const cookieStore = await cookies();
    cookieStore.set("isLoggedIn", "true", { path: "/", httpOnly: false });
    cookieStore.set("userName", user.fullName, { path: "/", httpOnly: false });
    cookieStore.set("userRole", user.role, { path: "/", httpOnly: false });

    // Log successful login
    try {
      const logsPath = path.join(process.cwd(), "data", "logs.json");
      const logsDir = path.dirname(logsPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      if (!fs.existsSync(logsPath)) {
        fs.writeFileSync(logsPath, JSON.stringify([], null, 2));
      }

      const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
      const newLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        user: user.fullName,
        action: 'User Login',
        details: `User ${user.fullName} logged into the system`,
        category: 'LOGIN',
        severity: 'INFO'
      };

      logs.push(newLog);
      if (logs.length > 10000) {
        logs.splice(0, logs.length - 10000);
      }
      fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
    } catch (logError) {
      console.error('Failed to log login:', logError);
    }

    // Return success flag to indicate successful login
    return { success: true, error: "" };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Failed to process login. Please try again.", success: false };
  }
}