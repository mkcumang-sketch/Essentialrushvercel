"use client";
import { useState } from "react";

export default function SalesDashboard() {
  const [id, setId] = useState("");
  const [data, setData] = useState<any>(null);

  const load = async () => {
    const res = await fetch(`/api/track?ref=${id}`);
    const json = await res.json();
    setData(json);
  };

  return (
    <div className="min-h-screen pt-32 px-6 font-serif max-w-5xl mx-auto text-black">
      {!data ? (
        <div className="text-center">
          <h1 className="text-3xl italic mb-6">Partner Access</h1>
          <input className="border-b-2 border-black p-2 text-center text-xl uppercase outline-none" placeholder="Enter Sales ID" onChange={e => setId(e.target.value)} />
          <button onClick={load} className="block mx-auto mt-6 bg-black text-white px-10 py-3 text-xs uppercase font-bold tracking-widest">Login</button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 shadow border-t-4 border-blue-500">
              <p className="text-xs text-gray-400 font-bold uppercase">Clicks</p>
              <p className="text-3xl font-bold">{data.stats.clicks}</p>
            </div>
            <div className="bg-white p-6 shadow border-t-4 border-yellow-500">
              <p className="text-xs text-gray-400 font-bold uppercase">In Cart</p>
              <p className="text-3xl font-bold">{data.stats.carts}</p>
            </div>
            <div className="bg-white p-6 shadow border-t-4 border-green-500">
              <p className="text-xs text-gray-400 font-bold uppercase">Sales</p>
              <p className="text-3xl font-bold">{data.stats.purchases}</p>
            </div>
            <div className="bg-white p-6 shadow border-t-4 border-black">
              <p className="text-xs text-gray-400 font-bold uppercase">Revenue</p>
              <p className="text-xl font-bold text-green-700">₹{data.stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <table className="w-full bg-white shadow border">
            <thead className="bg-gray-50 uppercase text-[10px] font-bold">
              <tr><th className="p-4">Time</th><th className="p-4">Action</th><th className="p-4">Product</th></tr>
            </thead>
            <tbody>
              {data.events.map((e: any, i: number) => (
                <tr key={i} className="border-t text-sm">
                  <td className="p-4 text-gray-500">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="p-4 font-bold uppercase">{e.eventType}</td>
                  <td className="p-4">{e.productTitle || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}