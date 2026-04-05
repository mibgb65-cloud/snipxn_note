#!/bin/bash
set -euo pipefail

# ========================================
#  Snipxn 一键部署脚本 (AlmaLinux 9)
# ========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO_URL="https://github.com/mibgb65-cloud/snipxn_note.git"
INSTALL_DIR="/opt/snipxn"
ENV_BACKUP_FILE=""

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════╗"
    echo "║       ✨ Snipxn 部署脚本 ✨          ║"
    echo "║       AlmaLinux 9 / RHEL 9           ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "\n${CYAN}====== $1 ======${NC}\n"; }

cleanup() {
    if [ -n "${ENV_BACKUP_FILE}" ] && [ -f "${ENV_BACKUP_FILE}" ]; then
        rm -f "${ENV_BACKUP_FILE}"
    fi
}

prompt_user() {
    local prompt="$1"
    local default_value="${2:-}"
    local choice=""

    if [ -r /dev/tty ]; then
        if ! read -r -p "$prompt" choice </dev/tty; then
            choice="$default_value"
        fi
    else
        choice="$default_value"
        log_warn "检测到非交互执行，使用默认选项: ${choice:-<empty>}" >&2
    fi

    echo "$choice"
}

open_editor() {
    local file_path="$1"
    local editor="${EDITOR:-vi}"

    if [ -r /dev/tty ]; then
        "$editor" "$file_path" </dev/tty >/dev/tty 2>/dev/tty
    else
        log_warn "当前没有可用终端，无法打开编辑器，请手动编辑: $file_path"
    fi
}

wait_for_service_state() {
    local service_name="$1"
    local expected_state="$2"
    local timeout_seconds="${3:-180}"
    local start_time
    local container_id=""
    local current_state=""

    start_time="$(date +%s)"
    while true; do
        container_id="$(docker compose ps -q "$service_name" 2>/dev/null || true)"

        if [ -n "$container_id" ]; then
            current_state="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"
            if [ "$current_state" = "$expected_state" ]; then
                log_info "服务 ${service_name} 状态正常: ${current_state}"
                return 0
            fi
        fi

        if [ $(( $(date +%s) - start_time )) -ge "$timeout_seconds" ]; then
            log_error "等待服务 ${service_name} 超时，当前状态: ${current_state:-unknown}"
            docker compose ps
            docker compose logs --tail=100 "$service_name" || true
            return 1
        fi

        sleep 5
    done
}

verify_http_endpoint() {
    local name="$1"
    local url="$2"
    local timeout_seconds="${3:-60}"
    local start_time

    start_time="$(date +%s)"
    while true; do
        if curl -fsS "$url" >/dev/null 2>&1; then
            log_info "${name} 可访问: ${url}"
            return 0
        fi

        if [ $(( $(date +%s) - start_time )) -ge "$timeout_seconds" ]; then
            log_error "${name} 校验失败: ${url}"
            return 1
        fi

        sleep 3
    done
}

get_env_value() {
    local key="$1"
    awk -F= -v key="$key" '
        $0 ~ "^[[:space:]]*" key "=" {
            value = substr($0, index($0, "=") + 1)
            sub(/[[:space:]]+#.*$/, "", value)
            sub(/^[[:space:]]+/, "", value)
            sub(/[[:space:]]+$/, "", value)
            print value
            exit
        }
    ' .env
}

trap cleanup EXIT

# ---- 检查 root 权限 ----
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 用户运行此脚本"
        exit 1
    fi
}

# ---- 系统更新 ----
system_update() {
    log_step "系统更新"
    choice="$(prompt_user "是否更新系统软件包？(y/N): " "n")"
    case "$choice" in
        y|Y)
            log_info "正在更新系统..."
            dnf update -y
            log_info "系统更新完成"
            ;;
        *)
            log_info "跳过系统更新"
            ;;
    esac
}

# ---- 安装基础工具 ----
install_basics() {
    log_step "安装基础工具"
    dnf install -y git curl wget vim tar dnf-plugins-core
    log_info "基础工具安装完成"
}

# ---- 安装 Docker ----
install_docker() {
    log_step "安装 Docker"

    if command -v docker &> /dev/null; then
        log_info "Docker 已安装: $(docker --version)"
        choice="$(prompt_user "是否重新安装 Docker？(y/N): " "n")"
        case "$choice" in
            y|Y) ;;
            *) return 0 ;;
        esac
    fi

    log_info "添加 Docker 仓库..."
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

    log_info "安装 Docker..."
    dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    log_info "启动 Docker..."
    systemctl start docker
    systemctl enable docker

    log_info "Docker 安装完成: $(docker --version)"
    log_info "Docker Compose: $(docker compose version)"
}

# ---- 配置防火墙 ----
setup_firewall() {
    log_step "配置防火墙"

    if ! systemctl is-active --quiet firewalld; then
        log_warn "firewalld 未运行，跳过防火墙配置"
        return 0
    fi

    log_info "开放 HTTP (80) 和 HTTPS (443) 端口..."
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    log_info "防火墙配置完成"
}

# ---- 克隆项目 ----
clone_project() {
    log_step "克隆项目"

    if [ -d "$INSTALL_DIR" ]; then
        log_warn "目录 $INSTALL_DIR 已存在"
        choice="$(prompt_user "是否删除并重新克隆？(y/N): " "n")"
        case "$choice" in
            y|Y)
                # 保留 .env 文件
                if [ -f "$INSTALL_DIR/.env" ]; then
                    ENV_BACKUP_FILE="$(mktemp /tmp/snipxn_env_backup.XXXXXX)"
                    cp "$INSTALL_DIR/.env" "$ENV_BACKUP_FILE"
                    log_info "已备份 .env 文件"
                fi
                rm -rf "$INSTALL_DIR"
                ;;
            *)
                log_info "使用已有项目，执行 git pull --ff-only..."
                cd "$INSTALL_DIR" && git pull --ff-only
                return 0
                ;;
        esac
    fi

    log_info "克隆项目到 $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"

    # 恢复 .env 备份
    if [ -n "${ENV_BACKUP_FILE}" ] && [ -f "${ENV_BACKUP_FILE}" ]; then
        cp "${ENV_BACKUP_FILE}" "$INSTALL_DIR/.env"
        rm -f "${ENV_BACKUP_FILE}"
        ENV_BACKUP_FILE=""
        log_info "已恢复 .env 文件"
    fi

    log_info "项目克隆完成"
}

# ---- 配置环境变量 ----
setup_env() {
    log_step "配置环境变量"

    cd "$INSTALL_DIR"

    if [ -f .env ]; then
        log_info ".env 文件已存在"
        choice="$(prompt_user "是否重新配置？(y/N): " "n")"
        case "$choice" in
            y|Y) ;;
            *)
                log_info "保留现有 .env 配置"
                return 0
                ;;
        esac
    fi

    cp .env.production .env
    log_info "已创建 .env 文件，请编辑填入实际密钥"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  请编辑 .env 文件填入真实密码和密钥${NC}"
    echo -e "${YELLOW}  文件路径: ${INSTALL_DIR}/.env${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    choice="$(prompt_user "现在编辑 .env 文件？(Y/n): " "Y")"
    case "$choice" in
        n|N)
            log_warn "请稍后手动编辑: vi ${INSTALL_DIR}/.env"
            ;;
        *)
            open_editor ".env"
            ;;
    esac
}

# ---- 构建并启动 ----
deploy() {
    log_step "构建并启动服务"

    cd "$INSTALL_DIR"

    if [ ! -f .env ]; then
        log_error ".env 文件不存在，请先配置环境变量"
        exit 1
    fi

    # 检查必填项，不直接 source .env，避免把配置当成 shell 代码执行
    local missing=0
    for var in DB_PASSWORD REDIS_PASSWORD RABBITMQ_PASSWORD JWT_SECRET; do
        val="$(get_env_value "$var")"
        if [ -z "$val" ] || [[ "$val" == CHANGE_ME* ]]; then
            log_error "必填变量 ${var} 未配置"
            missing=1
        fi
    done

    if [ $missing -eq 1 ]; then
        log_error "请先编辑 .env 文件: vi ${INSTALL_DIR}/.env"
        exit 1
    fi

    log_info "开始构建镜像（首次构建约需 5-10 分钟）..."
    docker compose build

    log_info "启动所有服务..."
    docker compose up -d

    log_info "等待服务通过健康检查..."
    wait_for_service_state postgres healthy 120
    wait_for_service_state redis healthy 120
    wait_for_service_state rabbitmq healthy 180
    wait_for_service_state backend healthy 300
    wait_for_service_state frontend healthy 120

    log_info "执行主机侧 HTTP 校验..."
    verify_http_endpoint "后端健康接口" "http://127.0.0.1:8080/actuator/health" 60
    verify_http_endpoint "前端首页" "http://127.0.0.1/healthz" 60

    echo ""
    log_step "部署完成"
    docker compose ps
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ Snipxn 部署成功！${NC}"
    echo -e "${GREEN}  🌐 访问: http://$(hostname -I | awk '{print $1}')${NC}"
    echo -e "${GREEN}  📁 项目目录: ${INSTALL_DIR}${NC}"
    echo ""
    echo -e "${GREEN}  常用命令:${NC}"
    echo -e "${GREEN}    查看状态: cd ${INSTALL_DIR} && docker compose ps${NC}"
    echo -e "${GREEN}    查看日志: cd ${INSTALL_DIR} && docker compose logs -f${NC}"
    echo -e "${GREEN}    重启服务: cd ${INSTALL_DIR} && docker compose restart${NC}"
    echo -e "${GREEN}    停止服务: cd ${INSTALL_DIR} && docker compose down${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ---- 主流程 ----
main() {
    print_banner
    check_root
    system_update
    install_basics
    install_docker
    setup_firewall
    clone_project
    setup_env
    deploy
}

main "$@"
