#!/bin/bash

# Virion Labs Discord Bot - Multi-Client Monitoring Script
# Usage: ./monitor-bots.sh [command]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}$1${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get all Virion bot containers
get_bot_containers() {
    docker ps -a --filter "name=virion-bot-*" --format "{{.Names}}" | sort
}

get_running_bot_containers() {
    docker ps --filter "name=virion-bot-*" --format "{{.Names}}" | sort
}

# Show usage
show_usage() {
    echo "Virion Labs Discord Bot - Multi-Client Monitor"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status    - Show status of all bot instances (default)"
    echo "  logs      - Show recent logs from all bots"
    echo "  health    - Check health endpoints for all running bots"
    echo "  start     - Start all stopped bot containers"
    echo "  stop      - Stop all running bot containers"
    echo "  restart   - Restart all bot containers"
    echo "  clean     - Remove stopped bot containers"
    echo "  stats     - Show resource usage statistics"
    echo "  list      - List all bot containers"
    echo "  help      - Show this help message"
    echo ""
    echo "Individual bot management:"
    echo "  $0 logs <client-name>     - Show logs for specific client"
    echo "  $0 start <client-name>    - Start specific client bot"
    echo "  $0 stop <client-name>     - Stop specific client bot"
    echo "  $0 restart <client-name>  - Restart specific client bot"
    echo ""
}

# Show status of all bots
show_status() {
    print_header "🤖 Virion Labs Discord Bot - Status Report"
    echo "======================================================"
    
    local containers=$(get_bot_containers)
    
    if [ -z "$containers" ]; then
        print_warning "No Virion bot containers found"
        echo ""
        print_status "To deploy a new client bot, use: ./deploy-client.sh CLIENT_NAME BOT_TOKEN GUILD_ID"
        return
    fi
    
    local total_count=0
    local running_count=0
    local stopped_count=0
    
    echo ""
    printf "%-25s %-12s %-8s %-12s %-10s\n" "CLIENT" "STATUS" "PORT" "UPTIME" "HEALTH"
    printf "%-25s %-12s %-8s %-12s %-10s\n" "$(printf '%*s' 25 | tr ' ' '-')" "$(printf '%*s' 12 | tr ' ' '-')" "$(printf '%*s' 8 | tr ' ' '-')" "$(printf '%*s' 12 | tr ' ' '-')" "$(printf '%*s' 10 | tr ' ' '-')"
    
    for container in $containers; do
        total_count=$((total_count + 1))
        
        # Extract client name from container name
        client_name=$(echo $container | sed 's/virion-bot-//')
        
        # Get container status
        status=$(docker inspect --format='{{.State.Status}}' $container 2>/dev/null)
        
        if [ "$status" = "running" ]; then
            running_count=$((running_count + 1))
            status_color="${GREEN}RUNNING${NC}"
            
            # Get port mapping
            port=$(docker port $container 3001/tcp 2>/dev/null | cut -d: -f2)
            if [ -z "$port" ]; then
                port="N/A"
            fi
            
            # Get uptime
            uptime=$(docker inspect --format='{{.State.StartedAt}}' $container 2>/dev/null | xargs -I {} date -d {} +%s 2>/dev/null)
            if [ -n "$uptime" ]; then
                current_time=$(date +%s)
                uptime_seconds=$((current_time - uptime))
                if [ $uptime_seconds -lt 60 ]; then
                    uptime_display="${uptime_seconds}s"
                elif [ $uptime_seconds -lt 3600 ]; then
                    uptime_display="$((uptime_seconds / 60))m"
                elif [ $uptime_seconds -lt 86400 ]; then
                    uptime_display="$((uptime_seconds / 3600))h"
                else
                    uptime_display="$((uptime_seconds / 86400))d"
                fi
            else
                uptime_display="N/A"
            fi
            
            # Check health endpoint
            if [ "$port" != "N/A" ]; then
                if curl -s --max-time 2 "http://localhost:$port/health" > /dev/null 2>&1; then
                    health="${GREEN}OK${NC}"
                else
                    health="${RED}FAIL${NC}"
                fi
            else
                health="N/A"
            fi
            
        else
            stopped_count=$((stopped_count + 1))
            status_color="${RED}STOPPED${NC}"
            port="N/A"
            uptime_display="N/A"
            health="N/A"
        fi
        
        printf "%-25s %-20s %-8s %-12s %-18s\n" "$client_name" "$status_color" "$port" "$uptime_display" "$health"
    done
    
    echo ""
    print_header "📊 Summary"
    echo "Total bots: $total_count"
    echo -e "Running: ${GREEN}$running_count${NC}"
    echo -e "Stopped: ${RED}$stopped_count${NC}"
    echo ""
}

# Show logs from all bots
show_logs() {
    local specific_client="$1"
    
    if [ -n "$specific_client" ]; then
        local container="virion-bot-$specific_client"
        if docker ps -a --format '{{.Names}}' | grep -q "^$container$"; then
            print_header "📋 Logs for $specific_client"
            echo "======================================================"
            docker logs --tail=50 "$container"
        else
            print_error "Bot container not found: $container"
        fi
        return
    fi
    
    print_header "📋 Recent Logs from All Bots"
    echo "======================================================"
    
    local containers=$(get_bot_containers)
    
    if [ -z "$containers" ]; then
        print_warning "No bot containers found"
        return
    fi
    
    for container in $containers; do
        client_name=$(echo $container | sed 's/virion-bot-//')
        echo ""
        echo -e "${CYAN}--- $client_name ---${NC}"
        docker logs --tail=10 "$container" 2>&1 | sed 's/^/  /'
    done
    echo ""
}

# Check health endpoints
check_health() {
    print_header "🏥 Health Check Report"
    echo "======================================================"
    
    local containers=$(get_running_bot_containers)
    
    if [ -z "$containers" ]; then
        print_warning "No running bot containers found"
        return
    fi
    
    local healthy_count=0
    local unhealthy_count=0
    
    for container in $containers; do
        client_name=$(echo $container | sed 's/virion-bot-//')
        port=$(docker port $container 3001/tcp 2>/dev/null | cut -d: -f2)
        
        if [ -n "$port" ]; then
            if curl -s --max-time 5 "http://localhost:$port/health" > /dev/null 2>&1; then
                print_success "$client_name (port $port) - Healthy"
                healthy_count=$((healthy_count + 1))
            else
                print_error "$client_name (port $port) - Unhealthy"
                unhealthy_count=$((unhealthy_count + 1))
            fi
        else
            print_warning "$client_name - No port mapping found"
            unhealthy_count=$((unhealthy_count + 1))
        fi
    done
    
    echo ""
    echo -e "Healthy: ${GREEN}$healthy_count${NC}"
    echo -e "Unhealthy: ${RED}$unhealthy_count${NC}"
    echo ""
}

# Show resource statistics
show_stats() {
    print_header "📊 Resource Usage Statistics"
    echo "======================================================"
    
    local containers=$(get_running_bot_containers)
    
    if [ -z "$containers" ]; then
        print_warning "No running bot containers found"
        return
    fi
    
    echo ""
    printf "%-25s %-15s %-15s %-10s\n" "CLIENT" "MEMORY" "CPU" "NET I/O"
    printf "%-25s %-15s %-15s %-10s\n" "$(printf '%*s' 25 | tr ' ' '-')" "$(printf '%*s' 15 | tr ' ' '-')" "$(printf '%*s' 15 | tr ' ' '-')" "$(printf '%*s' 10 | tr ' ' '-')"
    
    for container in $containers; do
        client_name=$(echo $container | sed 's/virion-bot-//')
        stats=$(docker stats --no-stream --format "{{.MemUsage}}\t{{.CPUPerc}}\t{{.NetIO}}" $container 2>/dev/null)
        
        if [ -n "$stats" ]; then
            memory=$(echo "$stats" | cut -f1)
            cpu=$(echo "$stats" | cut -f2)
            netio=$(echo "$stats" | cut -f3)
            printf "%-25s %-15s %-15s %-10s\n" "$client_name" "$memory" "$cpu" "$netio"
        else
            printf "%-25s %-15s %-15s %-10s\n" "$client_name" "N/A" "N/A" "N/A"
        fi
    done
    echo ""
}

# Individual container management
manage_individual() {
    local action="$1"
    local client_name="$2"
    local container="virion-bot-$client_name"
    
    if ! docker ps -a --format '{{.Names}}' | grep -q "^$container$"; then
        print_error "Bot container not found: $container"
        return 1
    fi
    
    case $action in
        "start")
            print_status "Starting $client_name..."
            if docker start "$container" > /dev/null 2>&1; then
                print_success "$client_name started"
            else
                print_error "Failed to start $client_name"
            fi
            ;;
        "stop")
            print_status "Stopping $client_name..."
            if docker stop "$container" > /dev/null 2>&1; then
                print_success "$client_name stopped"
            else
                print_error "Failed to stop $client_name"
            fi
            ;;
        "restart")
            print_status "Restarting $client_name..."
            if docker restart "$container" > /dev/null 2>&1; then
                print_success "$client_name restarted"
            else
                print_error "Failed to restart $client_name"
            fi
            ;;
    esac
}

# Main script logic
case "${1:-status}" in
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "health")
        check_health
        ;;
    "start")
        if [ -n "$2" ]; then
            manage_individual "start" "$2"
        else
            # Start all stopped containers
            print_status "Starting all stopped bot containers..."
            local containers=$(docker ps -a --filter "name=virion-bot-*" --filter "status=exited" --format "{{.Names}}")
            if [ -z "$containers" ]; then
                print_success "All bot containers are already running"
            else
                for container in $containers; do
                    client_name=$(echo $container | sed 's/virion-bot-//')
                    print_status "Starting $client_name..."
                    if docker start "$container" > /dev/null 2>&1; then
                        print_success "$client_name started"
                    else
                        print_error "Failed to start $client_name"
                    fi
                done
            fi
        fi
        ;;
    "stop")
        if [ -n "$2" ]; then
            manage_individual "stop" "$2"
        else
            # Stop all running containers
            print_status "Stopping all running bot containers..."
            local containers=$(get_running_bot_containers)
            if [ -z "$containers" ]; then
                print_success "No running bot containers found"
            else
                for container in $containers; do
                    client_name=$(echo $container | sed 's/virion-bot-//')
                    print_status "Stopping $client_name..."
                    if docker stop "$container" > /dev/null 2>&1; then
                        print_success "$client_name stopped"
                    else
                        print_error "Failed to stop $client_name"
                    fi
                done
            fi
        fi
        ;;
    "restart")
        if [ -n "$2" ]; then
            manage_individual "restart" "$2"
        else
            # Restart all containers
            print_status "Restarting all bot containers..."
            local containers=$(get_bot_containers)
            if [ -z "$containers" ]; then
                print_warning "No bot containers found"
            else
                for container in $containers; do
                    client_name=$(echo $container | sed 's/virion-bot-//')
                    print_status "Restarting $client_name..."
                    if docker restart "$container" > /dev/null 2>&1; then
                        print_success "$client_name restarted"
                    else
                        print_error "Failed to restart $client_name"
                    fi
                done
            fi
        fi
        ;;
    "stats")
        show_stats
        ;;
    "clean")
        # Clean up stopped containers
        print_status "Removing stopped bot containers..."
        local containers=$(docker ps -a --filter "name=virion-bot-*" --filter "status=exited" --format "{{.Names}}")
        if [ -z "$containers" ]; then
            print_success "No stopped containers to clean"
        else
            for container in $containers; do
                client_name=$(echo $container | sed 's/virion-bot-//')
                print_status "Removing $client_name..."
                if docker rm "$container" > /dev/null 2>&1; then
                    print_success "$client_name removed"
                else
                    print_error "Failed to remove $client_name"
                fi
            done
        fi
        ;;
    "list")
        print_header "📋 All Virion Bot Containers"
        echo "======================================================"
        local containers=$(get_bot_containers)
        if [ -z "$containers" ]; then
            print_warning "No bot containers found"
        else
            docker ps -a --filter "name=virion-bot-*" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}"
        fi
        echo ""
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac 