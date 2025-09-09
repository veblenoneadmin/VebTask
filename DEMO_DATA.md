# Demo Data Setup

This project includes comprehensive mock data for demonstration purposes.

## Demo Accounts

The following demo accounts are available:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | `admin@demo.com` | `demo123` | Full system administrator |
| Manager | `manager@demo.com` | `demo123` | Project manager with staff privileges |
| Developer | `developer@demo.com` | `demo123` | Development team member |
| Client | `client@demo.com` | `demo123` | External client user |

## Demo Data Includes

### Organization
- **Demo Agency** - A sample consulting/development agency

### Clients (3)
- **TechCorp Inc** - High-priority technology client ($125/hr)
- **GreenLeaf Solutions** - Environmental consulting client ($95/hr)  
- **Retail Plus** - Retail industry prospect ($85/hr)

### Projects (3)
- **E-commerce Platform Redesign** - Active project (25% complete, $50K budget)
- **Mobile App Development** - Active project (15% complete, $75K budget)
- **Brand Identity Package** - Planning phase project ($15K budget)

### Tasks (6)
- Mix of completed, in-progress, and planned tasks
- Includes development, design, and planning activities
- Properly categorized with tags and priorities

### Time Logs
- ~15 historical time entries per user over the past month
- One active timer per user to demonstrate real-time tracking
- Mix of billable and non-billable time
- Various work categories (work, meeting, research)

### Additional Data
- **Calendar Events** - Meetings and project milestones
- **Expenses** - Software subscriptions, office supplies, client meals
- **Brain Dumps** - Sample project ideas and client feedback notes

## Running the Demo Data Seeder

To populate your database with demo data:

```bash
# Make sure your database is set up and migrated
npm run db:migrate

# Seed the demo data
npm run db:seed-demo
```

**⚠️ Warning:** This script will delete existing data in demo-related tables before seeding new data. Only run this on development databases.

## Using Demo Data

1. **Login** with any of the demo accounts above
2. **Switch between roles** to see different permission levels
3. **Explore features** like time tracking, project management, reporting
4. **View active timers** to see real-time functionality
5. **Check out different views** - dashboard, calendar, reports

## Development Notes

- All demo users have verified email addresses
- Passwords are properly hashed using bcrypt
- Time logs include realistic work patterns
- Projects show various stages of completion
- Expenses demonstrate different categories and approval states

The demo data is designed to showcase the full capabilities of VebTask while providing realistic scenarios for testing and demonstration purposes.