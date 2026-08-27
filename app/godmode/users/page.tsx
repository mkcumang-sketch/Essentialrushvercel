import connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";
import UsersClient from "./UserClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UsersAdminPage() {
  await connectDB();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  const serializedUsers = JSON.parse(JSON.stringify(users));

  return <UsersClient initialUsers={serializedUsers} />;
}