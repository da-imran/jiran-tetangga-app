#!/usr/bin/env bash
# =============================================================================
# run-local.sh - Run JiranTetangga monorepo locally
#
# Usage:
#   ./run-local.sh start     # Start both services
#   ./run-local.sh stop      # Stop both services
#   ./run-local.sh restart   # Restart both services
#   ./run-local.sh logs      # Show recent logs
#   ./run-local.sh status    # Check if services are running
#
# Override defaults with env vars:
#   API_PORT=8118 WEB_PORT=3000 MONGO_URI=mongodb://...
# =============================================================================

set -euo pipefail

# --- Config ---
API_PORT="${API_PORT:-8118}"
WEB_PORT="${WEB_PORT:-3000}"
MONGO_URI="${MONGO_URI:-}"
PID_FILE="/tmp/jiran-tetangga.pid"
API_LOG="/tmp/jiran-api.log"
WEB_LOG="/tmp/jiran-web.log"

# --- Colours ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[info]${RESET}  $*"; }
success() { echo -e "${GREEN}[ok]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; }
die()     { error "$*"; exit 1; }

# --- PID management ---
save_pids() {
  echo "API_PID=$API_PID" > "$PID_FILE"
  echo "WEB_PID=$WEB_PID" >> "$PID_FILE"
}

load_pids() {
  if [[ -f "$PID_FILE" ]]; then
    # shellcheck source=/dev/null
    source "$PID_FILE"
  fi
}

is_running() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

# --- Cleanup ---
cleanup() {
  if is_running "${API_PID:-}"; then
    info "Stopping API server (PID: $API_PID)..."
    kill "$API_PID" 2>/dev/null || true
  fi
  if is_running "${WEB_PID:-}"; then
    info "Stopping frontend dev server (PID: $WEB_PID)..."
    kill "$WEB_PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
}

# --- Wait for MongoDB ---
wait_for_mongodb() {
  local host="localhost"
  local port=27017
  local timeout=30
  local elapsed=0

  info "Waiting for MongoDB to be ready on ${host}:${port}..."
  while [ $elapsed -lt $timeout ]; do
    if nc -z $host $port 2>/dev/null; then
      info "MongoDB is ready!"
      return 0
    fi
    sleep 1
    ((elapsed++))
    info "Still waiting for MongoDB... (${elapsed}/${timeout}s)"
  done
  return 1
}

# --- Start services ---
start_services() {
  echo -e "${BOLD}JiranTetangga - Monorepo Dev Runner${RESET}"
  echo "======================================"

  # --- 1. Check prerequisites ---
  if ! command -v node &>/dev/null; then
    die "Node.js not found. Install Node.js 20+ from https://nodejs.org"
  fi
  NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 20 ]; then
    die "Node.js 20+ required (found $(node --version)). Please upgrade."
  fi
  success "Node.js $(node --version)"

  if ! command -v pnpm &>/dev/null; then
    die "pnpm not found. Install pnpm: npm install -g pnpm"
  fi
  success "pnpm $(pnpm --version)"

  # --- 2. Load .env file (root) ---
  if [ -f .env ]; then
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
    info "Loaded environment from .env"
  fi

  # --- 3. Adjust MONGODB_URI for local development without docker ---
  # If using docker service name, switch to localhost
  if [[ "${MONGODB_URI:-}" == *"mongodb:27017"* ]]; then
    export MONGODB_URI="mongodb://localhost:27017/jiran-tetangga"
    info "Adjusted MONGODB_URI to localhost for local development (docker service not running)"
  fi

  # --- 4. Wait for MongoDB to be ready ---
  if ! wait_for_mongodb; then
    warn "MongoDB is not available after 30 seconds."
    if [[ "$(uname)" == "Darwin" ]] && command -v brew &>/dev/null; then
      info "You can start it with: brew services start mongodb-community"
    else
      info "Please start MongoDB manually and ensure it's listening on port 27017."
    fi
    info "Continuing anyway - the backend will retry connection attempts."
  fi

  # --- 5. Install dependencies ---
  info "Installing workspace dependencies..."
  pnpm install
  success "Dependencies installed"

  # --- 6. Workaround for Apple Silicon optional dependencies ---
  if [[ "$(uname -m)" == "arm64" ]]; then
    info "Detected Apple Silicon, installing missing native optional dependencies"
    # These are optional dependencies that pnpm sometimes skips on Apple Silicon
    pnpm --filter @workspace/jiran-tetangga add -D @rollup/rollup-darwin-arm64 2>/dev/null || true
    pnpm add -w lightningcss-darwin-arm64 2>/dev/null || true
    pnpm add -w @tailwindcss/oxide-darwin-arm64 2>/dev/null || true
  fi

  # --- 7. Start backend ---
  info "Starting API server on port ${API_PORT}..."
  (
    cd packages/api-server
    PORT="${API_PORT}" NODE_ENV=development \
      pnpm run dev
  ) > "$API_LOG" 2>&1 &
  API_PID=$!
  info "API server PID: $API_PID (logs: $API_LOG)"

  # --- 8. Start frontend ---
  info "Starting frontend dev server on port ${WEB_PORT}..."
  (
    cd packages/jiran-tetangga
    PORT="${WEB_PORT}" \
    BASE_PATH="${BASE_PATH:-/}" \
    NODE_ENV=development \
    VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${API_PORT}/jiran-tetangga/v1}" \
      pnpm run dev
  ) > "$WEB_LOG" 2>&1 &
  WEB_PID=$!
  info "Frontend PID: $WEB_PID (logs: $WEB_LOG)"

  # Save PIDs for later management
  save_pids

  # Give services a moment to boot
  sleep 3

  # --- 9. Summary ---
  echo ""
  echo -e "${BOLD}======================================${RESET}"
  echo -e "${GREEN}${BOLD}  Running!${RESET}"
  echo -e "  Frontend  ->  ${CYAN}http://localhost:${WEB_PORT}${RESET}"
  echo -e "  API       ->  ${CYAN}http://localhost:${API_PORT}/jiran-tetangga/v1${RESET}"
  echo -e "  API logs  ->  ${CYAN}$API_LOG${RESET}"
  echo -e "  Web logs  ->  ${CYAN}$WEB_LOG${RESET}"
  echo -e "${BOLD}======================================${RESET}"
  echo -e "  To stop:  ${BOLD}./run-local.sh stop${RESET}"
  echo -e "  To view logs:  ${BOLD}./run-local.sh logs${RESET}"
  echo ""
}

# --- Stop services ---
stop_services() {
  load_pids
  local stopped=0

  if is_running "${API_PID:-}"; then
    info "Stopping API server (PID: $API_PID)..."
    kill "$API_PID" 2>/dev/null || true
    ((stopped++))
  else
    info "API server not running"
  fi

  if is_running "${WEB_PID:-}"; then
    info "Stopping frontend dev server (PID: $WEB_PID)..."
    kill "$WEB_PID" 2>/dev/null || true
    ((stopped++))
  else
    info "Frontend server not running"
  fi

  rm -f "$PID_FILE"

  if [ $stopped -gt 0 ]; then
    success "Stopped $stopped service(s)"
  else
    info "No services were running"
  fi
}

# --- Restart services ---
restart_services() {
  info "Restarting services..."
  stop_services
  sleep 1
  start_services
}

# --- Show logs ---
show_logs() {
  echo -e "${BOLD}=== API LOG (last 30 lines) ===${RESET}"
  tail -n 30 "$API_LOG" 2>/dev/null || echo "No API log found"
  echo ""
  echo -e "${BOLD}=== WEB LOG (last 30 lines) ===${RESET}"
  tail -n 30 "$WEB_LOG" 2>/dev/null || echo "No web log found"
}

# --- Check status ---
show_status() {
  load_pids
  echo -e "${BOLD}Service Status:${RESET}"

  if is_running "${API_PID:-}"; then
    echo -e "  API Server: ${GREEN}running (PID: $API_PID)${RESET}"
  else
    echo -e "  API Server: ${RED}not running${RESET}"
  fi

  if is_running "${WEB_PID:-}"; then
    echo -e "  Frontend:   ${GREEN}running (PID: $WEB_PID)${RESET}"
  else
    echo -e "  Frontend:   ${RED}not running${RESET}"
  fi
}

# --- Check Docker prerequisites ---
check_docker_prereqs() {
  if ! command -v docker &>/dev/null; then
    die "Docker not found. Install Docker from https://www.docker.com/get-docker"
  fi
  success "Docker $(docker --version | awk '{print $3}' | sed 's/,//')"

  if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
    die "Docker Compose not found. Install Docker Compose."
  fi
  if docker compose version &>/dev/null; then
    success "Docker Compose $(docker compose version --short)"
    COMPOSE_CMD="docker compose"
  else
    success "Docker Compose $(docker-compose --version | awk '{print $3}' | sed 's/,//')"
    COMPOSE_CMD="docker-compose"
  fi
}

# --- Start services with Docker ---
start_docker_services() {
  echo -e "${BOLD}JiranTetangga - Docker Compose Runner${RESET}"
  echo "======================================"

  # --- 1. Check prerequisites ---
  check_docker_prereqs

  # --- 2. Load .env file ---
  if [ -f .env ]; then
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
    info "Loaded environment from .env"
  fi

  # --- 3. Ensure external network exists ---
  if ! docker network inspect jiran-tetangga-networks &>/dev/null; then
    info "Creating external Docker network: jiran-tetangga-networks"
    docker network create jiran-tetangga-networks
    success "Network created"
  fi

  # --- 4. Build and start containers ---
  info "Building and starting Docker services..."
  $COMPOSE_CMD up -d --build

  # --- 5. Summary ---
  sleep 3
  echo ""
  echo -e "${BOLD}======================================${RESET}"
  echo -e "${GREEN}${BOLD}  Docker services running!${RESET}"
  echo -e "  Frontend  ->  ${CYAN}http://localhost:${WEB_PORT}${RESET}"
  echo -e "  API       ->  ${CYAN}http://localhost:${API_PORT}/jiran-tetangga/v1${RESET}"
  echo -e "  MongoDB   ->  ${CYAN}localhost:27019${RESET}"
  echo -e "${BOLD}======================================${RESET}"
  echo -e "  To stop:      ${BOLD}./run-local.sh docker-stop${RESET}"
  echo -e "  To view logs: ${BOLD}./run-local.sh docker-logs${RESET}"
  echo ""
}

# --- Stop Docker services ---
stop_docker_services() {
  check_docker_prereqs
  info "Stopping Docker services..."
  $COMPOSE_CMD down
  success "Docker services stopped"
}

# --- Show Docker logs ---
show_docker_logs() {
  check_docker_prereqs
  $COMPOSE_CMD logs --tail=50
}

# --- Show Docker status ---
show_docker_status() {
  check_docker_prereqs
  $COMPOSE_CMD ps
}

# --- Main ---
case "${1:-start}" in
  start)
    start_services
    ;;
  stop)
    stop_services
    ;;
  restart)
    restart_services
    ;;
  logs)
    show_logs
    ;;
  status)
    show_status
    ;;
  docker)
    start_docker_services
    ;;
  docker-stop)
    stop_docker_services
    ;;
  docker-logs)
    show_docker_logs
    ;;
  docker-status)
    show_docker_status
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|status|docker|docker-stop|docker-logs|docker-status}"
    echo "  start        - Start both services locally with pnpm (default)"
    echo "  stop         - Stop both services"
    echo "  restart      - Restart both services"
    echo "  logs         - Show recent logs"
    echo "  status       - Check if services are running"
    echo "  docker       - Start all services with Docker Compose"
    echo "  docker-stop  - Stop all Docker services"
    echo "  docker-logs  - Show Docker Compose logs"
    echo "  docker-status- Check Docker Compose services status"
    exit 1
    ;;
esac