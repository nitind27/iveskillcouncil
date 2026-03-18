# Franchise Institute Management System

A comprehensive, scalable franchise management system built with Next.js 14, Prisma, and MySQL.

## Features

- **Multi-role System**: Super Admin, Admin, Sub Admin (Franchise Owner), Student, Staff
- **Subscription Management**: Silver, Gold, Diamond plans with feature-based access
- **Franchise Management**: Complete CRUD operations with approval workflow
- **Student Management**: Enrollment, fee tracking, attendance
- **Course & Fee Management**: Plan-based course access and custom fee structures
- **Attendance System**: Manual and AI Face Recognition support
- **Certificate Workflow**: Request → Approve → Issue workflow
- **Staff Management**: Staff records and salary management
- **Payment Tracking**: Multiple payment modes with transaction history
- **Analytics Dashboard**: Real-time statistics and reports
- **Email Notifications**: Automated reminders and notifications

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (REST API)
- **Database**: MySQL 8+ with Prisma ORM
- **Authentication**: JWT (Access + Refresh Tokens)
- **Caching**: In-memory cache (Redis-ready for production)
- **Rate Limiting**: Built-in rate limiter
- **UI Components**: Custom components with Lucide icons

## Performance Optimizations

- **Caching**: API response caching with TTL
- **Rate Limiting**: Prevents API abuse
- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient data loading
- **Server Components**: Reduced client-side JavaScript
- **Revalidation**: Smart cache invalidation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MySQL 8+
- (Optional) Redis for production caching

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "project ek"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env
   ```
   Edit `.env` with your database credentials and other settings. See [SETUP.md](./SETUP.md) for a quick checklist.

4. **Set up the database**
   ```bash
   # Import the SQL schema
   mysql -u your_user -p franchise_institute < db/franchise_institute.sql
   
   # Or use Prisma
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── franchises/        # Franchise management
│   ├── students/          # Student management
│   └── ...
├── components/            # React components
│   ├── common/           # Reusable components
│   ├── dashboard/        # Dashboard components
│   ├── franchises/       # Franchise components
│   └── ...
├── lib/                  # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── cache.ts          # Caching layer
│   ├── rate-limit.ts     # Rate limiting
│   └── ...
├── prisma/               # Prisma schema
│   └── schema.prisma
└── db/                   # Database SQL files
    └── franchise_institute.sql
```

## API Routes

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Franchises
- `GET /api/franchises` - List franchises (with pagination)
- `POST /api/franchises` - Create new franchise
- `GET /api/franchises/[id]` - Get franchise details
- `PUT /api/franchises/[id]` - Update franchise
- `DELETE /api/franchises/[id]` - Delete franchise

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/[id]` - Get student details
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/[id]` - Get course details

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

### Certificates
- `GET /api/certificates` - List certificates
- `POST /api/certificates` - Request certificate
- `PUT /api/certificates/[id]` - Update certificate status

## Database Schema

The system uses the following main tables:
- `users` - User accounts with roles
- `franchises` - Franchise locations
- `subscription_plans` - Subscription plans (Silver, Gold, Diamond)
- `courses` - Course catalog
- `students` - Student enrollments
- `staff` - Staff members
- `attendance` - Attendance records
- `payments` - Payment transactions
- `certificates` - Certificate requests and issues
- `feedback` - Student feedback/complaints

## Role-Based Access Control

### Super Admin
- Manage subscription plans
- Approve/reject franchises
- Full system access

### Admin (Main Institute)
- Manage all franchises
- Generate certificates
- View all reports
- Global settings

### Sub Admin (Franchise Owner)
- Manage own franchise only
- Manage students and staff
- Track fees and attendance
- Request certificates

### Student
- View enrolled courses
- View fee status
- View attendance
- Submit feedback
- View certificates (read-only)

## Production Deployment

### Recommended Setup

1. **Database**: Use managed MySQL (AWS RDS, DigitalOcean, etc.)
2. **Caching**: Use Redis for distributed caching
3. **CDN**: Use CloudFlare or AWS CloudFront
4. **Load Balancing**: Use nginx or AWS ALB
5. **Monitoring**: Set up error tracking (Sentry, etc.)

### Environment Variables for Production

```env
DATABASE_URL="mysql://user:password@host:3306/franchise_institute"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
REDIS_URL="redis://your-redis-host:6379"
```

### Build for Production

```bash
npm run build
npm start
```

## Performance Features

- **Horizontal Scaling**: Stateless API design
- **Load Balancing**: Ready for multiple instances
- **Database Sharding**: Schema supports sharding by franchise_id
- **Caching**: Multi-layer caching strategy
- **CDN Ready**: Static assets optimized for CDN
- **Rate Limiting**: API protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
