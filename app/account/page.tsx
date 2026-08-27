import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import User from "@/models/usertemp";
import { Order } from "@/models/Order";
import AccountClient from "@/components/AccountClient";

export default async function PremiumAccountDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  await connectDB();

  // 🚀 FIX: Database query chalane se pehle models ko cast karo
  const UserModel = User as mongoose.Model<any>;
  const OrderModel = Order as mongoose.Model<any>;

  const userEmail = session.user.email;  
  
  // 🚀 FIX: `User` ki jagah `UserModel` use kiya
  let dbUser = await UserModel.findOne({ email: userEmail });

  if (!dbUser) {
    redirect("/login");
  }

  // 🌟 UNIQUE REFERRAL CODE GENERATOR
  if (!dbUser.myReferralCode) {
      const firstName = (dbUser.name || "VIP").split(" ")[0].toUpperCase().replace(/[^A-Z]/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000); 
      
      dbUser.myReferralCode = `${firstName}-${randomNum}`; 
      await dbUser.save(); 
      console.log(`Generated new unique code for ${dbUser.email}: ${dbUser.myReferralCode}`);
  }

  const userPhone = (session.user as any).phone;
  const userId = dbUser._id.toString(); 

  const query: any = {
    $or: [
      { userId: userId },
      { "customer.email": userEmail },
      { "customerEmail": userEmail }, 
      { "shippingAddress.email": userEmail } 
    ]
  };

  if (userPhone) {
    query.$or.push({ "customer.phone": userPhone });
    query.$or.push({ "customerPhone": userPhone });
  }

  // 🚀 FIX: `Order` ki jagah `OrderModel` use kiya
  const orders = await OrderModel.find(query)
    .sort({ createdAt: -1 })
    .lean() as any[];

  const dashData = {
    walletPoints: dbUser?.walletBalance || 0, // Using real wallet balance
    totalSpent: orders.reduce((acc: any, o: any) => acc + (o.totalAmount || 0), 0),
    loyaltyTier: dbUser?.loyaltyTier || "Silver Vault",
    myReferralCode: dbUser?.myReferralCode, 
    orders: orders.map(o => ({ 
      ...o, 
      _id: o._id.toString(),
      createdAt: o.createdAt?.toISOString() 
    }))
  };

  return (
    <AccountClient 
      initialData={JSON.parse(JSON.stringify(dashData))} 
      session={JSON.parse(JSON.stringify(session))}
    />
  );
}