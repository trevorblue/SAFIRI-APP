import Anthropic from '@anthropic-ai/sdk'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
export const hasClaudeKey = Boolean(API_KEY)

const client = API_KEY
  ? new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true })
  : null

export async function parseExpenseWithClaude(text, members, tripStartDate) {
  if (!client) return null

  const today = new Date().toISOString().split('T')[0]
  const memberList = members.length
    ? members.map(m => `${m.name} (id: ${m.id})`).join(', ')
    : 'none'

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are parsing a travel expense for a Kenya trip. Return ONLY valid JSON, no markdown, no explanation.

Input: "${text}"
Today: ${today}
Trip starts: ${tripStartDate}
Members: ${memberList}
Valid categories: food, drinks, transport, activities, accommodation, shopping, photography, tips, data, other

Category hints: nyama/choma/food/lunch/dinner/breakfast/restaurant = food | beer/wine/bar/tusker/pombe = drinks | uber/taxi/sgr/matatu/ferry/bolt = transport | entry/ticket/park/cruise/activity = activities | hotel/airbnb/lodge = accommodation | souvenir/shopping/kanga = shopping | photo/photographer = photography | tip = tips | airtime/data/safaricom = data

Return JSON: {"description":"clean name no amount or date","amount":800,"category":"food","date":"2026-07-04","paidBy":"member_id_or_null","isPreTrip":false}`,
    }],
  })

  const raw = msg.content[0]?.text?.trim()
  if (!raw) return null
  const clean = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean)
}
