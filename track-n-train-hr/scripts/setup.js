#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

console.log('🚀 Setting up Track-in-Train HR system...')

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir)
  console.log('📁 Created data directory')
}

// Default admin user
async function createDefaultUsers() {
  const usersFile = path.join(dataDir, 'users.json')
  
  if (fs.existsSync(usersFile)) {
    console.log('👤 Users file already exists, skipping user creation')
    return
  }

  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const hrPassword = await bcrypt.hash('Hr123!', 10)

  const defaultUsers = [
    {
      id: 'user-1',
      fullName: 'System Administrator',
      email: 'admin@company.com',
      password: adminPassword,
      role: 'SuperAdmin',
      zone: 'All',
      position: 'System Administrator',
      phoneNumber: '+1234567890',
      address: 'Head Office',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-2',
      fullName: 'HR Manager',
      email: 'hr@company.com',
      password: hrPassword,
      role: 'HR',
      zone: 'Textile',
      position: 'HR Manager',
      phoneNumber: '+1234567891',
      address: 'HR Department',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]

  fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2))
  console.log('👤 Created default users:')
  console.log('   📧 admin@company.com / Admin123! (SuperAdmin)')
  console.log('   📧 hr@company.com / Hr123! (HR)')
}

// Sample personnel records
function createSamplePersonnel() {
  const personnelFile = path.join(dataDir, 'personnelRecords.json')
  
  if (fs.existsSync(personnelFile)) {
    console.log('👥 Personnel file already exists, skipping personnel creation')
    return
  }

  const samplePersonnel = [
    {
      id: 'personnel-1',
      fullName: 'Ahmed Bennani',
      cin: 'BK123456',
      address: '123 Rue Mohammed V, Tangier',
      zone: 'Textile',
      subZone: 'Production',
      poste: 'Machine Operator',
      trajectoryCode: 'T001',
      phoneNumber: '+212612345678',
      status: 'Employed',
      photoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin@company.com',
      comments: [
        {
          id: 'comment-1',
          author: 'HR Manager',
          text: 'Excellent performance during training period.',
          date: new Date().toISOString(),
          mentionedUsers: []
        }
      ],
      recruitDate: '2024-01-15',
      technicalTrainingCompleted: true,
      theoreticalTrainingCompleted: true,
      validationDate: '2024-02-01'
    },
    {
      id: 'personnel-2',
      fullName: 'Fatima El Mansouri',
      cin: 'FM789012',
      address: '456 Avenue Atlas, Tangier',
      zone: 'Logistics',
      subZone: 'Warehouse',
      poste: 'Inventory Coordinator',
      trajectoryCode: 'L002',
      phoneNumber: '+212623456789',
      status: 'In-Training',
      photoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'hr@company.com',
      comments: [],
      recruitDate: '2024-01-20',
      technicalTrainingCompleted: true,
      theoreticalTrainingCompleted: false
    },
    {
      id: 'personnel-3',
      fullName: 'Hassan Alami',
      cin: 'HA345678',
      address: '789 Quartier Industriel, Tangier',
      zone: 'Maintenance',
      subZone: 'Technical',
      poste: 'Maintenance Technician',
      trajectoryCode: 'M001',
      phoneNumber: '+212634567890',
      status: 'Waiting for test',
      photoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin@company.com',
      comments: [
        {
          id: 'comment-2',
          author: 'System Administrator',
          text: 'Ready for final evaluation. @HR please schedule test.',
          date: new Date().toISOString(),
          mentionedUsers: ['HR Manager']
        }
      ],
      recruitDate: '2024-01-10',
      technicalTrainingCompleted: true,
      theoreticalTrainingCompleted: true,
      testDay: '2024-01-25'
    },
    {
      id: 'personnel-4',
      fullName: 'Youssef Tazi',
      cin: 'YT901234',
      address: '321 Rue de la Plage, Tangier',
      zone: 'Transport',
      subZone: 'Drivers',
      poste: 'Bus Driver',
      trajectoryCode: 'T003',
      phoneNumber: '+212645678901',
      status: 'Recruit',
      photoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'hr@company.com',
      comments: [],
      recruitDate: new Date().toISOString().slice(0, 10),
      technicalTrainingCompleted: false,
      theoreticalTrainingCompleted: false
    }
  ]

  fs.writeFileSync(personnelFile, JSON.stringify(samplePersonnel, null, 2))
  console.log('👥 Created sample personnel records (4 entries)')
}

// Empty notifications file
function createNotificationsFile() {
  const notificationsFile = path.join(dataDir, 'notifications.json')
  
  if (!fs.existsSync(notificationsFile)) {
    fs.writeFileSync(notificationsFile, JSON.stringify([], null, 2))
    console.log('🔔 Created notifications file')
  }
}

// Empty logs file
function createLogsFile() {
  const logsFile = path.join(dataDir, 'logs.json')
  
  if (!fs.existsSync(logsFile)) {
    const initialLog = {
      id: 'log-1',
      user: 'System',
      action: 'System Setup',
      details: 'Initial system setup completed',
      target: 'System',
      category: 'OTHER',
      severity: 'INFO',
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    }
    
    fs.writeFileSync(logsFile, JSON.stringify([initialLog], null, 2))
    console.log('📝 Created logs file with initial entry')
  }
}

// Zone configuration
function createZoneConfig() {
  const configDir = path.join(process.cwd(), 'config')
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir)
  }

  const zonesFile = path.join(configDir, 'zones.json')
  
  if (!fs.existsSync(zonesFile)) {
    const zones = {
      zones: [
        {
          name: 'Textile',
          subZones: ['Production', 'Quality Control', 'Packaging', 'Storage'],
          description: 'Textile manufacturing and processing'
        },
        {
          name: 'Logistics',
          subZones: ['Warehouse', 'Shipping', 'Receiving', 'Inventory'],
          description: 'Supply chain and logistics operations'
        },
        {
          name: 'Maintenance',
          subZones: ['Technical', 'Electrical', 'Mechanical', 'Preventive'],
          description: 'Equipment maintenance and technical support'
        },
        {
          name: 'Transport',
          subZones: ['Drivers', 'Dispatchers', 'Mechanics', 'Coordinators'],
          description: 'Transportation and fleet management'
        },
        {
          name: 'Administration',
          subZones: ['HR', 'Finance', 'IT', 'Management'],
          description: 'Administrative and support functions'
        }
      ],
      defaultPositions: [
        'Machine Operator',
        'Quality Inspector',
        'Warehouse Worker',
        'Forklift Operator',
        'Maintenance Technician',
        'Electrician',
        'Bus Driver',
        'Dispatcher',
        'Supervisor',
        'Team Lead',
        'Manager',
        'Administrator'
      ]
    }
    
    fs.writeFileSync(zonesFile, JSON.stringify(zones, null, 2))
    console.log('🏭 Created zone configuration')
  }
}

// Create environment template
function createEnvironmentTemplate() {
  const envFile = path.join(process.cwd(), '.env.example')
  
  const envContent = `# Database Configuration
DATABASE_TYPE=json
# MONGODB_URI=mongodb://localhost:27017/track-in-train-hr

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Google Maps (optional)
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Security
# JWT_SECRET=your-super-secure-jwt-secret
# ENCRYPTION_KEY=your-32-character-encryption-key

# Email (optional)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-password
`

  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, envContent)
    console.log('📄 Created .env.example file')
  }
}

// Main setup function
async function setup() {
  try {
    console.log('')
    await createDefaultUsers()
    createSamplePersonnel()
    createNotificationsFile()
    createLogsFile()
    createZoneConfig()
    createEnvironmentTemplate()
    
    console.log('')
    console.log('✅ Setup completed successfully!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Copy .env.example to .env.local and configure your settings')
    console.log('2. Run "npm run dev" to start the development server')
    console.log('3. Visit http://localhost:3000 and log in with admin@company.com')
    console.log('')
    console.log('🔐 Default credentials:')
    console.log('   SuperAdmin: admin@company.com / Admin123!')
    console.log('   HR Manager: hr@company.com / Hr123!')
    console.log('')
    console.log('⚠️  Remember to change default passwords after first login!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup
setup()
