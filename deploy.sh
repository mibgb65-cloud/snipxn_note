#!/bin/bash
set -e

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
    read -p "是否更新系统软件包？(y/N): " choice
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
    dnf install -y git curl wget vim tar
    log_info "基础工具安装完成"
}

# ---- 安装 Docker ----
install_docker() {
    log_step "安装 Docker"

    if command -v docker &> /dev/null; then
        log_info "Docker 已安装: $(docker --version)"
        read -p "是否重新安装 Docker？(y/N): " choice
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
        read -p "是否删除并重新克隆？(y/N): " choice
        case "$choice" in
            y|Y)
                # 保留 .env 文件
                if [ -f "$INSTALL_DIR/.env" ]; then
                    cp "$INSTALL_DIR/.env" /tmp/snipxn_env_backup
                    log_info "已备份 .env 文件"
                fi
                rm -rf "$INSTALL_DIR"
                ;;
            *)
                log_info "使用已有项目，执行 git pull..."
                cd "$INSTALL_DIR" && git pull
                return 0
                ;;
        esac
    fi

    log_info "克隆项目到 $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"

    # 恢复 .env 备份
    if [ -f /tmp/snipxn_env_backup ]; then
        cp /tmp/snipxn_env_backup "$INSTALL_DIR/.env"
        rm -f /tmp/snipxn_env_backup
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
        read -p "是否重新配置？(y/N): " choice
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
    read -p "现在编辑 .env 文件？(Y/n): " choice
    case "$choice" in
        n|N)
            log_warn "请稍后手动编辑: vi ${INSTALL_DIR}/.env"
            ;;
        *)
            vi .env
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

    # 检查必填项
    source .env
    local missing=0
    for var in DB_PASSWORD REDIS_PASSWORD RABBITMQ_PASSWORD JWT_SECRET; do
        val=$(grep "^${var}=" .env | cut -d'=' -f2-)
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
