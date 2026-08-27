export default function CheckoutBox({ total }: { total: number }) {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm border border-[#F5F2ED] sticky top-32">
      <h3 className="text-xl font-bold mb-6 italic border-b border-[#F9F7F2] pb-4">Secure Checkout</h3>
      <div className="space-y-4 mb-8">
        <div className="flex justify-between text-zinc-500 text-sm italic"><span>Subtotal</span> <span>₹{total.toLocaleString()}</span></div>
        <div className="flex justify-between text-zinc-500 text-sm italic"><span>Shipping</span> <span className="text-green-600 font-bold uppercase text-[10px]">Complimentary</span></div>
        <div className="border-t pt-4 flex justify-between text-2xl font-black">
          <span>Total</span>
          <span>₹{total.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Razorpay Trigger Button */}
      <button className="w-full bg-[#C9A24D] text-white py-5 rounded-full font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all duration-500">
        Proceed to Secure Payment
      </button>
      
      <div className="mt-6 flex justify-center gap-4 grayscale opacity-40">
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" className="h-4" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" />
      </div>
    </div>
  );
}