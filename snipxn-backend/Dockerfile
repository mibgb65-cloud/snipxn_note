# ---- Build Stage ----
FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

# Copy Maven wrapper and pom files first (cache dependencies)
COPY pom.xml ./
COPY snipxn-common/pom.xml snipxn-common/
COPY snipxn-auth/pom.xml snipxn-auth/
COPY snipxn-note/pom.xml snipxn-note/
COPY snipxn-community/pom.xml snipxn-community/
COPY snipxn-sandbox/pom.xml snipxn-sandbox/
COPY snipxn-ai/pom.xml snipxn-ai/
COPY snipxn-app/pom.xml snipxn-app/

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

ENV MAVEN_OPTS="-Xmx1024m -XX:MaxMetaspaceSize=256m"

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B || true

# Copy source code
COPY . .

# Build the application
RUN mvn clean package -DskipTests -B

# ---- Runtime Stage ----
FROM eclipse-temurin:25-jre

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the built JAR
COPY --from=build /app/snipxn-app/target/*.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
