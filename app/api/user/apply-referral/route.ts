export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import  connectDB from "@/lib/mongodb";
import User from "@/models/usertemp";

export async function POST(req: Request) {
    try {
        const { referralCodeUsed, currentUserId } = await req.json();
        await connectDB();

        // 1. Find the owner of the code (The Referrer) - SECURITY: Exclude sensitive fields
        const referrer = await User.findOne({ myReferralCode: referralCodeUsed.toUpperCase() }).select('-password -__v');
        
        if (!referrer) return Response.json({ error: "That referral code is not valid." }, { status: 404 });
        if (referrer._id.toString() === currentUserId) return Response.json({ error: "You cannot use your own code." }, { status: 400 });

        // 2. Give ₹100 to the Referrer (User A)
        referrer.walletPoints += 100;
        referrer.totalEarned += 100;
        
        // 3. Optional: Add a notification to the Referrer's schema
        referrer.notifications.push({
    title: "Referral Reward!",
    desc: "Someone used your code.",
    unread: true,
    time: new Date() // 🚀 Ye line add karni hai
});
        
        await referrer.save();

        // 4. Update the New User (User B) to track who referred them
        await User.findByIdAndUpdate(currentUserId, { referredBy: referralCodeUsed.toUpperCase() });

        return Response.json({ 
            success: true, 
            discount: 500, // User B gets ₹500 flat discount on current order
            message: "Referral saved! Your friend got their reward."
        });
    } catch (err) {
        return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
    }
}