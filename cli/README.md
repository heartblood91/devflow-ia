# DevFlow CLI

Command-line interface for DevFlow productivity system.

## Installation

```bash
cd cli
pnpm install
pnpm build
npm link  # Make devflow command available globally
```

## Usage

```bash
# Add task
devflow add "Implement auth flow"

# Start timer
devflow start

# Show status
devflow status
```

## Development

```bash
pnpm dev  # Watch mode
```

## TODO (Phase 7)

- [ ] Implement task creation API call
- [ ] Implement timer integration
- [ ] Implement status fetching
- [ ] Add authentication
- [ ] Add configuration file (~/.devflowrc)
