export default async function SuccessPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const { id } = await params;
    
    return (
        <div className="h-screen bg-[#050505] flex items-center justify-center text-[#D4AF37]">
            <h1 className="text-2xl font-serif">ORDER {id} SECURED</h1>
        </div>
    );
}