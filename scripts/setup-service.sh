#!/usr/bin/env bash
# ==============================================================================
# setup-service.sh — Universal One-Command Service & Timer Setup for Any Machine
#
# Installs git-webhook-daemon and weekly cleanup timer into systemd --user.
# Runs 100% in user space — NO SUDO REQUIRED.
# ==============================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "\n${BOLD}======================================================================${NC}"
echo -e "${BOLD}  Git Webhook Daemon & Weekly Timer Setup (Multi-Machine Portable)${NC}"
echo -e "${BOLD}======================================================================${NC}\n"

# 1. Verify systemd --user availability
if ! command -v systemctl >/dev/null 2>&1; then
    log_error "systemctl not found on this system. systemd is required."
    exit 1
fi

if ! systemctl --user status >/dev/null 2>&1; then
    log_warn "systemd user bus is not currently active. Attempting to proceed..."
fi

# 2. Install binaries to ~/.local/bin
BIN_DIR="${HOME}/.local/bin"
mkdir -p "$BIN_DIR"

log_info "Installing binaries to ${BOLD}${BIN_DIR}${NC}..."
cp "$SCRIPT_DIR/git-webhook-daemon.py" "$BIN_DIR/git-webhook-daemon"
chmod +x "$BIN_DIR/git-webhook-daemon"

cp "$SCRIPT_DIR/skills-sync.sh" "$BIN_DIR/skills-sync"
chmod +x "$BIN_DIR/skills-sync"
log_success "Binaries installed successfully."

# 3. Install systemd user service and weekly timer
SYSTEMD_USER_DIR="${HOME}/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"

log_info "Configuring systemd user services in ${BOLD}${SYSTEMD_USER_DIR}${NC}..."
cp "$SCRIPT_DIR/systemd/git-webhook-daemon.service" "$SYSTEMD_USER_DIR/"
cp "$SCRIPT_DIR/systemd/git-worktree-sweep.service" "$SYSTEMD_USER_DIR/"
cp "$SCRIPT_DIR/systemd/git-worktree-sweep.timer" "$SYSTEMD_USER_DIR/"

# 4. Enable and start user services
log_info "Reloading systemd user daemon..."
systemctl --user daemon-reload

log_info "Enabling and starting git-webhook-daemon.service..."
systemctl --user enable --now git-webhook-daemon.service

log_info "Enabling and starting weekly git-worktree-sweep.timer..."
systemctl --user enable --now git-worktree-sweep.timer

# 5. Register current repository
log_info "Registering repository in machine registry..."
python3 "$BIN_DIR/git-webhook-daemon" --register "$REPO_ROOT" || true

# 6. Verify status
echo ""
if systemctl --user is-active --quiet git-webhook-daemon.service; then
    log_success "git-webhook-daemon.service is ${BOLD}ACTIVE${NC} (running in background)."
else
    log_warn "git-webhook-daemon.service status: $(systemctl --user is-active git-webhook-daemon.service 2>&1 || true)"
fi

if systemctl --user is-active --quiet git-worktree-sweep.timer; then
    log_success "git-worktree-sweep.timer is ${BOLD}ACTIVE${NC} (scheduled weekly)."
else
    log_warn "git-worktree-sweep.timer status: $(systemctl --user is-active git-worktree-sweep.timer 2>&1 || true)"
fi

echo -e "\n${BOLD}Setup Complete!${NC}"
echo -e "  • Webhook Endpoint:  ${BLUE}http://127.0.0.1:9876/events${NC}"
echo -e "  • Weekly Timer:      ${BLUE}Active (every week, persistent on boot)${NC}"
echo -e "  • Multi-Repo Registry: ${BLUE}~/.config/git-webhook-daemon/repos.json${NC}"
echo -e "  • Service Logs:      ${BLUE}journalctl --user -u git-webhook-daemon -f${NC}"
echo -e "  • Relay Webhooks:    ${BLUE}gh webhook forward --repo=<owner>/<repo> --events=pull_request --url=http://127.0.0.1:9876/events${NC}\n"
