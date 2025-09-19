export function GET() {
    return new Response('Hello from GET');
}

export async function POST(request: Request) {
    const data = await request.json();
    return Response.json({ 
        message: 'Hello from POST', 
        received: data 
    });
}