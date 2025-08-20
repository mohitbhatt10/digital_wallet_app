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
- OAuth2 Google: set real client id/secret via environment variables (see Secrets Management).
- JWT secret resolved from env var JWT_SECRET (fallback dev value). Must be >= 256 bits.
- Controllers now rely on authenticated user via JWT (demo user removed). Ensure Authorization: Bearer <token> header is sent.

## Secrets Management

Do NOT commit real secrets in `application.yml`.

Provide them at runtime via environment variables (PowerShell examples):

```powershell
$env:SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="your-client-id"
$env:SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="your-client-secret"
$env:JWT_SECRET="$(openssl rand -base64 48)"  # or another secure random value >= 32 bytes
mvn -f backend/pom.xml spring-boot:run
```

If OpenSSL is unavailable:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

`application.yml` maps:
- `jwt.secret: ${JWT_SECRET:change-this-secret}` – use env var in prod.

Rotate secrets if exposed, and invalidate old Google OAuth client secrets in Google Cloud Console.
