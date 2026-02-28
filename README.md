# JarBudget — Spring Boot backend + React frontend (B)

A lightweight personal expense tracker: Spring Boot REST API for storing expenses and getting summaries, plus a Vite/React frontend scaffold.

## Tech stack
- Java 17, Spring Boot 4.1.0-M2 (WebMVC, Data JPA, Flyway, Security disabled for all requests).
- H2 file database at `./data/jarbudget` (console enabled).
- Maven build (wrapper script present, but `.mvn/wrapper` is missing — use system Maven or generate the wrapper).
- Frontend: React 19 + Vite 7, React Router 7.

## Backend quickstart
1. Install Java 17+ and Maven 3.9+.
2. Run the app:
   ```bash
   mvn spring-boot:run
   ```
   The API will be available on http://localhost:8080.
3. H2 console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:file:./data/jarbudget`, user `sa`, empty password).

### API endpoints
- `GET /api/expenses` — list all expenses.
- `POST /api/expenses` — create expense. Example body:
  ```json
  {"title":"Coffee","category":"Food","amount":4.5,"date":"2026-02-28"}
  ```
  `date` is optional; defaults to today. `amount` defaults to `0`.
- `DELETE /api/expenses/{id}` — remove by id.
- `GET /api/expenses/summary` — totals: `totalAmount`, `count`, and `byCategory` map.

### Build and test
- Run backend tests: `mvn test`.
- Build jar: `mvn clean package` (output in `target/`).

## Frontend quickstart
1. Install Node.js 20+.
2. From `frontend/`:
   ```bash
   npm install
   npm run dev   # starts Vite dev server (default http://localhost:5173)
   ```
3. Build static assets: `npm run build`; preview with `npm run preview`.

## Development notes
- CORS is fully open (all origins, headers, methods) for ease of local frontend work.
- Persistence uses H2 file storage so data survives restarts; delete `./data/jarbudget*` to reset.
- If you prefer the Maven Wrapper, generate it once: `mvn -N wrapper` (adds `.mvn/wrapper/*`).

## License
No license specified yet.
