# Changelog

## Echipa
- Cupsan Teodora-Vanessa 344C4
- Lungu Andrei-Tudor 344C4

## Impartirea taskurilor

Pentru partea de autentificare a proiectului, eu si Andrei am impartit munca astfel: el s-a ocupat de partea de infrastructura, adica a configurat Docker si Kong API Gateway. Eu (Vanessa) am lucrat pe codul propriu-zis al auth-service-ului, adica rutele, conexiunea la baza de date si logica de autentificare. Ceea ce am implementat pana acum acopera doar partea de autentificare a proiectului, restul serviciilor vor fi adaugate in actualizari viitoare.

### Adaugat (Vanessa — Auth Service)

- Structura proiectului cu folderele `config`, `middleware` si `routes`
- Endpoint `POST /auth/register` cu validarea email-ului si parolei si hashing cu bcrypt
- Endpoint `POST /auth/login` cu generare de token JWT
- Endpoint `GET /auth/validate` pentru validarea token-ului
- Pool de conexiuni PostgreSQL folosind `pg` si variabila de mediu `DATABASE_URL`
- Initializarea automata a tabelei `users` la pornirea serviciului
- Middleware JWT (`authMiddleware.js`) pentru protejarea rutelor
- Entry point Express (`index.js`) cu endpoint de health check la `GET /health`
- Handler global pentru erori negestionate

### Adaugat (Andrei — Infrastructura)

- `Dockerfile` pentru auth-service folosind Node.js 20 Alpine
- `package.json` cu dependintele: `express`, `bcryptjs`, `jsonwebtoken`, `pg`, `dotenv`
- `docker-compose.yml` care orchestreaza: PostgreSQL 16, auth-service, Kong 3.7, Adminer, Portainer
- Configuratia Kong API Gateway (`kong.yml`) care roteaza `/api/auth` catre auth-service
- Healthcheck PostgreSQL pentru a asigura ca auth-service porneste doar dupa ce baza de date este gata
