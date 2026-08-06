## ADDED Requirements

### Requirement: MiniMax client returns mock responses when disabled
The MiniMax client SHALL return deterministic mock responses when `MINIMAX_ENABLED=false`. The mock SHALL not make any API calls to the MiniMax service.

#### Scenario: generateOpeningMessage returns mock when disabled
- **WHEN** `MINIMAX_ENABLED=false` and `generateOpeningMessage(memberName)` is called
- **THEN** function SHALL return `[MOCK AI] Bonjour <memberName>, comment allez-vous aujourd'hui ?`
- **THEN** no API call SHALL be made to MiniMax

#### Scenario: generateReply returns mock when disabled
- **WHEN** `MINIMAX_ENABLED=false` and `generateReply(message)` is called
- **THEN** function SHALL return `{ content: "[MOCK AI] Merci pour votre réponse. Nous serons ravis de vous revoir !", alert: <boolean> }`
- **THEN** `alert` SHALL be `true` if message contains "urgence" or "malade", `false` otherwise
- **THEN** no API call SHALL be made to MiniMax

#### Scenario: generateConversationSummary returns mock when disabled
- **WHEN** `MINIMAX_ENABLED=false` and `generateConversationSummary(convos)` is called
- **THEN** function SHALL return `{ score: 7, status: "stable", prayerTopics: ["Famille", "Santé"] }`
- **THEN** no API call SHALL be made to MiniMax

### Requirement: MiniMax mock responses are deterministic
The mock responses SHALL be deterministic and predictable, allowing developers to test flows without variability.

#### Scenario: Same input produces same output
- **WHEN** `generateOpeningMessage("Jean")` is called multiple times with `MINIMAX_ENABLED=false`
- **THEN** all calls SHALL return the exact same string

#### Scenario: Alert detection is consistent
- **WHEN** `generateReply("J'ai une urgence familiale")` is called with `MINIMAX_ENABLED=false`
- **THEN** response SHALL always have `alert: true`

#### Scenario: Non-alert messages detected correctly
- **WHEN** `generateReply("Tout va bien merci")` is called with `MINIMAX_ENABLED=false`
- **THEN** response SHALL always have `alert: false`

### Requirement: MiniMax client makes real API calls when enabled
When `MINIMAX_ENABLED=true`, the MiniMax client SHALL make real API calls to the MiniMax service using the configured credentials.

#### Scenario: Real API call made when enabled
- **WHEN** `MINIMAX_ENABLED=true` and `generateOpeningMessage()` is called
- **THEN** function SHALL make HTTP POST to `https://api.minimax.chat/v1/text/chatcompletion_v2`
- **THEN** request SHALL include `MINIMAX_API_KEY` and `MINIMAX_GROUP_ID` headers

#### Scenario: API credentials required when enabled
- **WHEN** `MINIMAX_ENABLED=true` but `MINIMAX_API_KEY` is missing
- **THEN** function SHALL throw an error indicating missing credentials

### Requirement: MiniMax mock does not consume API resources
When `MINIMAX_ENABLED=false`, no network requests SHALL be made to the MiniMax API, ensuring zero resource consumption.

#### Scenario: No network traffic when disabled
- **WHEN** `MINIMAX_ENABLED=false` and any MiniMax function is called
- **THEN** no HTTP requests SHALL be made to `api.minimax.chat`
- **THEN** no API quota SHALL be consumed

### Requirement: MiniMax mock maintains function signatures
The mock functions SHALL have the same TypeScript signatures as the real functions, ensuring type safety across the codebase.

#### Scenario: Function signatures match
- **WHEN** mock functions are used in place of real functions
- **THEN** TypeScript compilation SHALL succeed without errors
- **THEN** return types SHALL match the real function signatures

#### Scenario: All exported functions mocked
- **WHEN** `MINIMAX_ENABLED=false`
- **THEN** `generateOpeningMessage`, `generateReply`, and `generateConversationSummary` SHALL all be available and callable
