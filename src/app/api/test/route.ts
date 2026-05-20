import { testDeepAgent } from "@/lib/deepAgent/deepAgent";
import { edit_file, glob, grep, ls, read_file, write_file } from "@/lib/deepAgent/fsTools";
import { read_todos, update_todos, write_todos } from "@/lib/deepAgent/todoTools";
import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memo/MemoryAgent";
import { MemoryManager } from "@/lib/memo/MemoryManger";
import { queryMultiVector, testDocEmbeddingMultiVector } from "@/lib/memo/stores/multi-vector";
import { write } from "fs";
import { NextResponse } from "next/server";
import path from "path";

// export async function GET(req: Request) {
//     try {
//         const rootDir = process.cwd();
//         const fullRootDir = path.resolve(rootDir, 'public', 'memory')
//         const memoManager = new MemoryManager(fullRootDir)
//         memoManager.init()

//         return NextResponse.json({ msg: "h1" })
//     } catch (error) {

//     }
// }

// export async function POST(req: Request) {
//     try {
//         const rootDir = process.cwd();
//         const fullRootDir = path.resolve(rootDir, 'public', 'memory')
//         const memoManager = new MemoryManager(fullRootDir)
//         memoManager.init()

//         memoManager.logInteraction("User", "Hello, I'm chandan")

//         memoManager.logInteraction("Assistant", "How can I help you today")

//         return NextResponse.json({ msg: "h1" })
//     } catch (error) {

//     }
// }

// export async function PATCH(req: Request) {
//     try {
//         const rootDir = process.cwd();
//         const fullRootDir = path.resolve(rootDir, 'public', 'memory')
//         const memoManager = new MemoryManager(fullRootDir)
//         memoManager.init()

//         memoManager.logToArchive("User", "Hello, I'm chandan")

//         memoManager.logToArchive("Assistant", "How can I help you today")

//         return NextResponse.json({ msg: "h1" })
//     } catch (error) {

//     }
// }


// export async function GET(req: Request) {
//     try {
//         const llm = LLM.getInstance("openrouter")
//         const memoryAgent = await createMemoryAgent({
//             model: llm,
//         })

//         // const { assistantText } = await memoryAgent.run_agent('Hello')
//         // const { assistantText } = await memoryAgent.run_agent('What is my name?')
//         // const { assistantText } = await memoryAgent.run_agent('I am building a multi-agent AI system using LangGraph ,ollama and openrouter. My current issue is deciding when to use reasoning models versus reactive models.')
//         // const { assistantText } = await memoryAgent.run_agent('What architectural challenge am I currently facing?')
//         const { assistantText } = await memoryAgent.run_agent('What is my preferred programming language?')
//         // const { assistantText } = await memoryAgent.run_agent('My favorite database is PostgresSQL.');
//         // const { assistantText } = await memoryAgent.run_agent('Actually, I change my mind. My favorite databse is MongoDB noew.');
//         // const { assistantText } = await memoryAgent.run_agent('Which is my favourite database?');
//         // const { assistantText } = await memoryAgent.run_agent('Which is my favourite database?');
//         // const { assistantText } = await memoryAgent.run_agent('Which db i need to use for this project?');
// //         const { assistantText } = await memoryAgent.run_agent(`
// // I am designing an AI-powered essay grading system.
// // It includes three agents: generator, reflection and revision agent.
// // The generator writes the essay, the reflection agent critiques it,
// // and the revision agent improves it based on structured feedback.
// // My goal is to optimize convergence speed while minimizing token usage.
// // Please summarize this and remember my goal
// //         `);

//         return NextResponse.json({ msg: assistantText })
//     } catch (error) {

//         console.error('GET ---', error)
//     }
// }

// export async function GET(req: Request) {
//     try {
//         const res = await queryMultiVector({ query: 'Which is my favourite database?', userId: 'chan-memo-123009'})
//         return NextResponse.json({ msg: res })
//     } catch (error) {

//         console.error('GET ---', error)
//     }
// }



// export async function GET(req: Request) {
//     try {
//         const llm = LLM.getInstance('openrouter')

//         const inputs = {
//             filename: "rag-blog-workflow-001",
//             todos: [
//                 {
//                     task: "Research RAG architecture patterns in TypeScript",
//                     assigned_to: "researcher"
//                 },
//                 {
//                     task: "Create detailed blog outline",
//                     assigned_to: "planner",
//                     dependencies: ["research"] // temp key to identify dependency
//                 },
//                 {
//                     task: "Generate TypeScript code examples using LangChain",
//                     assigned_to: "typescript_expert",
//                     dependencies: ["research"]
//                 },
//                 {
//                     task: "Write SEO-optimized blog draft",
//                     assigned_to: "blog_writer",
//                     dependencies: ["create_outline", "generate_code"] // temp keys
//                 },
//                 {
//                     task: "Proofread and optimize for SEO",
//                     assigned_to: "blog_writer",
//                     dependencies: ["create_outline", "generate_code"] // temp keys
//                 }
//             ]
//         }

//         // const r = await write_todos.invoke(inputs)
//         // const r = await read_todos.invoke({ filename: "rag-blog-workflow-001.todos.json"})

//         const updateInput = {
//             filename: "rag-blog-workflow-001.todos.json",
//             updates: [
//                 {
//                     "id": "4e0c81e3-ac79-4fa3-9ec9-03cba6c9b47c",
//                     "status": "completed"
//                 },
//                 {
//                     "id": "4e7670ee-1a8d-4a0b-a4f4-0259a5c119bf",
//                     "status": "completed",
//                     "assigned_to": "senior_planner"
//                 },
//                 {
//                     "id": "13ef287a-d521-4454-b281-32e2b9c4bb84",
//                     "status": "in_progress"
//                 }
//             ]
//         }
//         const r = await update_todos.invoke(updateInput)

//         return NextResponse.json({
//             response: r
//         })
//     } catch (error: any) {
//         return NextResponse.json(
//             { error: error?.message },
//             { status: error?.status || 500 }
//         )
//     }
// }

// export async function GET(req: Request) {
//     try {
//         const llm = LLM.getInstance('openrouter')


//         // const r = await write_file.invoke({ filename: "hello.md", content: "hello world"})
//         // const r = await read_file.invoke({ filename: "hello.md", offset: 5, limit:6})
//         // const r = await edit_file.invoke({ filename: "hello.md", old_str: "hello", new_str: "everyone"})
//         // const r = await ls.invoke({ path: 'test' })
//         // const r = await grep.invoke({ pattern: 'world' })
//         const r = await glob.invoke({ pattern: '**/*.ts' })

//         return NextResponse.json({
//             response: r
//         })
//     } catch (error: any) {
//         return NextResponse.json(
//             { error: error?.message },
//             { status: error?.status || 500 }
//         )
//     }
// }

export async function GET(req: Request) {
  try {
    // const llm = LLM.getInstance('openrouter')


    // const r = await write_file.invoke({ filename: "hello.md", content: "hello world"})
    // const r = await read_file.invoke({ filename: "hello.md", offset: 5, limit:6})
    // const r = await edit_file.invoke({ filename: "hello.md", old_str: "hello", new_str: "everyone"})
    // const r = await ls.invoke({ path: 'test' })
    // const r = await grep.invoke({ pattern: 'world' })


    // await testDeepAgent(`Build a production-ready Node.js + Express + MongoDB REST API for an e-commerce application.

    // Focus only on these parts:

    // 1. Project setup
    // 2. Folder structure
    // 3. Features:
    //    - Authentication
    //    - Products
    //    - Cart

    // Use CommonJS syntax.

    // Do not build orders, payments, reviews, coupons, or admin dashboard yet.

    // Do not generate snippets only. Generate the complete working codebase.
    // `)
    //          await testDeepAgent(`Build a production-ready Node.js + Express + MongoDB REST API for an e-commerce application.

    // Focus only on these parts:

    // 1. Project setup
    // 2. Folder structure
    // 3. Features:
    //    - Authentication
    //    - Products
    //    - Cart

    // Use CommonJS syntax.

    // Do not build orders, payments, reviews, coupons, or admin dashboard yet.

    // Do not generate snippets only. Generate the complete working codebase.

    // The project must run with:

    // npm install
    // npm run dev

    // Use this tech stack:

    // - Node.js
    // - Express.js
    // - MongoDB
    // - Mongoose
    // - CommonJS
    // - JWT
    // - bcryptjs
    // - dotenv
    // - cors
    // - helmet
    // - morgan
    // - cookie-parser
    // - express-rate-limit
    // - joi
    // - nodemon

    // Do not use:

    // - TypeScript
    // - Prisma
    // - GraphQL
    // - ESM imports

    // Create this exact folder structure:

    // ecommerce-api/
    //   package.json
    //   .env.example
    //   README.md
    //   src/
    //     server.js
    //     app.js
    //     config/
    //       db.js
    //       env.js
    //     constants/
    //       roles.js
    //     models/
    //       User.js
    //       Product.js
    //       Category.js
    //       Cart.js
    //     routes/
    //       index.js
    //       auth.routes.js
    //       product.routes.js
    //       cart.routes.js
    //     controllers/
    //       auth.controller.js
    //       product.controller.js
    //       cart.controller.js
    //     services/
    //       auth.service.js
    //       product.service.js
    //       cart.service.js
    //     middlewares/
    //       auth.middleware.js
    //       role.middleware.js
    //       validate.middleware.js
    //       error.middleware.js
    //       notFound.middleware.js
    //       rateLimit.middleware.js
    //     validators/
    //       auth.validator.js
    //       product.validator.js
    //       cart.validator.js
    //     utils/
    //       asyncHandler.js
    //       ApiError.js
    //       sendResponse.js
    //       generateToken.js
    //       pagination.js
    //       sanitizeQuery.js

    // Create .env.example with:

    // NODE_ENV=development
    // PORT=5000
    // MONGO_URI=mongodb://localhost:27017/ecommerce_api
    // JWT_ACCESS_SECRET=replace_with_access_secret
    // JWT_REFRESH_SECRET=replace_with_refresh_secret
    // JWT_ACCESS_EXPIRES_IN=15m
    // JWT_REFRESH_EXPIRES_IN=7d
    // CLIENT_URL=http://localhost:3000
    // COOKIE_SECURE=false

    // All API routes must be mounted under:

    // /api/v1

    // Create health route:

    // GET /health

    // Health response:

    // {
    //   "success": true,
    //   "message": "Server is healthy",
    //   "data": null
    // }

    // Use this standard success response format:

    // {
    //   "success": true,
    //   "message": "Human readable message",
    //   "data": {}
    // }

    // Use this standard error response format:

    // {
    //   "success": false,
    //   "message": "Human readable error",
    //   "errorCode": "ERROR_CODE"
    // }

    // Implement these utility helpers:

    // sendResponse(res, statusCode, message, data)
    // ApiError(statusCode, message, errorCode)
    // asyncHandler
    // generateToken
    // pagination
    // sanitizeQuery

    // Authentication feature:

    // Create User model with:

    // - name: String, required
    // - email: String, required, unique, lowercase, trim
    // - password: String, required, select false
    // - role: enum USER/ADMIN, default USER
    // - isBlocked: Boolean, default false
    // - refreshToken: String, select false
    // - addresses array with:
    //   - fullName
    //   - phone
    //   - line1
    //   - line2
    //   - city
    //   - state
    //   - country
    //   - postalCode
    //   - isDefault
    // - timestamps: true

    // Create roles constants:

    // USER
    // ADMIN

    // Implement auth endpoints:

    // POST /api/v1/auth/register
    // POST /api/v1/auth/login
    // POST /api/v1/auth/refresh-token
    // POST /api/v1/auth/logout
    // GET  /api/v1/auth/me

    // Auth rules:

    // - Password must be hashed before save using bcryptjs.
    // - Login must reject blocked users.
    // - /me requires authentication.
    // - Logout clears refresh token from database and cookie.
    // - Refresh token endpoint validates cookie token.
    // - Refresh token endpoint rotates refresh token.
    // - Access token should be returned in response body.
    // - Refresh token should be stored in an HttpOnly cookie.
    // - Never return password or refresh token in API responses.
    // - Use .select("+password") only during login.
    // - Use .select("+refreshToken") only during refresh/logout logic.

    // Use Joi validation for register and login:

    // Register:
    // - name: required string
    // - email: required valid email
    // - password: required string min 8

    // Login:
    // - email: required valid email
    // - password: required string

    // Authorization:

    // Create:

    // authMiddleware
    // roleMiddleware(...allowedRoles)

    // Rules:

    // - authMiddleware validates access token from Authorization: Bearer <token>.
    // - roleMiddleware checks allowed roles.
    // - Products create/update/delete must require ADMIN role.
    // - Cart endpoints must require authentication.

    // Category model:

    // Create Category model with:

    // - name: String, required, unique, trim
    // - slug: String, required, unique, lowercase
    // - description: String
    // - isActive: Boolean, default true
    // - timestamps: true

    // Categories are needed for product references only. Do not create category routes yet.

    // Product feature:

    // Create Product model with:

    // - name: String, required, trim
    // - slug: String, required, unique, lowercase
    // - description: String
    // - price: Number, required, min 0
    // - discountPrice: Number, min 0
    // - stock: Number, required, min 0
    // - sku: String, unique
    // - category: ObjectId ref Category
    // - images: [String]
    // - brand: String
    // - ratingAverage: Number, default 0
    // - ratingCount: Number, default 0
    // - isActive: Boolean, default true
    // - timestamps: true

    // Add product indexes:

    // - text index on name, description, brand
    // - category
    // - price
    // - ratingAverage

    // Implement product endpoints:

    // GET    /api/v1/products
    // GET    /api/v1/products/:id
    // POST   /api/v1/products
    // PATCH  /api/v1/products/:id
    // DELETE /api/v1/products/:id

    // Product rules:

    // - Public users can list and view active products.
    // - Admin users can create, update, and delete products.
    // - Delete must be soft delete by setting isActive=false.
    // - Product list should return only active products for public users.
    // - Product detail should return 404 if product is inactive or not found.
    // - Validate MongoDB ObjectId params.

    // Product list query support:

    // ?page=1
    // &limit=20
    // &search=iphone
    // &category=<categoryId>
    // &minPrice=100
    // &maxPrice=1000
    // &brand=Apple
    // &sort=price_asc | price_desc | newest | rating_desc

    // Product list response must include:

    // {
    //   "items": [],
    //   "pagination": {
    //     "page": 1,
    //     "limit": 20,
    //     "total": 100,
    //     "totalPages": 5
    //   }
    // }

    // Use Joi validation for product create/update/query.

    // Reject:

    // - missing name
    // - negative price
    // - negative stock
    // - invalid category ObjectId
    // - invalid sort value
    // - invalid pagination values

    // Cart feature:

    // Create Cart model with:

    // - user: ObjectId ref User, unique
    // - items array:
    //   - product: ObjectId ref Product
    //   - quantity: Number, min 1
    //   - priceAtTime: Number
    // - timestamps: true

    // Implement cart endpoints:

    // GET    /api/v1/cart
    // POST   /api/v1/cart/items
    // PATCH  /api/v1/cart/items/:productId
    // DELETE /api/v1/cart/items/:productId
    // DELETE /api/v1/cart

    // Cart rules:

    // - Auth required for all cart endpoints.
    // - User can access only their own cart.
    // - Cannot add inactive product.
    // - Cannot add non-existing product.
    // - Cannot add quantity greater than available stock.
    // - Store product price as priceAtTime.
    // - If item already exists, increase quantity.
    // - Updating quantity must validate stock.
    // - Removing item deletes only that product from cart.
    // - Clearing cart removes all items.
    // - Cart response should populate product basic details:
    //   - name
    //   - slug
    //   - price
    //   - discountPrice
    //   - images
    //   - stock

    // Use Joi validation for cart:

    // - productId: valid MongoDB ObjectId
    // - quantity: number, integer, min 1

    // Middleware to implement:

    // - authMiddleware
    // - roleMiddleware
    // - validateMiddleware
    // - errorMiddleware
    // - notFoundMiddleware
    // - rateLimitMiddleware

    // Error middleware must handle:

    // - Joi validation errors
    // - Mongoose validation errors
    // - CastError invalid ObjectId
    // - Duplicate key errors
    // - JWT expired token
    // - JWT invalid token
    // - ApiError

    // App setup:

    // src/app.js must include:

    // - express.json({ limit: "10kb" })
    // - express.urlencoded({ extended: true })
    // - cookieParser()
    // - cors
    // - helmet
    // - morgan in development only
    // - rate limiter
    // - health route
    // - /api/v1 routes
    // - not found handler
    // - global error handler

    // Server setup:

    // src/server.js must include:

    // - load env config
    // - connect DB
    // - start server
    // - graceful shutdown for SIGINT
    // - graceful shutdown for SIGTERM
    // - unhandledRejection handling
    // - uncaughtException handling

    // Database connection:

    // src/config/db.js must:

    // - connect to MongoDB using Mongoose
    // - log successful connection
    // - throw clear error on connection failure

    // README must include:

    // - project overview
    // - features included
    // - folder structure
    // - install instructions
    // - environment setup
    // - run instructions
    // - API route summary
    // - auth flow explanation
    // - production notes

    // Code quality rules:

    // - Keep controllers thin.
    // - Put business logic in services.
    // - Use asyncHandler for all async controllers.
    // - Do not repeat try/catch in every controller.
    // - Never expose password or refreshToken in responses.
    // - Use constants for roles.
    // - Use clear error codes.
    // - Use consistent naming.
    // - Validate request body, params, and query.
    // - Use soft delete for products.
    // - Do not hardcode secrets.
    // - Do not skip files.
    // - Do not leave TODO comments for core functionality.
    // - Do not generate pseudo-code.
    // - Make the project runnable.
    // - Use CommonJS require and module.exports.

    // Expected final output:

    // Generate the complete project files.

    // For each file, provide the file path and full content.

    // Use this format:

    // // file: package.json
    // <full file content>

    // // file: src/server.js
    // <full file content>

    // Do not summarize only.
    // Do not omit files.
    // Do not say “implement similarly”.
    // Do not use placeholders for core logic.`)

    return NextResponse.json({
      response: 'success'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message },
      { status: error?.status || 500 }
    )
  }
}