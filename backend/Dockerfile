# Build stage - use Gradle image to build without wrapper jar
FROM gradle:8.5-jdk17-alpine AS build
WORKDIR /app

COPY build.gradle settings.gradle ./
COPY src src

RUN gradle bootJar --no-daemon -x test

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN adduser -D appuser
USER appuser

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
