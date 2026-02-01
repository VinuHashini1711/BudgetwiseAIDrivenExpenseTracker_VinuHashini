# ---------- Build Stage ----------
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Copy all backend files
COPY . .

# Give permission to Maven wrapper and build the JAR
RUN chmod +x mvnw && ./mvnw clean package -DskipTests


# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port (Render uses this)
EXPOSE 8080

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
