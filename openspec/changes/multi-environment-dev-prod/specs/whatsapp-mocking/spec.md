## ADDED Requirements

### Requirement: WhatsApp client returns mock when disabled
The WhatsApp client SHALL return a mock object with the same interface as the real client when `WHATSAPP_ENABLED=false`. The mock SHALL log all operations to the console for debugging.

#### Scenario: Mock client created when disabled
- **WHEN** `WHATSAPP_ENABLED=false` and `getWhatsAppClient()` is called
- **THEN** returned object SHALL have methods: `isReady()`, `on()`, `destroy()`, `send()`, `sendMessage()`

#### Scenario: Mock send logs to console
- **WHEN** mock client's `send()` method is called with `{ chatId, text }`
- **THEN** console SHALL log `[WHATSAPP STUB] Would send to <chatId>: <text>`
- **THEN** method SHALL return `{ id: 'mock_<timestamp>', ack: 1 }`

#### Scenario: Mock sendMessage logs to console
- **WHEN** mock client's `sendMessage()` method is called with `(to, text)`
- **THEN** console SHALL log `[WHATSAPP STUB] Would send "<text>" to <to>`
- **THEN** method SHALL return `{ id: 'mock_<timestamp>' }`

### Requirement: WhatsApp QR endpoint returns stub status when disabled
The `/api/whatsapp/qr` endpoint SHALL return a JSON response indicating stub mode when `WHATSAPP_ENABLED=false`, instead of attempting to generate a QR code.

#### Scenario: QR endpoint returns stub status
- **WHEN** `WHATSAPP_ENABLED=false` and GET `/api/whatsapp/qr` is called
- **THEN** response SHALL be `{ connected: false, stub: true, message: "WhatsApp is disabled in this environment" }`
- **THEN** response status SHALL be 200

#### Scenario: QR endpoint works normally when enabled
- **WHEN** `WHATSAPP_ENABLED=true` and GET `/api/whatsapp/qr` is called
- **THEN** endpoint SHALL attempt to return real QR code from whatsapp-web.js client

### Requirement: WhatsApp webhook handles stub mode gracefully
The `/api/whatsapp/webhook` endpoint SHALL accept and process requests without error when `WHATSAPP_ENABLED=false`, allowing cron jobs and other flows to function without a real WhatsApp connection.

#### Scenario: Webhook accepts requests in stub mode
- **WHEN** `WHATSAPP_ENABLED=false` and POST `/api/whatsapp/webhook` is called
- **THEN** endpoint SHALL return 200 OK without attempting to process real WhatsApp messages
- **THEN** endpoint SHALL NOT throw errors or crash

#### Scenario: Webhook processes normally when enabled
- **WHEN** `WHATSAPP_ENABLED=true` and POST `/api/whatsapp/webhook` is called
- **THEN** endpoint SHALL process incoming WhatsApp messages normally

### Requirement: WhatsApp client does not load whatsapp-web.js when disabled
When `WHATSAPP_ENABLED=false`, the system SHALL NOT import or initialize the `whatsapp-web.js` module, preventing unnecessary resource usage and potential errors from missing Chrome/Puppeteer dependencies.

#### Scenario: whatsapp-web.js not imported when disabled
- **WHEN** `WHATSAPP_ENABLED=false`
- **THEN** `whatsapp-web.js` module SHALL NOT be imported or required
- **THEN** no Chrome/Puppeteer processes SHALL be spawned

#### Scenario: whatsapp-web.js loaded when enabled
- **WHEN** `WHATSAPP_ENABLED=true`
- **THEN** `whatsapp-web.js` module SHALL be imported and initialized normally

### Requirement: WhatsApp stub maintains type safety
The mock WhatsApp client SHALL implement the same TypeScript interface as the real client, ensuring type safety across the codebase.

#### Scenario: Mock client passes type checking
- **WHEN** mock client is assigned to a variable typed as the real client interface
- **THEN** TypeScript compilation SHALL succeed without errors
- **THEN** all method signatures SHALL match the real client interface
