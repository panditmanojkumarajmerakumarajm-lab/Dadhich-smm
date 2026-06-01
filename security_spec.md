# Firebase Security Specification Rules - Dadhich SMM Fortress Model

## 1. Data Invariants

1.  **User Access Isolation**: No user can read or modify another user's balance, orders, transactions, or support tickets.
2.  **Admin Overlord (Escalation Prevention)**: Only the authorized admin email (`tiwarigautam819@gmail.com`) can read all user records, search, and update balances or adjust global SMM markup margins.
3.  **Credential Protection**: The plain-text password field must only be visible to its respective owner or the administrator (`tiwarigautam819@gmail.com`).
4.  **Transaction Authenticity**: Transaction logs must not be spoofed by unauthorized users.

## 2. The "Dirty Dozen" Payloads

Here are twelve payloads designed to bypass identity boundaries or hijack ledger fields:
1.  **P1**: Non-authenticated read of `/users/someclient`
2.  **P2**: Non-authenticated update of `/settings/global` to change markup to 0%
3.  **P3**: Client `john` trying to read `/users/alice`
4.  **P4**: Client `john` trying to update `/users/john` with a forged `balance` of ₹1,000,000
5.  **P5**: Client `john` trying to create an order inside `/users/alice/orders/123`
6.  **P6**: Client `john` trying to write a transaction log crediting himself without administrative UTR check verification
7.  **P7**: An user raising a support ticket under another user's account path
8.  **P8**: Injecting massive 10MB garbage strings in the `username` path variables
9.  **P9**: Standard user trying to read `/users` (which includes search listings)
10. **P10**: Spoofed email header claiming to be the admin email but having `email_verified` as `false`
11. **P12**: Attempting to set `isFirstDeposit` to true again after a previous successful write, skipping validation
12. **P12**: Forcing `createdAt` timestamp modification after document instantiation

## 3. Fortress Rule Blueprint (firestore.rules)

Our rules will implement clear isOwner() and isAdmin() gates to ensure absolute zero-trust integrity.
