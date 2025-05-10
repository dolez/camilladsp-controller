# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CamillaDSP Controller is a web-based interface for managing and controlling CamillaDSP instances running on networked devices (primarily on Raspberry Pi/DietPi systems). CamillaDSP is an audio processing tool that applies digital filters and processing to audio streams. The system creates a distributed audio processing network with multiple devices that automatically discover each other.

## Architecture

The project consists of:

1. **Frontend**: A Preact-based web application with components to visualize and control audio processing:
   - UI components for displaying audio metrics (VU meters, CPU load)
   - Controls for adjusting audio parameters (filters, gains, etc.)
   - Virtual rack interface for monitoring and controlling multiple CamillaDSP nodes
   - Real-time signal visualization and audio processing metrics

2. **Backend**: A Node.js server that:
   - Serves the web application
   - Provides API endpoints for file management (audio configs, filter coefficients)
   - Handles service discovery using Avahi/Bonjour
   - Provides real-time updates via SSE (Server-Sent Events)
   - Monitors the network for CamillaDSP nodes

3. **DietPi Integration**: Configuration files for deploying on DietPi systems (Raspberry Pi)
   - Automatic role detection (master or node)
   - WiFi access point for the master node
   - Avahi service advertising for node discovery
   - Systemd services for monitoring and management
   - Audio device configuration (WM8960 sound card support)

## Key Components

- **CamillaClient (src/services/camilla/CamillaClient.js)**: WebSocket client to communicate with CamillaDSP instances, handles metrics polling and configuration updates
- **DiscoveryClient (src/services/discovery/DiscoveryClient.js)**: Handles discovery of CamillaDSP instances on the network using Avahi/Bonjour
- **CamillaRack (src/components/Rack/CamillaRack.jsx)**: Virtual rack interface for controlling multiple CamillaDSP nodes
- **NodeMetrics (src/components/NodeMetrics.jsx)**: Displays audio processing metrics like CPU load, signal levels
- **FileService (src/services/files/FileService.js)**: Manages configuration files and filter coefficients

## Audio Processing Features

- Real-time adjustment of audio filter parameters
- Mixer control for multi-channel audio processing
- Convolution processing with custom impulse responses
- Signal level monitoring with VU meters
- CPU load monitoring to prevent audio dropouts
- Configuration saving and loading
- Pipeline bypass controls

## Development Commands

```bash
# Start development server
npm run dev

# Setup connection to Raspberry Pi for development
npm run dev:pi:setup

# Development with live sync to Raspberry Pi
npm run dev:pi

# Build for production
npm run build

# Development build
npm run build:dev

# Run storybook UI component development environment
npm run storybook

# Run linter
npm run lint

# Start server with nodemon (auto-restart on changes)
npm run server

# Run mock CamillaDSP nodes for testing
npm run mock:nodes
```

## DietPi Deployment

The project includes configuration for deploying to DietPi systems with two roles:

### Master Node
- Acts as WiFi access point (hostapd) to create a dedicated audio network
- Provides DHCP service (dnsmasq) for node IP assignment
- Hosts the web controller interface (nginx)
- Monitors and discovers all nodes using Avahi
- **Also runs its own CamillaDSP instance for audio processing**
- Functions as both the network infrastructure and an audio processing node

### Audio Nodes
- Connect to the master's WiFi network
- Advertise their CamillaDSP service via Avahi
- Run CamillaDSP for audio processing
- Auto-configure based on unique device ID derived from MAC address
- Can be added to the network at any time with automatic discovery

### Image Building Process

The project uses a custom image building script (`dietPi/scripts/build-dietpi.sh`) to create optimized DietPi images with all necessary configuration:

- Supports both Raspberry Pi and Radxa Zero 3 hardware platforms
- Downloads and modifies official DietPi base images
- Installs required packages: alsa-utils, hostapd, dnsmasq, avahi-daemon, nginx, etc.
- Configures system services and authentication
- Downloads and installs CamillaDSP (v3.0.0)
- Sets up WiFi access point, DHCP, and console over USB
- Configures default credentials (user: dietpi/root, password: camilladsp)
- Disables unnecessary services to optimize performance
- Minimizes image size for efficient deployment
- Outputs compressed images ready for flashing to SD cards

### Key Service Files
- `dietPi/overlays/root/etc/systemd/system/camilladsp.service`: Runs the CamillaDSP audio processing service on all nodes
- `dietPi/overlays/root/etc/systemd/system/camilladsp-monitor.service`: Monitors and discovers CamillaDSP nodes on the network
- `dietPi/overlays/root/etc/systemd/system/camilladsp-role.service`: Detects and configures the device's role (master or node)
- `dietPi/overlays/root/usr/local/bin/detect-role.sh`: Script that determines if device should be master or node
- `dietPi/overlays/root/usr/local/bin/camilladsp-monitor.sh`: Script that monitors Avahi for node discovery
- `dietPi/overlays/root/usr/local/bin/sse_handler.sh`: Handles Server-Sent Events for real-time updates
- `dietPi/overlays/root/etc/avahi/services/camilladsp.service`: Avahi service definition for advertising CamillaDSP instances
- `dietPi/overlays/root/etc/nginx/sites-enabled/camilladsp.conf`: Nginx configuration for hosting the web interface

## Networking and Communication

1. The frontend communicates with CamillaDSP instances directly using WebSockets (port 1234)
2. The backend server uses Socket.io for real-time updates about discovered nodes
3. Node discovery uses Avahi/Bonjour with a custom `_camilladsp._tcp` service type
4. SSE (Server-Sent Events) for real-time updates from the backend monitor service
5. All nodes (including the master) advertise themselves on the network via Avahi
6. The master node creates the WiFi network all other nodes connect to

## Auto-Discovery System

1. `camilladsp-role.service` runs at boot to determine if the device should be a master or node:
   - Scans for existing CamillaDSP WiFi network
   - If found, becomes a node and connects to it
   - If not found, becomes the master and creates the network
   - Assigns a unique hostname based on the device's MAC address

2. `camilladsp-monitor.service` monitors the network for CamillaDSP services:
   - Uses Avahi to discover nodes advertising the `_camilladsp._tcp` service
   - Provides a REST API endpoint for the frontend to query available nodes
   - Sends real-time updates using SSE when nodes connect or disconnect
   - Maintains a JSON file at `/tmp/camilladsp_nodes.json` with current node status

## Audio Configuration

- CamillaDSP configurations are stored in `/var/camilladsp/configs/`
- Filter coefficient files are stored in `/var/camilladsp/coeffs/`
- State information is maintained in `/var/camilladsp/statefile.yml`
- Sound card configuration is handled by ALSA state files

## Authentication and Access

- Default login credentials for SSH access:
  - Username: `root` or `dietpi`
  - Password: `camilladsp`
- Web interface is accessible at:
  - Master node: `http://dietpi.local` or `http://192.168.4.1`
  - Audio nodes: `http://node-XXXX.local` (where XXXX are the last 4 characters of the node's MAC address)
- The master node acts as the gateway with a fixed IP of 192.168.4.1
- Console access is also available via USB serial connection (ttyGS0)

## Codebase Structure Notes

- React-like components are implemented using Preact for smaller bundle size
- State management uses Preact Signals (@preact/signals)
- UI components use a design system inspired by Shadcn UI
- WebSocket communication is used for real-time monitoring of audio metrics
- Server-side utilities for service discovery and monitoring
- Storybook integration for UI component development