# BrainyBean Bot - Unified Version

A powerful Telegram bot that combines the best features from all previous versions, featuring OpenAI integration, multimedia support, and comprehensive analytics.

## Features

- 🤖 **AI-Powered Conversations** - Uses OpenAI GPT models for intelligent responses
- 🎤 **Voice Message Support** - Transcribes and responds to voice messages
- 📄 **Document Processing** - Handles various file types including images and PDFs
- 📊 **Analytics & Usage Tracking** - Detailed statistics on usage and costs
- 🔧 **Tool System** - Extensible function calling for dynamic features
- 🌊 **Streaming Responses** - Real-time message updates for better UX
- 🔒 **Whitelist Security** - Restrict access to authorized users only

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime (v1.0+)
- FFmpeg (for voice processing)
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- OpenAI API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/brainybean-bot.git
cd brainybean-bot
```

2. Install dependencies:
```bash
bun install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Setup database:
```bash
bun run db:generate
bun run db:migrate
```

5. Start the bot:
```bash
bun start
```

### Docker Deployment

```bash
docker-compose up -d
```

## Configuration

Edit `.env` file with your settings:

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `OPENAI_API_KEY` - OpenAI or OpenRouter API key
- `WHITELIST` - Comma-separated list of allowed Telegram user IDs
- `MODEL` - AI model to use (default: gpt-4o)
- `DATABASE_URL` - SQLite database path
- `ENABLE_STREAMING` - Enable streaming responses
- `ENABLE_TOOLS` - Enable function calling
- `ENABLE_VOICE` - Enable voice message processing

## Commands

- `/start` - Start the bot
- `/reset` - Clear chat history
- `/stats` - Show usage statistics

## Development

### Running Tests

```bash
bun test
```

### Project Structure

```
src/
├── bot.ts           # Bot initialization and middleware
├── handlers/        # Message type handlers
├── services/        # External service integrations
├── db/             # Database schema and repositories
├── tools/          # Function calling implementations
└── utils/          # Helper functions and config
```

### Adding New Tools

Create a new tool in `src/tools/implementations.ts`:

```typescript
toolRegistry.register({
  name: 'my_tool',
  description: 'Tool description',
  parameters: { /* JSON Schema */ },
  async execute(args, context) {
    // Implementation
    return 'Result';
  }
});
```

## Architecture

This unified version combines:
- **From v1**: Streaming responses, comprehensive error handling
- **From v2**: Drizzle ORM, tool system, detailed analytics
- **From v3**: Multimedia support, debounced responses, simple deployment

## Performance

- Supports concurrent users with SQLite WAL mode
- Streaming responses reduce perceived latency
- Debounced typing indicators prevent API rate limits
- Efficient token usage tracking

## Security

- Whitelist-based access control
- Environment-based configuration
- No sensitive data in logs
- Secure file handling for documents

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
