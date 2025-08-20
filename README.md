Digital Wallet App

Structure:
- backend/ (Spring Boot 3.2.5, Java 17)
- frontend/ (React + TypeScript + Vite)

Backend quickstart:
1. Set PostgreSQL variables in backend/src/main/resources/application.yml (spring.datasource.url, username, password). Example URL: jdbc:postgresql://localhost:5432/wallet
2. Run: mvn -f backend/pom.xml spring-boot:run

Frontend quickstart:
1. cd frontend
2. npm install
3. npm run dev

Notes:
- OAuth2 Google configured placeholders in application.yml; set client-id and client-secret to enable the login page button.
- JWT secret in application.yml is a placeholder. Replace before production.
- Controllers currently use a demo placeholder user. Wire with Spring Security authentication in a next step.
