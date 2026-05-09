# TODO

## Auth API route alignment fix
- [x] Update `AuthController` base mapping to `@RequestMapping("/api/auth")`

- [x] Ensure `SecurityConfig` permit rules align with new route (matches `/api/auth/**`)


- [ ] Run quick verification calls to `/api/auth/register` and `/api/auth/login`
- [ ] If register still returns 500, inspect backend exception details and DB constraints

