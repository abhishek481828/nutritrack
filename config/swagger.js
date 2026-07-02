const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'NutriTrack API Reference',
    version: '1.0.0',
    description: 'AI-Powered Full-Stack Nutrition Tracking Application API endpoints, payload schemas, and authentications.',
  },
  servers: [
    {
      url: '/api',
      description: 'Local development server API route prefix',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT authorization token in the format: Bearer <token>',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Detailed error explanation string.' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '60c72b2f9b1d8b001c3d4f5a' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@example.com' },
          age: { type: 'integer', example: 28 },
          weight: { type: 'number', example: 75.5 },
          height: { type: 'number', example: 178 },
          gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
          activityLevel: { type: 'string', enum: ['sedentary', 'moderate', 'active'], example: 'moderate' },
          goal: { type: 'string', enum: ['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy'], example: 'maintain' },
        },
      },
      Food: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '60c72b2f9b1d8b001c3d4f5b' },
          name: { type: 'string', example: 'Chicken Breast' },
          calories: { type: 'number', example: 165 },
          protein: { type: 'number', example: 31 },
          carbs: { type: 'number', example: 0 },
          fat: { type: 'number', example: 3.6 },
          servingSize: { type: 'string', example: '100g' },
          category: { type: 'string', example: 'lunch' },
          type: { type: 'string', enum: ['veg', 'non-veg'], example: 'non-veg' },
        },
      },
      FoodLog: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '60c72b2f9b1d8b001c3d4f5c' },
          userId: { type: 'string', example: '60c72b2f9b1d8b001c3d4f5a' },
          foodId: { type: 'string', example: '60c72b2f9b1d8b001c3d4f5b' },
          foodName: { type: 'string', example: 'Chicken Breast' },
          calories: { type: 'number', example: 165 },
          protein: { type: 'number', example: 31 },
          carbs: { type: 'number', example: 0 },
          fats: { type: 'number', example: 3.6 },
          quantity: { type: 'number', example: 1.5 },
          mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snacks'], example: 'lunch' },
          date: { type: 'string', format: 'date', example: '2026-07-02' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'securePassword123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation constraints failed or email address already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate an existing user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'securePassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credential payload values',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Retrieve currently authorized user info details',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile object loaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized, invalid or expired security tokens',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/profile': {
      put: {
        summary: 'Update biometrics or nutrition goals of authorized user',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe Jr' },
                  age: { type: 'integer', example: 29 },
                  weight: { type: 'number', example: 76.2 },
                  height: { type: 'number', example: 178 },
                  gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
                  activityLevel: { type: 'string', enum: ['sedentary', 'moderate', 'active'], example: 'moderate' },
                  goal: { type: 'string', enum: ['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy'], example: 'lose_weight' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile fields updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid input parameters or metrics constraints failed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/foods': {
      get: {
        summary: 'Get all user-created and default food entries in registry',
        tags: ['Foods'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of foods retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Food' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Register a new food template record',
        tags: ['Foods'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'calories', 'protein', 'carbs', 'fat'],
                properties: {
                  name: { type: 'string', example: 'Brown Rice' },
                  calories: { type: 'number', example: 111 },
                  protein: { type: 'number', example: 2.6 },
                  carbs: { type: 'number', example: 23 },
                  fat: { type: 'number', example: 0.9 },
                  servingSize: { type: 'string', example: '100g' },
                  category: { type: 'string', example: 'lunch' },
                  type: { type: 'string', enum: ['veg', 'non-veg'], example: 'veg' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Food created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Food' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid input metrics or food label already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/foods/search': {
      get: {
        summary: 'Search foods registry by text matching query',
        tags: ['Foods'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            description: 'Word keyword search (e.g. chick)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'List of matching foods',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Food' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/food-logs': {
      get: {
        summary: 'Retrieve logged foods and macro consumption totals for a date',
        tags: ['Food Logs'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'date',
            in: 'query',
            required: false,
            description: 'Format YYYY-MM-DD (Defaults to current calendar day)',
            schema: { type: 'string', example: '2026-07-02' },
          },
        ],
        responses: {
          200: {
            description: 'Entries and totals calculated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    entries: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FoodLog' },
                    },
                    totals: {
                      type: 'object',
                      properties: {
                        totalCalories: { type: 'number', example: 247.5 },
                        totalProtein: { type: 'number', example: 46.5 },
                        totalCarbs: { type: 'number', example: 0 },
                        totalFat: { type: 'number', example: 5.4 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Add a new meal entry to user food logs',
        tags: ['Food Logs'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['foodName', 'calories'],
                properties: {
                  foodId: { type: 'string', description: 'Reference ID of food registry entry (optional)', example: '60c72b2f9b1d8b001c3d4f5b' },
                  foodName: { type: 'string', description: 'Used to lookup or register a new reusable food item', example: 'Chicken Breast' },
                  calories: { type: 'number', example: 165 },
                  protein: { type: 'number', example: 31 },
                  carbs: { type: 'number', example: 0 },
                  fats: { type: 'number', example: 3.6 },
                  quantity: { type: 'number', default: 1, example: 1.5 },
                  mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snacks'], example: 'lunch' },
                  date: { type: 'string', format: 'date', example: '2026-07-02' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Log entry created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/FoodLog' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Required validation inputs missing',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/food-logs/{id}': {
      put: {
        summary: 'Update portions quantity or meal category of a logged entry',
        tags: ['Food Logs'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'MongoDB unique identifier of the food log entry',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  quantity: { type: 'number', example: 2.0 },
                  mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snacks'], example: 'dinner' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Log entry updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/FoodLog' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Log entry id not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
      delete: {
        summary: 'Delete a meal entry from user logs',
        tags: ['Food Logs'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'MongoDB unique identifier of the food log entry',
          },
        ],
        responses: {
          200: {
            description: 'Log entry deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Food log deleted successfully.' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Log entry id not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/upload': {
      post: {
        summary: 'Upload and analyze meal photo using AI Vision engine',
        tags: ['Upload / Image Recognition'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (JPEG, PNG, WEBP, up to 5MB)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Meal analysis parameters generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        imageUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/v1/...' },
                        foodName: { type: 'string', example: 'Grilled Salmon with Broccoli' },
                        calories: { type: 'number', example: 380 },
                        macros: {
                          type: 'object',
                          properties: {
                            protein: { type: 'number', example: 42 },
                            carbs: { type: 'number', example: 12 },
                            fat: { type: 'number', example: 18 },
                          },
                        },
                        isApproximation: { type: 'boolean', example: true },
                        isNonFood: { type: 'boolean', example: false },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'No image uploaded or invalid binary stream format',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/chat': {
      post: {
        summary: 'Standard chatbot conversation request (Rule-based matching)',
        tags: ['Chat Assistant'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'What is a calorie?' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Chatbot text response generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    reply: { type: 'string', example: 'Calories represent units of energy...' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/chat/ai': {
      post: {
        summary: 'Interactive context-aware AI chat response (looks up user metrics + recent food logs)',
        tags: ['Chat Assistant'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'How is my protein intake doing today?' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'AI text response generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    reply: { type: 'string', example: 'Based on your logs, you have consumed 46g of protein...' },
                    isFallback: { type: 'boolean', example: false },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/reports/weekly': {
      get: {
        summary: 'Download a weekly PDF summary document of log entries',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'PDF report generated successfully',
            headers: {
              'Content-Type': {
                schema: { type: 'string', example: 'application/pdf' },
              },
              'Content-Disposition': {
                schema: { type: 'string', example: 'attachment; filename=weekly-nutrition-report.pdf' },
              },
            },
          },
          401: {
            description: 'Unauthorized access token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

module.exports = { setupSwagger };
