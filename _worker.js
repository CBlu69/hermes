// cafe hermes — API روی Cloudflare Pages (حالت advanced) + دیتابیس D1
// نیازها: bindingی به اسم DB (D1) و secretی به اسم ADMIN_PIN (رمز ۶ رقمی پرسنل)

const MAX_FAILS = 5            // تعداد تلاش ناموفق
const LOCK_WINDOW = 10 * 60    // ثانیه: پنجره‌ی شمارش و مدت قفل
let ready = false

const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    })

async function ensureTables(db) {
    if (ready) return
    await db.batch([
        db.prepare('CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, unavailable INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0)'),
        db.prepare('CREATE TABLE IF NOT EXISTS pin_failures (at INTEGER NOT NULL)')
    ])
    ready = true
}

async function sha(s) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s))))
}

async function samePin(a, b) {
    const x = await sha(a), y = await sha(b)
    let d = 0
    for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]
    return d === 0
}

// true = رمز درست | false = رمز غلط | 'locked' = قفل موقت
async function checkPin(env, pin) {
    const now = Math.floor(Date.now() / 1000)
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM pin_failures WHERE at > ?').bind(now - LOCK_WINDOW).first()
    if (row && row.n >= MAX_FAILS) return 'locked'
    const ok = typeof pin === 'string' && /^\d{6}$/.test(pin) && await samePin(pin, env.ADMIN_PIN)
    if (!ok) {
        await env.DB.batch([
            env.DB.prepare('INSERT INTO pin_failures (at) VALUES (?)').bind(now),
            env.DB.prepare('DELETE FROM pin_failures WHERE at < ?').bind(now - 86400)
        ])
        return false
    }
    await env.DB.prepare('DELETE FROM pin_failures').run()
    return true
}

async function handleApi(request, env, url) {
    if (!env.DB) return json({ error: 'db-not-bound' }, 500)
    await ensureTables(env.DB)

    if (url.pathname === '/api/items' && request.method === 'GET') {
        const r = await env.DB.prepare('SELECT id FROM items WHERE unavailable = 1').all()
        return json({ unavailable: (r.results || []).map((x) => x.id) })
    }

    if (url.pathname === '/api/admin' && request.method === 'POST') {
        if (!env.ADMIN_PIN) return json({ error: 'pin-not-configured' }, 500)
        const origin = request.headers.get('origin')
        if (origin && origin !== url.origin) return json({ error: 'forbidden' }, 403)

        let body
        try { body = await request.json() } catch (e) { return json({ error: 'bad-json' }, 400) }

        const res = await checkPin(env, body && body.pin)
        if (res === 'locked') return json({ error: 'locked' }, 429)
        if (res !== true) return json({ ok: false }, 401)

        if (body.action === 'verify') return json({ ok: true })

        if (body.action === 'set') {
            const ids = body.ids
            if (!Array.isArray(ids) || ids.length < 1 || ids.length > 50 ||
                !ids.every((i) => typeof i === 'string' && /^[a-z0-9-]{1,40}$/.test(i)) ||
                typeof body.unavailable !== 'boolean') return json({ error: 'bad-input' }, 400)
            const now = Math.floor(Date.now() / 1000)
            const flag = body.unavailable ? 1 : 0
            await env.DB.batch(ids.map((id) =>
                env.DB.prepare('INSERT INTO items (id, unavailable, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET unavailable = excluded.unavailable, updated_at = excluded.updated_at')
                    .bind(id, flag, now)))
            return json({ ok: true })
        }
        return json({ error: 'bad-action' }, 400)
    }
    return json({ error: 'not-found' }, 404)
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url)
        if (url.pathname.startsWith('/api/')) {
            try { return await handleApi(request, env, url) } catch (e) { return json({ error: 'server-error' }, 500) }
        }
        return env.ASSETS.fetch(request)
    }
}
