import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import connectDB from "./config/database";
import swaggerSpec from "./config/swagger";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Import routes
import authRoutes from "./routes/authRoutes";
import recordsRoutes from "./routes/recordsRoutes";
import cartRoutes from "./routes/cartsRoutes";
import groupsRoutes from "./routes/groupsRoutes";
import ordersRoutes from "./routes/ordersRoutes";
import musicGenreRoutes from "./routes/musicGenreRoutes";
import usersRoutes from "./routes/usersRoutes";

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
  console.log(
    `Swagger UI available at http://localhost:${
      process.env.PORT || 3000
    }/api-docs`
  );
});

// Middlewares
app.use((req, res, next) => {
  next();
});

app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Authorization"],
  })
);

// Enable pre-flight across-the-board
app.options("*", cors());

app.use(express.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle:
      "eCommerceDsNodeExpressTypeScriptMongoDB API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      deepLinking: true,
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/musicGenres", musicGenreRoutes);
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("API working. Visit /api-docs for documentation");
});
