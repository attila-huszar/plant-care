import { seedUsers } from './seeds'

async function seed() {
  console.info('🌱 Starting database seed...')

  const users = await seedUsers()

  console.info('✅ Database seeded successfully!')
  console.info(users)
}

void (async () => {
  try {
    await seed()
    process.exit(0)
  } catch (error) {
    console.error('❌ Database seed failed:', error)
    process.exit(1)
  }
})()
