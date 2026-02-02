// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message } = await req.json()

  const res = await fetch(`${process.env.BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })

  if (!res.ok) {
    return Response.json({ error: "Backend failed" }, { status: 500 })
  }

  return Response.json(await res.json())
}
