/**
 * Seed script — `npm run seed`.
 * Creates the demo user + Manali Mountain Convoy (members, chat, alerts,
 * notifications) in the configured store. In memory mode the server seeds
 * itself on boot, so this is mainly for MongoDB (MONGODB_URI set).
 */
import { initStore, seedStore } from './db'
import { DEMO_USER, SEED_TRIP } from './seedData'

async function main(): Promise<void> {
  const store = await initStore()
  const { user, trip } = await seedStore(store, { force: false })
  console.log(`[ridesync] seeded (mode: ${store.mode})`)
  console.log(`[ridesync] demo user: ${user.email} / ${DEMO_USER.password}`)
  console.log(`[ridesync] trip: ${trip.name} (${trip.id}) — code ${trip.code}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[ridesync] seed failed', err)
  process.exit(1)
})
