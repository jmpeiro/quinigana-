import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'QuiniGana API',
      version: process.env.npm_package_version || '1.0.0',
      description:
        'REST API for the QuiniGana football prediction platform. Covers authentication, groups, jornadas, proposals, challenges, leagues, gamification, and more.',
      contact: { name: 'QuiniGana Team' },
    },
    servers: [
      { url: '/api/v1', description: 'API v1' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ─── Shared ───────────────────────────────────
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        AppError: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
            requestId: { type: 'string', format: 'uuid' },
          },
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
            db: { type: 'boolean' },
            cache: { type: 'boolean' },
            uptime: { type: 'integer', description: 'Uptime in seconds' },
            version: { type: 'string' },
          },
        },
        CursorPaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            nextCursor: { type: 'string', nullable: true },
            prevCursor: { type: 'string', nullable: true },
            total: { type: 'integer' },
          },
        },
        // ─── Auth ─────────────────────────────────────
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        RegisterDto: {
          type: 'object',
          required: ['email', 'password', 'first_name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
          },
        },
        LoginDto: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        // ─── User ─────────────────────────────────────
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string', nullable: true },
            avatar_url: { type: 'string', nullable: true },
            auth_provider: { type: 'string', enum: ['local', 'google', 'both'] },
            email_verified: { type: 'boolean' },
            is_admin: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Group ────────────────────────────────────
        Group: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            avatar_url: { type: 'string', nullable: true },
            created_by: { type: 'integer' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateGroupDto: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
        // ─── Jornada ──────────────────────────────────
        Jornada: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            season: { type: 'string' },
            season_id: { type: 'integer', nullable: true },
            jornada_number: { type: 'integer' },
            status: { type: 'string', enum: ['open', 'closed', 'finished'] },
            deadline: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Challenge ────────────────────────────────
        Challenge: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            challenger_id: { type: 'integer' },
            challenged_id: { type: 'integer' },
            jornada_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] },
            wager_points: { type: 'integer' },
            winner_id: { type: 'integer', nullable: true },
            challenger_score: { type: 'integer', nullable: true },
            challenged_score: { type: 'integer', nullable: true },
            message: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateChallengeDto: {
          type: 'object',
          required: ['challenged_id', 'jornada_id', 'wager_points'],
          properties: {
            challenged_id: { type: 'integer' },
            jornada_id: { type: 'integer' },
            wager_points: { type: 'integer' },
            message: { type: 'string' },
          },
        },
        // ─── Notification ─────────────────────────────
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            link: { type: 'string', nullable: true },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Season ───────────────────────────────────
        Season: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            display_name: { type: 'string' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            is_current: { type: 'boolean' },
          },
        },
        // ─── Gamification ─────────────────────────────
        BadgeDefinition: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            category: { type: 'string' },
            tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
            xp_reward: { type: 'integer' },
          },
        },
        UserGamificationData: {
          type: 'object',
          properties: {
            xp: { type: 'integer' },
            level: { type: 'integer' },
            xpForCurrentLevel: { type: 'integer' },
            xpForNextLevel: { type: 'integer' },
            badges: { type: 'array', items: { type: 'object' } },
            unseenCount: { type: 'integer' },
          },
        },
        // ─── League ───────────────────────────────────
        LeagueDivision: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            tier: { type: 'integer' },
            icon: { type: 'string' },
            color: { type: 'string' },
          },
        },
        // ─── Proposal ─────────────────────────────────
        Proposal: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            group_id: { type: 'integer' },
            jornada_id: { type: 'integer' },
            proposed_by: { type: 'integer' },
            status: { type: 'string', enum: ['draft', 'pending', 'approved', 'rejected'] },
            title: { type: 'string', nullable: true },
            votes_for: { type: 'integer' },
            votes_against: { type: 'integer' },
          },
        },
        // ─── Stats / Export ───────────────────────────
        PersonalStats: {
          type: 'object',
          properties: {
            totalPoints: { type: 'integer' },
            totalJornadas: { type: 'integer' },
            accuracy1x2Percent: { type: 'number' },
            accuracyPlenoPercent: { type: 'number' },
          },
        },
        DashboardData: {
          type: 'object',
          properties: {
            activeJornada: { type: 'object', nullable: true },
            myGroups: { type: 'array', items: { type: 'object' } },
            latestResults: { type: 'array', items: { type: 'object' } },
            stats: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
