# MCP Server Protocol Support

This MCP server supports both **stdio** and **streamable HTTP** protocols, allowing it to work with different MCP clients and deployment scenarios.

## Protocol Configuration

Set the `TRANSPORT` environment variable to choose the protocol:

### stdio Protocol (Default)
```bash
export TRANSPORT=stdio
python server.py
```

**Use cases:**
- Claude Desktop integration
- Local development
- Direct MCP client connections

### Streamable HTTP Protocol
```bash
export TRANSPORT=streamable-http
export PORT=8080
export HOST=127.0.0.1
export JSON_RESPONSE=false  # Optional: set to true for JSON responses instead of SSE
python server.py
```

**Use cases:**
- Web-based MCP clients
- API integration
- Containerized deployments
- Load balancing scenarios

### Legacy HTTP Protocol (FastMCP)
```bash
export TRANSPORT=http
export PORT=8080
export HOST=127.0.0.1
python server.py
```

**Use cases:**
- Backward compatibility
- Simple HTTP API access

## Environment Variables

| Variable | Description | Default | Protocols |
|----------|-------------|---------|-----------|
| `TRANSPORT` | Protocol to use | `stdio` | All |
| `PORT` | Server port | `8080` | HTTP protocols |
| `HOST` | Server host | `127.0.0.1` | HTTP protocols |
| `MCP_PATH` | MCP endpoint path | `/mcp` | HTTP protocols |
| `JSON_RESPONSE` | Use JSON instead of SSE | `false` | streamable-http |
| `LOG_LEVEL` | Logging level | `INFO` | All |

## Available Tools

All protocols expose the same tools:

1. **execute_function**: Execute any registered plugin function
2. **list_functions**: List all available functions
3. **get_function_details**: Get detailed function information

## Testing

Run the test script to verify both protocols work:

```bash
python test_protocols.py
```

## Claude Desktop Configuration

For Claude Desktop, use the stdio protocol:

```json
{
  "mcpServers": {
    "virion-labs": {
      "command": "python",
      "args": ["/path/to/server.py"],
      "env": {
        "TRANSPORT": "stdio",
        "API_BASE_URL": "http://localhost:8000",
        "INTERNAL_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Web Client Integration

For web-based MCP clients, use streamable HTTP:

```javascript
// Example client connection
const mcpClient = new MCPClient({
  transport: 'streamable-http',
  url: 'http://localhost:8080/mcp',
  useSSE: true // Set to false if JSON_RESPONSE=true
});
```

## Dependencies

The following additional packages are required for streamable HTTP support:

```
mcp>=1.0.0
uvicorn>=0.24.0
starlette>=0.28.0
```

Install with:
```bash
pip install -r requirements.txt
```