import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Materials
  console.log('📦 Seeding materials...')
  const materials = [
    { name: 'Aggregate 3/4"', size: '3/4"', category: 'Aggregate' },
    { name: 'Aggregate 1/2"', size: '1/2"', category: 'Aggregate' },
    { name: 'Aggregate 3/8"', size: '3/8"', category: 'Aggregate' },
    { name: 'Zero 3/16"', size: '3/16"', category: 'Aggregate' },
    { name: 'Micro 1/16', size: '1/16"', category: 'Aggregate' },
    { name: 'Powder', size: null, category: 'Fine Material' },
    { name: 'Oversize', size: null, category: 'Raw Material' },
    { name: '0-5mm', size: '0-5mm', category: 'Fine Aggregate' },
    { name: '2"', size: '2"', category: 'Aggregate' },
    { name: '1.5"', size: '1.5"', category: 'Aggregate' },
    { name: '1"', size: '1"', category: 'Aggregate' },
    { name: 'Sub-grade', size: null, category: 'Foundation Material' },
    { name: 'Subbase', size: null, category: 'Base Material' },
    { name: 'Sand', size: null, category: 'Fine Material' },
    { name: 'A1A', size: null, category: 'Special Material' },
    { name: 'Feed', size: null, category: 'Raw Material' },
  ]

  for (const material of materials) {
    await prisma.material.upsert({
      where: { name: material.name },
      update: {},
      create: material
    })
  }
  console.log(`✅ Created ${materials.length} materials`)

  // Seed Equipment
  console.log('🚜 Seeding equipment...')
  const equipment = [
    { name: 'Static Crusher No-1', type: 'Static Crusher' },
    { name: 'Static Crusher No-2', type: 'Static Crusher' },
    { name: 'Mobile Screen 7707', type: 'Mobile Crusher' },
    { name: 'Excavator', type: 'CAT' },
    { name: 'Front Loader', type: 'Shavol' },
    { name: 'Bulldozer', type: 'Bulldozer' },
    { name: 'Dumper', type: 'Dumper' },
    { name: 'Grader', type: 'Grader' },
    { name: 'Winch', type: 'Mechanical Device' },
  ]

  for (const eq of equipment) {
    await prisma.equipment.upsert({
      where: { name: eq.name },
      update: {},
      create: eq
    })
  }
  console.log(`✅ Created ${equipment.length} equipment`)

  // Seed Manpower Roles
  console.log('👷 Seeding manpower roles...')
  const roles = [
    { modelcode: 'EQUIP-DRV', name: 'Equipment Driver' },
    { modelcode: 'CRU-OP', name: 'Crusher Operator' },
    { modelcode: 'MAINT', name: 'Maintenance Worker' },
    { modelcode: 'SALES', name: 'Sales Representative' },
    { modelcode: 'OTHER', name: 'Other' },
  ]

  for (const role of roles) {
    await prisma.manpowerRole.upsert({
      where: { modelcode: role.modelcode },
      update: {},
      create: role
    })
  }
  console.log(`✅ Created ${roles.length} manpower roles`)

  // Seed Operation Metrics
  console.log('📊 Seeding operation metrics...')
  const metrics = [
    { code: 'SEG-OP-NUM', name: 'Accepted Trucks', unit: 'Number' },
    { code: 'SEG-OP-TON', name: 'Accepted Trucks', unit: 'Ton' },
  ]

  for (const metric of metrics) {
    await prisma.operationMetric.create({
      data: metric
    })
  }
  console.log(`✅ Created ${metrics.length} operation metrics`)

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
