import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const webhookUrl = process.env.DISCORD_SUBMISSIONS_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Missing Discord webhook URL" },
      { status: 500 }
    )
  }

  const body = await request.json()
  const isWr =
  body.projectedRank === 1 ||
  String(body.projectedRank)
    .split("/")
    .some((rank) => Number(rank) === 1)

  const message = isWr
    ? [
        `**New WR Alert!** (${body.date ?? ""}) <@&1509616371774787635>`,
        `${body.player} just got a new WR of **${body.time}** on ${body.map} ${body.category}!`,
        `Projected Rank: **${body.projectedRank}**`,
        `Watch the run here: ${body.proof}`,
      ].join("\n")
    : [
        `**New PB Alert!** (${body.date ?? ""})`,
        `${body.player} just got a new PB of **${body.time}** on ${body.map} ${body.category}!`,
        `Projected Rank: **${body.projectedRank}**`,
        `Watch the run here: ${body.proof}`,
      ].join("\n")

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
  content: message,
  allowed_mentions: {
    roles: ["1509616371774787635"],
  },
}),
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to send Discord message" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}