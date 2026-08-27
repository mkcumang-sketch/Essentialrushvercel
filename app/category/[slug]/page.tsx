// Example for any dynamic page
export default async function DynamicPage({ 
    params 
}: { 
    params: Promise<{ slug: string }> // 🚨 Params type updated
}) {
    const { slug } = await params; // 🚨 Await before use
    
    // Tera fetching logic yahan aayega
    return (
        <div>Data for slug: {slug}</div>
    );
}