# Plaid Connection Specification

## ADDED Requirements

### Requirement: Link Token Generation
The backend SHALL provide an API endpoint to generate Plaid link tokens on demand.

#### Scenario: Successful link token generation
- **WHEN** a client requests a link token via `POST /api/plaid/link-token`
- **THEN** the system creates a link token using the Plaid API
- **AND** returns the link token with 200 status and expiration time

#### Scenario: Link token generation with Plaid API failure
- **WHEN** the Plaid API is unavailable or returns an error
- **THEN** the system returns a 503 Service Unavailable error
- **AND** includes a user-friendly error message

### Requirement: Public Token Exchange
The backend SHALL exchange Plaid public tokens for access tokens and store them securely.

#### Scenario: Successful token exchange
- **WHEN** a client sends a valid public token via `POST /api/plaid/exchange-token`
- **THEN** the system exchanges it for an access token using the Plaid API
- **AND** encrypts the access token using AES-256-GCM
- **AND** stores the encrypted token, item_id, and institution metadata in the database
- **AND** returns the item_id with 201 status

#### Scenario: Invalid public token
- **WHEN** a client sends an invalid or expired public token
- **THEN** the system returns a 400 Bad Request error
- **AND** includes an error message indicating the token is invalid

#### Scenario: Duplicate item connection
- **WHEN** a client exchanges a token for an institution already connected
- **THEN** the system updates the existing item's access token
- **AND** returns the existing item_id with 200 status

### Requirement: Access Token Security
The system SHALL encrypt all Plaid access tokens at rest using AES-256-GCM encryption.

#### Scenario: Access token storage
- **WHEN** an access token is received from Plaid
- **THEN** the system encrypts it using the PLAID_ENCRYPTION_KEY environment variable
- **AND** stores only the encrypted value in the database
- **AND** never logs or exposes the decrypted token

#### Scenario: Access token retrieval
- **WHEN** the system needs to make Plaid API calls
- **THEN** it decrypts the access token in-memory
- **AND** uses it for the API request
- **AND** discards the decrypted value after use

### Requirement: Plaid Link UI Integration
The frontend SHALL integrate the Plaid Link OAuth component for bank authentication.

#### Scenario: Opening Plaid Link
- **WHEN** a user navigates to the Connect page at `/connect`
- **THEN** the system fetches a link token from the backend
- **AND** initializes the Plaid Link component with the token
- **AND** displays a "Connect Your Bank" button

#### Scenario: Successful bank connection
- **WHEN** a user completes Plaid Link authentication
- **THEN** Plaid Link returns a public token to the frontend
- **AND** the system exchanges the public token via the backend API
- **AND** shows a success message
- **AND** navigates to the dashboard page

#### Scenario: User exits Plaid Link without connecting
- **WHEN** a user closes Plaid Link without completing authentication
- **THEN** the system returns to the Connect page
- **AND** displays the "Connect Your Bank" button again
- **AND** shows a message indicating connection was cancelled

#### Scenario: Plaid Link error
- **WHEN** Plaid Link encounters an error during authentication
- **THEN** the system displays a user-friendly error message
- **AND** provides a "Try Again" button to restart the flow
- **AND** logs the error details for debugging

### Requirement: Account Data Synchronization
The system SHALL fetch and store account data from Plaid after successful token exchange.

#### Scenario: Initial account sync
- **WHEN** an access token is successfully stored
- **THEN** the system immediately calls Plaid's `/accounts/get` endpoint
- **AND** stores account data (name, type, subtype, mask, balances) in the accounts table
- **AND** links each account to the plaid_item via item_id

#### Scenario: Account data update
- **WHEN** the system syncs accounts for an existing item
- **THEN** it updates existing account records if they exist
- **AND** creates new account records for any new accounts
- **AND** updates the last_sync timestamp on the plaid_item

### Requirement: Environment Configuration
The system SHALL require Plaid credentials and encryption keys via environment variables.

#### Scenario: Missing Plaid credentials
- **WHEN** the backend starts without PLAID_CLIENT_ID or PLAID_SECRET
- **THEN** the system logs an error
- **AND** refuses to initialize Plaid endpoints
- **AND** returns 503 Service Unavailable for Plaid API calls

#### Scenario: Missing encryption key
- **WHEN** the backend starts without PLAID_ENCRYPTION_KEY
- **THEN** the system logs an error
- **AND** refuses to start
- **AND** displays a clear error message about the missing key

### Requirement: Rate Limiting
The system SHALL implement rate limiting on Plaid API endpoints to prevent abuse.

#### Scenario: Rate limit not exceeded
- **WHEN** a client makes requests within the rate limit (10 requests per minute)
- **THEN** the system processes the request normally

#### Scenario: Rate limit exceeded
- **WHEN** a client exceeds the rate limit
- **THEN** the system returns a 429 Too Many Requests error
- **AND** includes a Retry-After header indicating when to retry

### Requirement: Input Validation
All Plaid-related API endpoints SHALL validate inputs using Zod schemas.

#### Scenario: Valid exchange token request
- **WHEN** a client sends `{ "public_token": "public-sandbox-..." }` to `/api/plaid/exchange-token`
- **THEN** the system validates the public_token is a non-empty string
- **AND** processes the request

#### Scenario: Invalid exchange token request
- **WHEN** a client sends a request with missing or invalid public_token
- **THEN** the system returns a 400 Bad Request error
- **AND** includes validation error details

