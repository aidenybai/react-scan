#!/bin/bash

# Determine the directory of the script
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Default values
DEFAULT_PATH="./packages/scan/dist"
DEFAULT_PORT="4000"
DEFAULT_CERT="$SCRIPT_DIR/certs/cert.pem"
DEFAULT_KEY="$SCRIPT_DIR/certs/key.pem"

# Positional arguments
SERVE_PATH="$1" # First argument is the path

# Get optional flags
shift # Remove the first argument from the list
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --port) PORT_ARG="$2"; shift ;;
        --cert) CERT_ARG="$2"; shift ;;
        --key) KEY_ARG="$2"; shift ;;
        *) echo "Unknown parameter: $1" >&2; exit 1 ;;
    esac
    shift
done

# Use provided arguments or defaults
SERVE_PATH="${SERVE_PATH:-$DEFAULT_PATH}"
SERVE_PORT="${PORT_ARG:-$DEFAULT_PORT}"
SERVE_CERT="${CERT_ARG:-$DEFAULT_CERT}"
SERVE_KEY="${KEY_ARG:-$DEFAULT_KEY}"

# Run the server with CORS enabled
http-server "$SERVE_PATH" -p "$SERVE_PORT" --ssl --cert "$SERVE_CERT" --key "$SERVE_KEY" --cors
