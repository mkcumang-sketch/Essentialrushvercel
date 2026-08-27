// app/actions/abandonedCarts.ts
'use server';

import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import { AbandonedCart } from '@/models/AbandonedCart';

export async function deleteAbandonedCart(id: string) {
  try {
    await connectDB();

    const objectId = new mongoose.Types.ObjectId(id);

    // ✅ FIX: Uses properly typed Model<IAbandonedCart> — no more ts(2349)
    const deletedCart = await AbandonedCart.findByIdAndDelete(objectId);

    if (!deletedCart) {
      return { success: false, message: 'Cart already deleted or not found in database.' };
    }

    revalidatePath('/Godmode/abandoned-carts');
    revalidatePath('/Godmode');

    return { success: true, message: 'Target destroyed successfully.' };

  } catch (error) {
    console.error('Vault Purge Error:', error);
    return { success: false, message: 'Server Error: Database deletion failed.' };
  }
}