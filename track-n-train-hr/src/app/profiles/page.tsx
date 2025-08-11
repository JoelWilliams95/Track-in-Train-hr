import ProfilesClient from "@/components/ProfilesClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getPersonnelRecords(limit = 50) {
  try {
    // Use the database adapter to get records (supports both JSON and MongoDB)
    const { PersonnelRecordService } = await import('@/services/database-adapter');
    const allRecords = await PersonnelRecordService.getAll();

    console.log('🔍 Server-side personnel records loaded:', allRecords.length);
    console.log('🔍 First record sample:', allRecords[0] ? {
      fullName: allRecords[0].fullName,
      zone: allRecords[0].zone,
      status: allRecords[0].status,
      hasId: !!allRecords[0]._id || !!allRecords[0].id
    } : 'No records');

    // Return only the first 'limit' records for initial load
    // This significantly reduces initial loading time
    return allRecords.slice(0, limit);
  } catch (error) {
    console.error("Error reading personnel records:", error);
    return [];
  }
}

export default async function ProfilesPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("isLoggedIn")?.value === "true";
  const userName = cookieStore.get("userName")?.value || "";

  // Redirect to login if not authenticated
  if (!isLoggedIn || !userName) {
    redirect("/login");
  }

  const personnelRecords = await getPersonnelRecords();

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", position: "relative" }}>
      <ProfilesClient personnelRecords={personnelRecords} userName={userName} />
    </main>
  );
}
