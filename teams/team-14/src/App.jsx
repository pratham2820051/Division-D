import React, { useState, useEffect, useCallback } from 'react';

// Mock DB of analyzed devices with specific recommendations matching recommendations_audit_report/code.html
const MOCK_DEVICES = [
  {
    id: 'dev-1',
    name: 'Smart Thermostat Pro v2.4',
    filename: 'smart_thermostat_spec_v2.4.pdf',
    date: '2026-05-30',
    size: '14.2 MB',
    type: 'IoT Climate Controller',
    manufacturer: 'ThermoCorp',
    model: 'TC-240',
    firmware: 'v2.4-stable',
    score: 78,
    projectedScore: 90,
    risk: 'Medium Risk',
    vulns: { critical: 1, high: 4, medium: 8, low: 12 },
    topFinding: 'BLE Broadcast exposes plaintext room occupancy data',
    criticalRisks: [
      { id: 'cr-1', title: 'Hardcoded SSH Credentials', desc: 'Firmware binary contains static password hashes for root SSH access.', icon: 'warning' },
      { id: 'cr-2', title: 'Plaintext BLE Telemetry Sniffing', desc: 'Local telemetry data, including room occupancy and temperatures, broadcast in plaintext.', icon: 'gpp_bad' }
    ],
    exposedAPIs: '2 endpoints open to local subnets. API authorization checks missing.',
    openPorts: 'Port 22 (SSH) and Port 1883 (MQTT) currently active.',
    networkConfig: 'Plaintext BLE transmissions active. Encrypted BLE pairing required.',
    extractedSpecs: {
      manufacturer: 'ThermoCorp',
      device_name: 'Smart Thermostat Pro v2.4',
      model_number: 'TC-240',
      device_type: 'IoT Climate Controller',
      power_requirements: ['24 VAC', 'C-Wire'],
      firmware_version: 'v2.4-stable',
      communication_protocols: ['MQTT', 'BLE', 'Wi-Fi'],
      open_ports: [22, 1883],
      connectivity: ['Wi-Fi', 'Bluetooth Low Energy'],
      physical_interfaces: ['UART'],
      authentication_methods: ['Passwords', 'Device PIN'],
      security_features: ['Secure Boot', 'AES-128 Encryption'],
      api_support: ['REST API'],
      update_mechanism: 'OTA (Over-the-Air)'
    },
    vulnerabilityList: [
      { id: 'v-1', title: 'Hardcoded SSH Credentials', severity: 'Critical', likelihood: 5, impact: 5, desc: 'Firmware binary contains static password hashes for the root user on active port 22.', mitigation: 'Deploy firmware update with dynamic, key-based SSH authentication.' },
      { id: 'v-2', title: 'Unencrypted BLE Transmission', severity: 'High', likelihood: 4, impact: 4, desc: 'Local telemetry data, including room occupancy and temperatures, broadcast in plaintext.', mitigation: 'Implement BLE cryptographic pairing and payload encryption.' },
      { id: 'v-3', title: 'UART Interface Exposed', severity: 'High', likelihood: 3, impact: 5, desc: 'Physical circuit board leaves debugging pin headers unmasked, allowing raw memory dumps.', mitigation: 'Conceal or disable JTAG/UART traces on production board revisions.' },
      { id: 'v-4', title: 'Lack of TLS Certificate Validation', severity: 'Medium', likelihood: 3, impact: 3, desc: 'Firmware API calls fail to verify server certificates, exposing the device to MitM attacks.', mitigation: 'Strictly enforce CA cert checks in SSL connection callbacks.' },
      { id: 'v-5', title: 'Outdated Linux Kernel (v4.9)', severity: 'Low', likelihood: 2, impact: 2, desc: 'Operating system is subject to known local privilege escalation exploits.', mitigation: 'Recompile kernel to v5.15 LTS branch.' }
    ],
    recommendations: [
      { id: 'r-1', severity: 'Critical', title: 'Hardcoded SSH root password', action: 'Disable SSH password logins. Enforce active key-based auth.', scoreReward: 5 },
      { id: 'r-2', severity: 'High', title: 'Plaintext BLE Telemetry Sniffing', action: 'Implement BLE cryptographic paired security keys.', scoreReward: 4 },
      { id: 'r-3', severity: 'Medium', title: 'Missing JTAG debug concealment', action: 'Disable JTAG debug routes on production compile flags.', scoreReward: 2 },
      { id: 'r-4', severity: 'Low', title: 'Implicit SSL Trust Certs', action: 'Inject strict root certificate verification callbacks.', scoreReward: 1 }
    ],
    owaspMappings: [
      {
        owasp_category: "I1 - Weak, Guessable, or Hardcoded Passwords",
        severity: "Critical",
        evidence: "Hardcoded SSH Credentials",
        reason: "Firmware binary contains static password hashes for root SSH access on port 22.",
        affected_surfaces: ["Console Port", "SSH"]
      },
      {
        owasp_category: "I7 - Insecure Data Transfer and Storage",
        severity: "High",
        evidence: "Plaintext BLE Telemetry",
        reason: "Local temperature and room occupancy data broadcast in plaintext without encryption.",
        affected_surfaces: ["Bluetooth / BLE"]
      }
    ],
    securityScoring: {
      security_score: 78,
      risk_level: "Medium Risk",
      positive_contributors: [
        "Encrypted HTTPS traffic supported (+5)",
        "Secure Boot loader verification (+5)",
        "AES-128 Encryption features (+2)"
      ],
      negative_contributors: [
        "Unencrypted HTTP protocol detected (-5)",
        "Exposed UART Serial debugging interface (-8)",
        "No automated OTA update verification (-10)"
      ],
      reason_for_score: "The device has a safety rating of 78 (Medium Risk). It benefits from HTTPS transport and Secure Boot loader, but is heavily degraded by exposed UART pins on the physical board and the lack of cryptographic verification for OTA firmware updates.",
      score_breakdown: [
        { category: "Network Services", item: "HTTP",    applied: true,  change: -5,  description: "Unencrypted HTTP exposes management interface to credential sniffing." },
        { category: "Network Services", item: "HTTPS",   applied: true,  change: 5,   description: "HTTPS enforces TLS encryption on all management API calls." },
        { category: "Network Services", item: "FTP",     applied: false, change: 0,   description: "No cleartext FTP protocol detected." },
        { category: "Network Services", item: "RTSP",    applied: false, change: 0,   description: "No unsecured RTSP protocol detected." },
        { category: "Network Services", item: "SMTP",    applied: false, change: 0,   description: "No SMTP mail services detected." },
        { category: "API Exposure",     item: "ONVIF",   applied: false, change: 0,   description: "ONVIF ecosystem API exposure not detected." },
        { category: "API Exposure",     item: "ISAPI",   applied: false, change: 0,   description: "ISAPI API exposure not detected." },
        { category: "Authentication",   item: "Password Protection", applied: true, change: 5, description: "Password verification acts as a baseline access control barrier." },
        { category: "Authentication",   item: "User Roles Present",  applied: false, change: 0, description: "No granular user roles documented." },
        { category: "Authentication",   item: "No Authentication",   applied: false, change: 0, description: "Authentication is enforced." },
        { category: "Security Features",item: "Illegal Login Detection", applied: false, change: 0, description: "No brute force login lockout documented." },
        { category: "Security Features",item: "Privacy Mask",         applied: false, change: 0, description: "No privacy masking documented." },
        { category: "Security Features",item: "Watermark",            applied: false, change: 0, description: "No video watermarking documented." },
        { category: "Security Features",item: "IP67 Protection",      applied: false, change: 0, description: "No IP67 protection rating documented." },
        { category: "Firmware Updates", item: "Missing Update Mechanism", applied: true, change: -10, description: "No secure automated update mechanism blocks immediate CVE patching." },
      ]
    },
    attackSurfaces: [
      { surface_name: "HTTP", surface_category: "Network Surface", evidence: "communication_protocols: MQTT, BLE, Wi-Fi", description: "Unencrypted HTTP exposes web management and API endpoints to credential theft and MitM attacks.", risk_level: "High" },
      { surface_name: "MQTT", surface_category: "Network Surface", evidence: "Port 1883 open", description: "Unencrypted MQTT on port 1883 exposes device telemetry to network eavesdropping.", risk_level: "High" },
      { surface_name: "REST API", surface_category: "API Surface", evidence: "api_support: REST API", description: "REST API endpoints exposed to local subnet without strict authorization checks.", risk_level: "Medium" },
      { surface_name: "UART Console", surface_category: "Physical Surface", evidence: "physical_interfaces: UART", description: "Physical UART interface may expose root shell access on debug pins.", risk_level: "High" },
      { surface_name: "Bluetooth / BLE", surface_category: "Wireless Surface", evidence: "connectivity: Bluetooth Low Energy", description: "BLE transmissions without cryptographic pairing expose telemetry in plaintext.", risk_level: "High" },
      { surface_name: "Wi-Fi", surface_category: "Wireless Surface", evidence: "connectivity: Wi-Fi", description: "Wi-Fi connectivity expands the wireless attack surface for sniffing and deauth attacks.", risk_level: "Medium" },
      { surface_name: "Password Authentication", surface_category: "Authentication Surface", evidence: "authentication_methods: Passwords", description: "Password-based authentication is susceptible to brute force without lockout mechanisms.", risk_level: "Medium" },
    ],
  },
  {
    id: 'dev-2',
    name: 'IP Camera Dome Security Spec',
    filename: 'ip_cam_dome_specifications.pdf',
    date: '2026-05-28',
    size: '8.7 MB',
    type: 'IoT Sensor Gateway',
    manufacturer: 'DomeSafe',
    model: 'DM-500',
    firmware: 'v1.1-stable',
    score: 42,
    projectedScore: 82,
    risk: 'Critical Risk',
    vulns: { critical: 5, high: 12, medium: 15, low: 22 },
    topFinding: 'Unencrypted RTMP stream accessible on subnet without auth',
    criticalRisks: [
      { id: 'cr-3', title: 'Unauthenticated RTMP video stream', desc: 'Video feed stream does not require authentication over local subnet.', icon: 'warning' },
      { id: 'cr-4', title: 'Exposed command injection in CGI settings', desc: 'Unsanitized input in network settings allows remote root command execution.', icon: 'gpp_bad' }
    ],
    exposedAPIs: '5 endpoints open without authentication controls.',
    openPorts: 'Port 80 (HTTP), Port 554 (RTSP), and Port 1935 (RTMP) active.',
    networkConfig: 'Unsegmented video broadcast stream. Enforce dedicated VLAN routing.',
    extractedSpecs: {
      manufacturer: 'DomeSafe',
      device_name: 'IP Camera Dome Security Spec',
      model_number: 'DM-500',
      device_type: 'IoT Sensor Gateway',
      power_requirements: ['12V DC', 'PoE (Power over Ethernet)'],
      firmware_version: 'v1.1-stable',
      communication_protocols: ['RTSP', 'RTMP', 'HTTP', 'HTTPS'],
      open_ports: [80, 554, 1935],
      connectivity: ['Ethernet (RJ45)', 'PoE'],
      physical_interfaces: ['RJ45 Ethernet', 'MicroSD Slot'],
      authentication_methods: ['Basic Authentication', 'Digest Authentication'],
      security_features: ['None Documented'],
      api_support: ['ONVIF Profile S', 'CGI Settings API'],
      update_mechanism: 'Manual Web Interface upload'
    },
    vulnerabilityList: [
      { id: 'v-6', title: 'Exposed RTMP Stream Access', severity: 'Critical', likelihood: 5, impact: 5, desc: 'Video feed stream does not require authentication over local subnet.', mitigation: 'Enforce RTSP/RTMP authentication keys in firmware config.' },
      { id: 'v-7', title: 'Web Console Command Injection', severity: 'Critical', likelihood: 4, impact: 5, desc: 'Unsanitized input in network settings allows remote root command execution.', mitigation: 'Filter shell special characters and use parameterized exec commands.' },
      { id: 'v-8', title: 'No Secure Boot Loader', severity: 'High', likelihood: 4, impact: 4, desc: 'Bootloader accepts unsigned custom kernel binaries via TFTP update interface.', mitigation: 'Enable secure hardware enclave hash checks before executing boot code.' }
    ],
    recommendations: [
      { id: 'r-5', severity: 'Critical', title: 'RTMP Authentication Exposure', action: 'Enforce strong SHA256 security handshakes for stream protocols.', scoreReward: 15 },
      { id: 'r-6', severity: 'Critical', title: 'CGI Dashboard Command Injection', action: 'Sanitize console shell parameter variables in compile scripts.', scoreReward: 15 },
      { id: 'r-7', severity: 'High', title: 'Unsigned Firmware Boot Execution', action: 'Deploy trusted secure enclave keys check prior to loading kernel.', scoreReward: 10 }
    ],
    owaspMappings: [
      {
        owasp_category: "I2 - Insecure Network Services",
        severity: "Critical",
        evidence: "HTTP and RTSP protocols detected",
        reason: "Unencrypted management and media services increase the remote exploit exposure.",
        affected_surfaces: ["HTTP", "RTSP"]
      },
      {
        owasp_category: "I3 - Insecure Ecosystem Interfaces",
        severity: "Critical",
        evidence: "ONVIF and CGI Settings API",
        reason: "Exposed API endpoints permit administrative actions without access checks.",
        affected_surfaces: ["ONVIF", "ISAPI"]
      }
    ],
    securityScoring: {
      security_score: 42,
      risk_level: "Critical Risk",
      positive_contributors: [
        "Password Authentication configured (+5)",
        "Basic & Digest Access controls (+3)"
      ],
      negative_contributors: [
        "No active system logging or monitoring (-15)",
        "Missing automated signed OTA firmware updates (-10)",
        "Unencrypted HTTP protocol detected (-5)",
        "Unsecured RTSP video streaming protocol detected (-5)"
      ],
      reason_for_score: "The Dome Camera Dome DM-500 is assigned a security score of 42 (Critical Risk). It fails to implement system-wide auditing logs or secure OTA updates, and broadcasts video streams and management credentials in plaintext over unencrypted channels.",
      score_breakdown: [
        { category: "Network Services", item: "HTTP",    applied: true,  change: -5,  description: "Unencrypted HTTP exposes management interface to credential sniffing." },
        { category: "Network Services", item: "HTTPS",   applied: false, change: 0,   description: "Secure HTTPS traffic not documented." },
        { category: "Network Services", item: "FTP",     applied: false, change: 0,   description: "No cleartext FTP protocol detected." },
        { category: "Network Services", item: "RTSP",    applied: true,  change: -5,  description: "Unsecured RTSP protocol detected, exposing video streams." },
        { category: "Network Services", item: "SMTP",    applied: false, change: 0,   description: "No SMTP mail services detected." },
        { category: "API Exposure",     item: "ONVIF",   applied: true,  change: -3,  description: "ONVIF API support exposed on public ports." },
        { category: "API Exposure",     item: "ISAPI",   applied: false, change: 0,   description: "ISAPI API exposure not detected." },
        { category: "Authentication",   item: "Password Protection", applied: true, change: 5, description: "Password verification acts as a baseline access control barrier." },
        { category: "Authentication",   item: "User Roles Present",  applied: false, change: 0, description: "No granular user roles documented." },
        { category: "Authentication",   item: "No Authentication",   applied: false, change: 0, description: "Authentication is enforced." },
        { category: "Security Features",item: "Illegal Login Detection", applied: false, change: 0, description: "No brute force login lockout documented." },
        { category: "Security Features",item: "Privacy Mask",         applied: false, change: 0, description: "No privacy masking documented." },
        { category: "Security Features",item: "Watermark",            applied: false, change: 0, description: "No video watermarking documented." },
        { category: "Security Features",item: "IP67 Protection",      applied: false, change: 0, description: "No IP67 protection rating documented." },
        { category: "Firmware Updates", item: "Missing Update Mechanism", applied: true, change: -10, description: "No secure automated update mechanism blocks immediate CVE patching." },
      ]
    },
    attackSurfaces: [
      { surface_name: "HTTP", surface_category: "Network Surface", evidence: "communication_protocols: RTSP, RTMP, HTTP, HTTPS", description: "Unencrypted HTTP exposes web management and API endpoints to credential theft and MitM attacks.", risk_level: "High" },
      { surface_name: "RTSP", surface_category: "Network Surface", evidence: "Port 554 open", description: "Unsecured RTSP video streaming protocol detected, exposing live video streams to interception.", risk_level: "High" },
      { surface_name: "RTMP", surface_category: "Network Surface", evidence: "Port 1935 open", description: "Unsecured RTMP stream transmits video broadcast payload without authentication on local subnets.", risk_level: "High" },
      { surface_name: "ONVIF Profile S", surface_category: "API Surface", evidence: "api_support: ONVIF Profile S", description: "Exposed ONVIF Profile S API permits camera discovery and configuration actions without access checks.", risk_level: "Critical" },
      { surface_name: "CGI Settings API", surface_category: "API Surface", evidence: "api_support: CGI Settings API", description: "CGI script endpoints expose management controls and suffer from potential command injection.", risk_level: "Critical" },
      { surface_name: "MicroSD Slot", surface_category: "Physical Surface", evidence: "physical_interfaces: MicroSD Slot", description: "Unprotected local storage slot allows physical access to recorded media.", risk_level: "Medium" },
      { surface_name: "Basic/Digest Auth", surface_category: "Authentication Surface", evidence: "authentication_methods: Basic/Digest", description: "Basic access controls transmit credentials with weak or obfuscated encoding.", risk_level: "High" }
    ]
  },
  {
    id: 'dev-3',
    name: 'Nexus Smart Gateway',
    filename: 'nexus_smart_gateway_GX900.pdf',
    date: '2026-05-25',
    size: '18.1 MB',
    type: 'Industrial IoT Hub',
    manufacturer: 'NexusTech',
    model: 'GX-900',
    firmware: 'v4.2.1-stable',
    score: 78,
    projectedScore: 92,
    risk: 'Medium Risk',
    vulns: { critical: 2, high: 2, medium: 5, low: 10 },
    topFinding: 'Unpatched CVE-2023-XXXX Remote Code Execution in firmware',
    criticalRisks: [
      { id: 'cr-5', title: 'Unpatched Vulnerability (CVE-2023-XXXX)', desc: 'Immediate patch required for Nexus Smart Gateway firmware to prevent RCE.', icon: 'warning' },
      { id: 'cr-6', title: 'Unauthorized Access Attempts', desc: 'Anomalous login spikes detected from external IP range targeting SSH port.', icon: 'gpp_bad' }
    ],
    exposedAPIs: '3 endpoints open to public routing. Strict rate limiting recommended.',
    openPorts: 'Port 22 (SSH) and Port 443 (HTTPS) currently accessible externally.',
    networkConfig: 'Default subnet mapping detected. Segment isolation required.',
    extractedSpecs: {
      manufacturer: 'NexusTech',
      device_name: 'Nexus Smart Gateway',
      model_number: 'GX-900',
      device_type: 'Industrial IoT Hub',
      power_requirements: ['24V DC', '110V/220V AC'],
      firmware_version: 'v4.2.1-stable',
      communication_protocols: ['Modbus TCP', 'OPC-UA', 'SSH', 'HTTPS'],
      open_ports: [22, 443],
      connectivity: ['Ethernet', 'Cellular (4G/LTE)'],
      physical_interfaces: ['RS-485 Serial', 'USB 2.0', 'Dual RJ45'],
      authentication_methods: ['SSH Key Auth', 'HTTPS Admin Credentials'],
      security_features: ['IP Address Filtering', 'Hardware Firewall'],
      api_support: ['REST API', 'Modbus API'],
      update_mechanism: 'OTA Signed Updates'
    },
    vulnerabilityList: [
      { id: 'v-9', title: 'Outdated BusyBox Version', severity: 'Medium', likelihood: 2, impact: 3, desc: 'Standard shell utilities are prone to outdated vulnerability signatures.', mitigation: 'Upgrade toolchain to static BusyBox v1.35.' },
      { id: 'v-10', title: 'Unused Open Ports Active', severity: 'Low', likelihood: 3, impact: 2, desc: 'TCP ports 80 and 443 are listening despite web GUI being disabled.', mitigation: 'Close HTTP services in runlevel start script.' }
    ],
    recommendations: [
      { id: 'r-8', severity: 'Medium', title: 'Legacy BusyBox v1.21 Shell', action: 'Recompile kernel packages with BusyBox v1.35 static builds.', scoreReward: 4 },
      { id: 'r-9', severity: 'Low', title: 'HTTP/HTTPS Daemons Listening', action: 'Deactivate daemon start flags in custom system runlevel configs.', scoreReward: 2 }
    ],
    owaspMappings: [
      {
        owasp_category: "I5 - Use of Insecure or Outdated Components",
        severity: "High",
        evidence: "Outdated BusyBox v1.21 Shell",
        reason: "Embedded linux shell commands are vulnerable to multiple known privilege escalations.",
        affected_surfaces: ["Console Port"]
      }
    ],
    securityScoring: {
      security_score: 78,
      risk_level: "Medium Risk",
      positive_contributors: [
        "Role-Based Access Control (RBAC) present (+3)",
        "IP Address Access Filtering (+5)",
        "Hardware Firewall protections (+3)"
      ],
      negative_contributors: [
        "Unencrypted HTTP listening daemon active (-5)",
        "Outdated shell environment BusyBox v1.21 (-8)",
        "Legacy Modbus TCP protocols active (-5)"
      ],
      reason_for_score: "The Nexus Industrial Hub GX-900 receives a safety rating of 78 (Medium Risk). It enforces IP address filters and utilizes signed OTA updates, but is penalized for maintaining a legacy BusyBox shell and exposing Modbus TCP registers without authentication.",
      score_breakdown: [
        { category: "Network Services", item: "HTTP",    applied: true,  change: -5,  description: "Unencrypted HTTP listening daemon active." },
        { category: "Network Services", item: "HTTPS",   applied: true,  change: 5,   description: "HTTPS enforces TLS encryption on all management API calls." },
        { category: "Network Services", item: "FTP",     applied: false, change: 0,   description: "No cleartext FTP protocol detected." },
        { category: "Network Services", item: "RTSP",    applied: false, change: 0,   description: "No unsecured RTSP protocol detected." },
        { category: "Network Services", item: "SMTP",    applied: false, change: 0,   description: "No SMTP mail services detected." },
        { category: "API Exposure",     item: "ONVIF",   applied: false, change: 0,   description: "ONVIF ecosystem API exposure not detected." },
        { category: "API Exposure",     item: "ISAPI",   applied: false, change: 0,   description: "ISAPI API exposure not detected." },
        { category: "Authentication",   item: "Password Protection", applied: true, change: 5, description: "Password verification acts as a baseline access control barrier." },
        { category: "Authentication",   item: "User Roles Present",  applied: true,  change: 3, description: "Granular user roles and RBAC rules are enforced." },
        { category: "Authentication",   item: "No Authentication",   applied: false, change: 0, description: "Authentication is enforced." },
        { category: "Security Features",item: "Illegal Login Detection", applied: false, change: 0, description: "No brute force login lockout documented." },
        { category: "Security Features",item: "Privacy Mask",         applied: false, change: 0, description: "No privacy masking documented." },
        { category: "Security Features",item: "Watermark",            applied: false, change: 0, description: "No video watermarking documented." },
        { category: "Security Features",item: "IP67 Protection",      applied: false, change: 0, description: "No IP67 protection rating documented." },
        { category: "Firmware Updates", item: "Missing Update Mechanism", applied: false, change: 0, description: "Secure update mechanism is documented." },
      ]
    },
    attackSurfaces: [
      { surface_name: "HTTP", surface_category: "Network Surface", evidence: "communication_protocols: Modbus TCP, OPC-UA, SSH, HTTPS", description: "Unencrypted HTTP listening daemon exposes management credentials to sniffing.", risk_level: "High" },
      { surface_name: "Modbus TCP", surface_category: "Network Surface", evidence: "Port 502/api_support: Modbus API", description: "Legacy Modbus TCP registers expose industrial automation telemetry without payload authentication.", risk_level: "High" },
      { surface_name: "SSH Key Auth", surface_category: "Authentication Surface", evidence: "authentication_methods: SSH Key Auth", description: "SSH Key-based authentication provides strong protection, though active SSH listening ports are still subject to dictionary attacks.", risk_level: "Low" },
      { surface_name: "RS-485 Serial", surface_category: "Physical Surface", evidence: "physical_interfaces: RS-485 Serial", description: "Physical RS-485 serial connection allows local bus tapping and request injection.", risk_level: "Medium" },
      { surface_name: "USB 2.0", surface_category: "Physical Surface", evidence: "physical_interfaces: USB 2.0", description: "Unmasked physical USB ports allow local firmware extraction or malware execution.", risk_level: "High" },
      { surface_name: "Cellular 4G/LTE", surface_category: "Wireless Surface", evidence: "connectivity: Cellular (4G/LTE)", description: "Cellular wireless connection expands remote attack entry points via baseband exploits.", risk_level: "Medium" }
    ]
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [activeDevice, setActiveDevice] = useState(MOCK_DEVICES[0]);
  const [history, setHistory] = useState(MOCK_DEVICES);
  
  // State for upload
  const [uploadFile, setUploadFile] = useState(null);
  const [rawFile, setRawFile] = useState(null); // actual File object for API
  const [isDragOver, setIsDragOver] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineActive, setPipelineActive] = useState(false);
  const [pipelineError, setPipelineError] = useState(null);
  
  // State for dashboard interactions
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [threatFilter, setThreatFilter] = useState(null);
  
  // State for export alerts
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Count-up progress score state
  const [scoreProgress, setScoreProgress] = useState(0);

  // Dynamic interactive states
  const [hoveredWorkflowStep, setHoveredWorkflowStep] = useState(null);
  const [completedRecs, setCompletedRecs] = useState([]);
  const [expandedRiskId, setExpandedRiskId] = useState(null);

  const [reportText, setReportText] = useState('');
  const [reportViewMode, setReportViewMode] = useState('rendered'); // 'rendered' | 'raw'
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    setReportText(activeDevice.executiveReport || '');
  }, [activeDevice]);

  const generateLocalFallbackReport = (device) => {
    const score = device.score;
    const projected = device.score + completedRecs.reduce((acc, id) => {
      const r = device.recommendations?.find(rec => rec.id === id);
      return acc + (r ? r.scoreReward : 0);
    }, 0);
    const risk = device.risk;
    const surfaces = device.attackSurfaces || [];
    const owasp = device.owaspMappings || [];
    const recs = device.recommendations || [];
    
    return `# Executive Security & Compliance Audit: ${device.name}

## [Info] Device Information
* **Device Name:** ${device.name}
* **Manufacturer:** ${device.manufacturer}
* **Model:** ${device.model || 'N/A'}
* **Device Type:** ${device.type}
* **Firmware:** ${device.firmware}

---

## [Exposure] Attack Surface Exposure Analysis
${surfaces.map(s => `### [Exposure] ${s.surface_name} (${s.surface_category})\n* **Risk Level:** ${s.risk_level}\n* **Evidence:** ${s.evidence}\n* **Description:** ${s.description}`).join('\n\n') || "*No attack surfaces exposed.*"}

---

## [OWASP] OWASP IoT Top 10 Risk Mapping
${owasp.map(o => `### [OWASP] ${o.owasp_category}\n* **Severity:** ${o.severity}\n* **Evidence:** ${o.evidence}\n* **Reason:** ${o.reason}\n* **Affected Surfaces:** ${(o.affected_surfaces || []).join(', ') || 'None'}`).join('\n\n') || "*No OWASP IoT Top 10 risks mapped.*"}

---

## [Score] Security Score & Risk Profile
* **Security Score:** **${score}/100**
* **Assessed Risk Level:** **${risk}**

### **Reason for Score**
${device.securityScoring?.reason_for_score || `Assigned based on detected insecure protocols and interfaces, with ${surfaces.length} exposure points and ${owasp.length} OWASP risk flags.`}

---

## [Mitigation] Executive Mitigation Strategy
Here are the recommended remediations to secure the device:
${recs.map(r => `* **[${r.severity}] ${r.title}**\n  * *Action:* ${r.action}\n  * *Score Reward:* +${r.scoreReward} points`).join('\n') || "*No mitigations required.*"}

---

## [Projection] Post-Mitigation Security Projection
By executing all the recommended mitigation policies, the device security score is projected to improve to:
* **Projected Security Score:** **${projected}/100 (Low Risk)**
`;
  };

  // ── Simple Markdown → JSX renderer ─────────────────────────────────────────
  const renderMarkdown = (md) => {
    if (!md) return null;
    const lines = md.split('\n');
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      // H1
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-2xl font-bold text-primary mb-4 mt-2 font-headline border-b border-outline-variant/20 pb-2">{line.slice(2)}</h1>);
      }
      // H2
      else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-lg font-bold text-primary-fixed mt-6 mb-2 font-headline flex items-center gap-2"><span className="w-1 h-5 bg-primary rounded inline-block"></span>{line.slice(3)}</h2>);
      }
      // H3
      else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-sm font-bold text-tertiary-fixed mt-4 mb-1 font-headline">{line.slice(4)}</h3>);
      }
      // HR
      else if (line.startsWith('---')) {
        elements.push(<hr key={i} className="border-outline-variant/20 my-4" />);
      }
      // Table header
      else if (line.startsWith('|') && lines[i+1] && lines[i+1].startsWith('|') && lines[i+1].includes('---')) {
        const headers = line.split('|').filter(Boolean).map(h => h.trim());
        const rows = [];
        let j = i + 2;
        while (j < lines.length && lines[j].startsWith('|')) {
          rows.push(lines[j].split('|').filter(Boolean).map(c => c.trim()));
          j++;
        }
        elements.push(
          <div key={i} className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-high">
                  {headers.map((h, hi) => <th key={hi} className="px-3 py-2 text-left text-surface-tint font-mono uppercase tracking-wider border border-outline-variant/20">{h.replace(/\*\*/g,'')}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container'}>
                    {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-on-surface-variant border border-outline-variant/10">{cell.replace(/\*\*/g,'')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = j;
        continue;
      }
      // Bullet list
      else if (line.startsWith('* ') || line.startsWith('- ')) {
        const items = [];
        let j = i;
        while (j < lines.length && (lines[j].startsWith('* ') || lines[j].startsWith('- '))) {
          // Parse inline bold/code in bullet
          const raw = lines[j].slice(2);
          items.push(<li key={j} className="flex items-start gap-1.5 text-xs text-on-surface-variant mb-1"><span className="text-primary mt-0.5 shrink-0">▸</span><span dangerouslySetInnerHTML={{ __html: raw.replace(/\*\*(.+?)\*\*/g,'<strong class="text-on-surface">$1</strong>').replace(/`(.+?)`/g,'<code class="bg-surface-container px-1 rounded text-tertiary-fixed font-mono">$1</code>').replace(/\*(.+?)\*/g,'<em>$1</em>') }} /></li>);
          j++;
        }
        elements.push(<ul key={i} className="my-2 space-y-0.5 pl-1">{items}</ul>);
        i = j;
        continue;
      }
      // Sub-bullet
      else if (line.startsWith('  * ') || line.startsWith('  - ')) {
        const raw = line.slice(4);
        elements.push(<li key={i} className="flex items-start gap-1.5 text-xs text-on-surface-variant/80 mb-0.5 pl-5"><span className="text-outline mt-0.5 shrink-0">·</span><span dangerouslySetInnerHTML={{ __html: raw.replace(/\*\*(.+?)\*\*/g,'<strong class="text-on-surface">$1</strong>').replace(/`(.+?)`/g,'<code class="bg-surface-container px-1 rounded text-tertiary-fixed font-mono">$1</code>').replace(/\*(.+?)\*/g,'<em>$1</em>') }} /></li>);
      }
      // Blank line
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      }
      // Paragraph
      else {
        const raw = line;
        elements.push(<p key={i} className="text-xs text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: raw.replace(/\*\*(.+?)\*\*/g,'<strong class="text-on-surface font-bold">$1</strong>').replace(/`(.+?)`/g,'<code class="bg-surface-container px-1 rounded text-tertiary-fixed font-mono">$1</code>').replace(/\*(.+?)\*/g,'<em>$1</em>') }} />);
      }
      i++;
    }
    return elements;
  };

  const generateReport = async () => {
    setReportLoading(true);
    triggerToast("Requesting AI to compile compliance report...", "info");
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeDevice),
      });
      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      setReportText(data.report);
      activeDevice.executiveReport = data.report;
      triggerToast("AI report generated successfully!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("AI unavailable. Generating local fallback report...", "error");
      const fallbackReport = generateLocalFallbackReport(activeDevice);
      setReportText(fallbackReport);
      activeDevice.executiveReport = fallbackReport;
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    triggerToast("Report markdown copied to clipboard!", "success");
  };

  const handleDownloadReport = () => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(reportText);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeDevice.name.toLowerCase().replace(/ /g, '_')}_ai_report.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast("Report markdown file downloaded successfully!", "success");
  };

  const currentProjectedScore = activeDevice.score + completedRecs.reduce((acc, recId) => {
    const rec = activeDevice.recommendations?.find(r => r.id === recId);
    return acc + (rec ? rec.scoreReward : 0);
  }, 0);

  // Trigger automated toast message helper
  const triggerToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Animated count-up logic for score gauge
  useEffect(() => {
    if (currentView !== 'analysis') {
      setScoreProgress(0);
      return;
    }
    
    let start = 0;
    const end = activeDevice.score;
    if (end === 0) {
      setScoreProgress(0);
      return;
    }
    
    const duration = 1500; // 1.5 seconds
    const frameRate = 60;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    let frame = 0;
    
    const easeOutExpo = (x) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    
    let timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easedProgress = easeOutExpo(progress);
      const currentVal = Math.round(end * easedProgress);
      
      setScoreProgress(currentVal);
      
      if (frame >= totalFrames) {
        clearInterval(timer);
        setScoreProgress(end);
      }
    }, 1000 / frameRate);
    
    return () => clearInterval(timer);
  }, [activeDevice.score, currentView]);

  // Handle Drag & Drop Sim
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const processUploadedFile = (file) => {
    setRawFile(file); // store real File object for API
    setUploadFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date().toISOString().split('T')[0]
    });
    setPipelineStep(0);
    setPipelineActive(false);
    setPipelineError(null);
    triggerToast(`File "${file.name}" ready for analysis!`);
  };

  // Trigger Real GenAI Audit Pipeline via FastAPI Backend
  const startAudit = async () => {
    if (!uploadFile || !rawFile) return;
    setPipelineActive(true);
    setPipelineStep(1);
    setPipelineError(null);

    try {
      // Step 1: Uploading & parsing (LlamaParse)
      const formData = new FormData();
      formData.append('file', rawFile);

      // Move to step 2 after a moment (AI Extraction starts)
      setTimeout(() => setPipelineStep(2), 1500);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      // Step 3: Generating report
      setPipelineStep(3);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
        throw new Error(errData.detail || `Server error ${response.status}`);
      }

      const auditReport = await response.json();

      // Enrich with file metadata
      const enrichedDevice = {
        ...auditReport,
        filename: uploadFile.name,
        size: uploadFile.size,
        date: uploadFile.date,
      };

      setHistory(prev => [enrichedDevice, ...prev]);
      setActiveDevice(enrichedDevice);
      setPipelineActive(false);
      setUploadFile(null);
      setRawFile(null);
      triggerToast(`Audit complete for "${enrichedDevice.name}"! Loading dashboard...`, 'success');
      setCurrentView('analysis');

    } catch (err) {
      console.error('[Audit Error]', err);
      setPipelineError(err.message || 'Analysis failed. Please check the backend server.');
      setPipelineActive(false);
      setPipelineStep(0);
      triggerToast(`Analysis failed: ${err.message}`, 'error');
    }
  };

  // Export reports
  const handleExport = async (format) => {
    setIsExporting(true);
    triggerToast(`Compiling executive report for ${activeDevice.name}...`, 'info');

    if (format === 'JSON') {
      setTimeout(() => {
        setIsExporting(false);
        triggerToast(`Report downloaded successfully in JSON format!`, 'success');
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeDevice, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${activeDevice.filename.replace('.pdf', '_audit_report.json')}`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }, 1000);
      return;
    }

    // Get report content. If not generated, run generateLocalFallbackReport first
    const content = reportText || generateLocalFallbackReport(activeDevice);
    const filename = `${activeDevice.name.toLowerCase().replace(/ /g, '_')}_executive_report`;

    try {
      const response = await fetch('/api/export-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: content,
          format: format.toLowerCase(),
          filename: filename
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      triggerToast(`Report downloaded successfully in ${format} format!`, 'success');
    } catch (err) {
      console.error(err);
      triggerToast(`Failed to export report in ${format} format.`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Load selected device from history
  const loadDevice = (dev) => {
    setActiveDevice(dev);
    setSelectedThreat(null);
    setThreatFilter(null);
    setCompletedRecs([]); // Reset completed recommendations on device change
    setExpandedRiskId(null); // Reset expanded risk state
    triggerToast(`Loaded audit data for ${dev.name}`, 'info');
    setCurrentView('analysis');
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col md:flex-row relative font-headline selection:bg-primary-container/20 selection:text-primary">
      
      {/* Mesh Background */}
      <div className="absolute inset-0 mesh-bg pointer-events-none z-0"></div>
      <div className="absolute inset-0 grid-bg pointer-events-none z-0 opacity-40"></div>
      <div className="absolute inset-0 data-flow-bg pointer-events-none z-0"></div>

      {/* SideNavBar (Desktop) */}
      <nav className="hidden md:flex flex-col py-8 px-4 space-y-3 bg-surface-container-lowest/80 backdrop-blur-xl fixed left-0 top-0 h-screen w-[280px] z-40 border-r border-outline-variant/10 shadow-2xl transition-transform">
        <div className="mb-8 px-4">
          <h1 className="font-headline text-2xl text-primary font-bold tracking-tighter glow-text">CyberSentinel AI</h1>
          <p className="font-mono text-xs text-surface-tint mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-surface-tint animate-pulse"></span>
            Vigilant Mode Active
          </p>
        </div>
        
        <div className="flex-1 space-y-1">
          <button
            onClick={() => setCurrentView('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-mono text-sm transition-all duration-200 ${
              currentView === 'overview'
                ? 'bg-primary-container/10 text-primary border-r-2 border-primary font-bold shadow-[0_0_15px_rgba(0,219,231,0.08)]'
                : 'text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'overview' ? "'FILL' 1" : '' }}>dashboard</span>
            <span>Platform Overview</span>
          </button>

          <button
            onClick={() => setCurrentView('upload')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-mono text-sm transition-all duration-200 ${
              currentView === 'upload'
                ? 'bg-primary-container/10 text-primary border-r-2 border-primary font-bold shadow-[0_0_15px_rgba(0,219,231,0.08)]'
                : 'text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'upload' ? "'FILL' 1" : '' }}>upload_file</span>
            <span>Upload Specifications</span>
          </button>

          <button
            onClick={() => setCurrentView('analysis')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-mono text-sm transition-all duration-200 ${
              currentView === 'analysis'
                ? 'bg-primary-container/10 text-primary border-r-2 border-primary font-bold shadow-[0_0_15px_rgba(0,219,231,0.08)]'
                : 'text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'analysis' ? "'FILL' 1" : '' }}>analytics</span>
            <span>Security Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('reports')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-mono text-sm transition-all duration-200 ${
              currentView === 'reports'
                ? 'bg-primary-container/10 text-primary border-r-2 border-primary font-bold shadow-[0_0_15px_rgba(0,219,231,0.08)]'
                : 'text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'reports' ? "'FILL' 1" : '' }}>description</span>
            <span>Compliance & Reports</span>
          </button>
        </div>

        {/* Sidebar Targets List Switcher */}
        <div className="flex-1 overflow-y-auto pt-4 border-t border-outline-variant/15 space-y-2 select-none">
          <div className="flex items-center gap-1.5 px-3 mb-2">
            <span className="material-symbols-outlined text-[15px] text-surface-tint">folder_managed</span>
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Audit Targets</span>
          </div>
          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
            {history.map((dev) => {
              const isActive = activeDevice.id === dev.id;
              const isHigh = dev.score >= 90;
              const isMed = dev.score >= 70;
              const isLow = dev.score >= 50;
              const badgeColor = isHigh ? 'text-green-400 border-green-500/30 bg-green-500/5' : isMed ? 'text-orange-400 border-orange-500/30 bg-orange-500/5' : isLow ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' : 'text-error border-error/30 bg-error/5';
              return (
                <button
                  key={dev.id}
                  onClick={() => loadDevice(dev)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between border transition-all duration-150 gap-2 ${
                    isActive 
                      ? 'bg-surface-container border-outline/30 shadow-[0_2px_8px_rgba(0,242,255,0.04)]' 
                      : 'bg-transparent border-transparent hover:bg-surface-variant/10 hover:border-outline-variant/20'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{dev.name.replace(" Security Audit", "")}</span>
                    <span className="text-[9px] font-mono text-outline truncate">{dev.manufacturer} {dev.model}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                    {dev.score}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/10 space-y-4">
          <button 
            onClick={() => setCurrentView('upload')}
            className="w-full py-3 bg-surface-tint text-background font-mono text-xs font-bold rounded-lg hover:bg-primary-container transition-colors shadow-[0_0_15px_rgba(0,219,231,0.2)]"
          >
            Start New Audit
          </button>
          
          <div className="space-y-1">
            <a className="flex items-center space-x-2 px-4 py-1.5 font-mono text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
              <span className="material-symbols-outlined text-sm">help</span>
              <span>Platform Support</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Canvas */}
      <main className="flex-1 md:ml-[280px] min-h-screen flex flex-col relative z-10 overflow-hidden">
        
        {/* TopNavBar (Desktop) */}
        <header className="flex justify-between items-center w-full px-6 h-20 bg-surface/40 backdrop-blur-xl docked border-b border-outline-variant/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-xs px-3 py-1 bg-surface-container-high border border-outline-variant/20 rounded-full text-surface-tint flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f3f3]"></span>
              Active Target: <span className="text-white font-bold">{activeDevice.name}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 text-surface-tint">
            <button className="p-2 hover:bg-surface-variant/40 rounded-full transition-all text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined block">notifications</span>
            </button>
            <button className="p-2 hover:bg-surface-variant/40 rounded-full transition-all text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined block">settings</span>
            </button>
            <div className="h-9 w-9 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 ml-2">
              <img 
                alt="Security Analyst" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz0Zwv52PZTVlV_nQdiDKp-Xz7H__6bSSYLaUzcwpS2nC_W001E-jOEQqOL1y2tXKlrDtWieRLG7YXxGu9N6tmJyRRyoCV8hx5QOQxQiYGaoHkRH5VHibn8dzncRlGzg0omRtWpwTRBFhSE5K2Sv0f1jGhO-KbvUr3RXc9JljfH0j1U_l6He21jE4IfuheS475l8eRZ_TPPNlN6RVxDthUi4JJWeBnLy8fxtLeUJz2kLmIWPF51M9EXLkMN_HvMUaTZcxTgVd42Ak"
              />
            </div>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto">
          
          {/* TOAST ALERTS */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg border shadow-xl flex items-center gap-3 animate-bounce font-mono text-sm ${
              toast.type === 'error' ? 'bg-error-container/90 border-error text-red-200' :
              toast.type === 'info' ? 'bg-surface-container-high/90 border-surface-tint text-cyan-200' :
              'bg-surface-container-lowest/90 border-green-500/50 text-green-200'
            }`}>
              <span className="material-symbols-outlined">
                {toast.type === 'error' ? 'report' : toast.type === 'info' ? 'info' : 'check_circle'}
              </span>
              <span>{toast.msg}</span>
            </div>
          )}

          {/* 1. PLATFORM OVERVIEW VIEW */}
          {currentView === 'overview' && (
            <div className="relative z-10 space-y-12 max-w-container-max mx-auto animate-fadeIn">
              
              {/* Hero Section */}
              <section className="text-center space-y-6 max-w-4xl mx-auto py-6">
                <h1 className="font-display-lg text-display-lg text-gradient mb-md max-w-4xl mx-auto leading-tight">
                  GenAI-Powered IoT Security Audit Platform
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg">
                  Transform IoT Device Datasheets into Comprehensive Security Audits using Generative AI.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-md">
                  <button 
                    onClick={() => setCurrentView('upload')}
                    className="bg-surface-tint text-surface-container-lowest font-label-md text-label-md px-lg py-sm rounded-lg glow-button glow-pulse font-bold flex items-center gap-xs cursor-pointer"
                  >
                    Start Security Analysis
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <button 
                    onClick={() => loadDevice(MOCK_DEVICES[0])}
                    className="glass-card text-on-surface font-label-md text-label-md px-lg py-sm rounded-lg hover:border-surface-tint transition-colors flex items-center gap-xs cursor-pointer"
                  >
                    View Sample Audit
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </div>
              </section>

              {/* Visual Workflow Section */}
              <section className="relative z-10 py-xl px-gutter max-w-container-max mx-auto">
                <div className="text-center mb-lg">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Automated Audit Pipeline</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">End-to-end GenAI processing (Hover nodes to inspect)</p>
                </div>
                <div className="glass-card rounded-xl p-lg relative overflow-hidden hidden md:block workflow-container">
                  {/* Decorative abstract background for flow */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 50%, var(--color-primary-container) 0%, transparent 60%)", filter: "blur(40px)" }}></div>
                  <div className="flex justify-between items-center relative z-10">
                    {/* Nodes */}
                    <div 
                      onMouseEnter={() => setHoveredWorkflowStep(0)} 
                      onMouseLeave={() => setHoveredWorkflowStep(null)}
                      className="flex flex-col items-center gap-sm z-10 cursor-help"
                    >
                      <div className={`w-16 h-16 rounded-full bg-surface-container-lowest border flex items-center justify-center text-primary-container transition-all duration-300 workflow-node ${
                        hoveredWorkflowStep === 0 ? 'border-primary shadow-[0_0_20px_rgba(0,242,255,0.4)] scale-105' : 'border-outline-variant shadow-[0_0_15px_rgba(0,219,231,0.2)]'
                      }`}>
                        <span className="material-symbols-outlined text-[32px]">upload_file</span>
                      </div>
                      <span className={`font-label-sm text-label-sm text-center w-24 transition-colors ${hoveredWorkflowStep === 0 ? 'text-primary font-bold' : 'text-on-surface'}`}>Upload Datasheet</span>
                    </div>
                    <div className="flex-grow h-px bg-outline-variant/30 relative mx-sm z-0">
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <line className="flow-line stroke-primary animate-flow" strokeDasharray="10" strokeWidth="2" x1="0" x2="100%" y1="0" y2="0"></line>
                      </svg>
                    </div>
                    <div 
                      onMouseEnter={() => setHoveredWorkflowStep(1)} 
                      onMouseLeave={() => setHoveredWorkflowStep(null)}
                      className="flex flex-col items-center gap-sm z-10 cursor-help"
                    >
                      <div className={`w-16 h-16 rounded-full bg-surface-container-lowest border flex items-center justify-center text-secondary-container transition-all duration-300 workflow-node ${
                        hoveredWorkflowStep === 1 ? 'border-secondary shadow-[0_0_20px_rgba(119,1,208,0.4)] scale-105' : 'border-outline-variant shadow-[0_0_15px_rgba(119,1,208,0.2)]'
                      }`}>
                        <span className="material-symbols-outlined text-[32px]">memory</span>
                      </div>
                      <span className={`font-label-sm text-label-sm text-center w-24 transition-colors ${hoveredWorkflowStep === 1 ? 'text-secondary font-bold' : 'text-on-surface'}`}>AI Extraction</span>
                    </div>
                    <div className="flex-grow h-px bg-outline-variant/30 relative mx-sm z-0">
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <line className="flow-line stroke-secondary animate-flow" strokeDasharray="10" strokeWidth="2" x1="0" x2="100%" y1="0" y2="0"></line>
                      </svg>
                    </div>
                    <div 
                      onMouseEnter={() => setHoveredWorkflowStep(2)} 
                      onMouseLeave={() => setHoveredWorkflowStep(null)}
                      className="flex flex-col items-center gap-sm z-10 cursor-help"
                    >
                      <div className={`w-16 h-16 rounded-full bg-surface-container-lowest border flex items-center justify-center text-error transition-all duration-300 workflow-node ${
                        hoveredWorkflowStep === 2 ? 'border-error shadow-[0_0_20px_rgba(255,180,171,0.4)] scale-105' : 'border-outline-variant shadow-[0_0_15px_rgba(255,180,171,0.2)]'
                      }`}>
                        <span className="material-symbols-outlined text-[32px]">radar</span>
                      </div>
                      <span className={`font-label-sm text-label-sm text-center w-24 transition-colors ${hoveredWorkflowStep === 2 ? 'text-error font-bold' : 'text-on-surface'}`}>Attack Surface</span>
                    </div>
                    <div className="flex-grow h-px bg-outline-variant/30 relative mx-sm z-0">
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <line className="flow-line stroke-error animate-flow" strokeDasharray="10" strokeWidth="2" x1="0" x2="100%" y1="0" y2="0"></line>
                      </svg>
                    </div>
                    <div 
                      onMouseEnter={() => setHoveredWorkflowStep(3)} 
                      onMouseLeave={() => setHoveredWorkflowStep(null)}
                      className="flex flex-col items-center gap-sm z-10 cursor-help"
                    >
                      <div className={`w-16 h-16 rounded-full bg-surface-container-lowest border flex items-center justify-center text-tertiary transition-all duration-300 workflow-node ${
                        hoveredWorkflowStep === 3 ? 'border-tertiary shadow-[0_0_20px_rgba(215,255,254,0.4)] scale-105' : 'border-outline-variant shadow-[0_0_15px_rgba(215,255,254,0.2)]'
                      }`}>
                        <span className="material-symbols-outlined text-[32px]">gavel</span>
                      </div>
                      <span className={`font-label-sm text-label-sm text-center w-24 transition-colors ${hoveredWorkflowStep === 3 ? 'text-tertiary font-bold' : 'text-on-surface'}`}>OWASP Risk</span>
                    </div>
                    <div className="flex-grow h-px bg-outline-variant/30 relative mx-sm z-0">
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <line className="flow-line stroke-tertiary animate-flow" strokeDasharray="10" strokeWidth="2" x1="0" x2="100%" y1="0" y2="0"></line>
                      </svg>
                    </div>
                    <div 
                      onMouseEnter={() => setHoveredWorkflowStep(4)} 
                      onMouseLeave={() => setHoveredWorkflowStep(null)}
                      className="flex flex-col items-center gap-sm z-10 cursor-help"
                    >
                      <div className={`w-16 h-16 rounded-full bg-surface-container-lowest border flex items-center justify-center text-primary transition-all duration-300 workflow-node ${
                        hoveredWorkflowStep === 4 ? 'border-primary shadow-[0_0_20px_rgba(0,242,255,0.6)] scale-105' : 'border-primary shadow-[0_0_20px_rgba(0,242,255,0.4)] glow-pulse'
                      }`}>
                        <span className="material-symbols-outlined text-[32px]">analytics</span>
                      </div>
                      <span className={`font-label-sm text-label-sm text-center w-24 transition-colors ${hoveredWorkflowStep === 4 ? 'text-primary font-bold' : 'text-primary font-bold opacity-80'}`}>Audit Report</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Enclave Explanation Panel */}
                <div className="mt-md p-md glass-panel rounded-lg text-center max-w-2xl mx-auto transition-all duration-300 transform scale-100">
                  <h4 className="font-headline-md text-headline-md text-primary mb-xs">
                    {hoveredWorkflowStep === 0 ? "1. Upload Datasheet" :
                     hoveredWorkflowStep === 1 ? "2. AI Feature Extraction" :
                     hoveredWorkflowStep === 2 ? "3. Attack Surface Discovery" :
                     hoveredWorkflowStep === 3 ? "4. OWASP IoT Risk Check" :
                     hoveredWorkflowStep === 4 ? "5. Executive Audit Report" :
                     "Interactive Pipeline Engine"}
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {hoveredWorkflowStep === 0 ? "Upload any PDF/DOCX hardware schema or software datasheet of your connected IoT device directly to the sandbox." :
                     hoveredWorkflowStep === 1 ? "Deep learning models parse the uploaded document to extract raw structural tables, hardware layout maps, and firmware descriptions." :
                     hoveredWorkflowStep === 2 ? "The AI compiles exposed ports, BLE frequencies, and network interfaces into an exposed attack vector layout." :
                     hoveredWorkflowStep === 3 ? "Maps and scores all identified vulnerabilities against the industry-standard OWASP IoT Top 10 classifications." :
                     hoveredWorkflowStep === 4 ? "Generates CISO-ready compliance reviews, score sheets, and detailed step-by-step mitigation instructions." :
                     "Hover over any pipeline node above to inspect the live Generative AI security compliance operations."}
                  </p>
                </div>

                {/* Mobile Workflow Fallback */}
                <div className="md:hidden flex flex-col gap-sm">
                  <div className="glass-card p-md rounded-lg flex items-center gap-md">
                    <span className="material-symbols-outlined text-primary-container">upload_file</span>
                    <span className="font-label-md text-label-md">1. Upload Datasheet</span>
                  </div>
                  <div className="glass-card p-md rounded-lg flex items-center gap-md">
                    <span className="material-symbols-outlined text-secondary-container">memory</span>
                    <span className="font-label-md text-label-md">2. AI Feature Extraction</span>
                  </div>
                  <div className="glass-card p-md rounded-lg flex items-center gap-md">
                    <span className="material-symbols-outlined text-error">radar</span>
                    <span className="font-label-md text-label-md">3. Attack Surface Analysis</span>
                  </div>
                  <div className="glass-card p-md rounded-lg flex items-center gap-md text-primary border-primary">
                    <span className="material-symbols-outlined">analytics</span>
                    <span className="font-label-md text-label-md">4. Final Audit Report</span>
                  </div>
                </div>
              </section>

              {/* Feature Cards Section */}
              <section className="relative z-10 py-xl px-gutter max-w-container-max mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  <div className="glass-card rounded-xl p-md border-t-2 border-t-primary/50 hover:border-t-primary fade-in-up delay-1">
                    <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center mb-md text-primary">
                      <span className="material-symbols-outlined">document_scanner</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">AI-Powered Extraction</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Deep neural networks parse technical specs from PDF/DOCX.</p>
                  </div>
                  <div className="glass-card rounded-xl p-md border-t-2 border-t-secondary/50 hover:border-t-secondary fade-in-up delay-2">
                    <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center mb-md text-secondary">
                      <span className="material-symbols-outlined">hub</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Attack Surface Discovery</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Automated identification of network, API, and physical entry points.</p>
                  </div>
                  <div className="glass-card rounded-xl p-md border-t-2 border-t-error/50 hover:border-t-error fade-in-up delay-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center mb-md text-error">
                      <span className="material-symbols-outlined">security_update_warning</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">OWASP IoT Top 10 Mapping</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Direct correlation with industry-standard security risks.</p>
                  </div>
                  <div className="glass-card rounded-xl p-md border-t-2 border-t-tertiary/50 hover:border-t-tertiary lg:col-span-2 fade-in-up delay-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center mb-md text-tertiary">
                      <span className="material-symbols-outlined">psychology</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Explainable Security Scoring</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Nuanced scoring with transparent reasoning and evidence. Understand exactly why a vulnerability was flagged and the specific datasheet evidence supporting the claim.</p>
                  </div>
                  <div className="glass-card rounded-xl p-md border-t-2 border-t-primary-container/50 hover:border-t-primary-container fade-in-up delay-5">
                    <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center mb-md text-primary-container">
                      <span className="material-symbols-outlined">summarize</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Automated Audit Reports</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Instant executive-ready documentation for compliance.</p>
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* 2. UPLOAD & ANALYSIS VIEW */}
          {currentView === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              
              {/* Left Column: Upload Target */}
              <div className="col-span-1 lg:col-span-8 space-y-6">
                <div className="glass-panel rounded-xl p-6">
                  <h2 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">upload_file</span>
                    Analyze Connected Device
                  </h2>
                  <p className="text-sm text-on-surface-variant mb-6">
                    Select an IoT device specification sheet from local directories to launch our multi-threaded GenAI parsing engine.
                  </p>

                  {/* Drag and drop zone */}
                  {!uploadFile ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('file-picker').click()}
                      className={`upload-zone border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                        isDragOver ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(0,242,255,0.15)]' : 'border-outline-variant/30 hover:border-primary/50'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="file-picker" 
                        className="hidden" 
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => {
                          if(e.target.files.length > 0) processUploadedFile(e.target.files[0]);
                        }}
                      />
                      <span className="material-symbols-outlined text-[48px] text-primary-container glow-text">cloud_upload</span>
                      <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">Drag & drop device specs PDF here</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Accepts PDF, DOCX, or unstructured TXT dumps (Max 32MB)</p>
                      </div>
                      <button className="bg-surface-variant hover:bg-surface-bright text-on-surface font-label-md text-label-md px-md py-xs rounded-lg transition-colors cursor-pointer">
                        Browse Files
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="glass-panel rounded-xl p-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                        <div className="flex items-center gap-md">
                          <span className="material-symbols-outlined text-[48px] text-primary">picture_as_pdf</span>
                          <div>
                            <h4 className="font-body-lg text-body-lg text-on-surface font-bold truncate max-w-[200px] sm:max-w-xs">{uploadFile.name}</h4>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">{uploadFile.size}</p>
                          </div>
                        </div>
                      <span className="inline-block bg-surface-container-high px-sm py-xs rounded-full font-label-sm text-label-sm text-tertiary-fixed shrink-0">Ready for Analysis</span>
                          <button 
                            onClick={() => setUploadFile(null)}
                            disabled={pipelineActive}
                            className="p-1 hover:bg-surface-variant/40 rounded-full text-on-surface-variant hover:text-error transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setUploadFile(null)}
                          disabled={pipelineActive}
                          className="px-6 py-2.5 glass-panel rounded-lg hover:border-error/30 text-on-surface-variant font-mono text-xs disabled:opacity-50 cursor-pointer"
                        >
                          Reset Target
                        </button>
                        <button 
                          onClick={startAudit}
                          disabled={pipelineActive}
                          className="bg-primary-container text-on-primary-container px-md py-sm rounded-DEFAULT font-label-md text-label-md font-bold pulse-btn hover:bg-primary-fixed transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {pipelineActive ? 'Analyzing Spec...' : 'Analyze Device'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Pipeline Steps */}
                {pipelineActive && (
                  <div className="glass-panel rounded-xl p-md mt-lg" id="pipeline-view">
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-md pb-sm border-b border-outline-variant/30">Analysis Pipeline</h3>
                    <div className="relative pl-sm">
                      
                      {/* Step 1: LlamaParse Document Parsing */}
                      <div className="flex gap-md relative pb-lg">
                        <div className="pipeline-line"></div>
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-4 border-background mt-1 ${
                          pipelineStep >= 2 ? 'bg-tertiary-container shadow-[0_0_10px_rgba(0,242,255,0.5)]' :
                          pipelineStep === 1 ? 'bg-primary-container shadow-[0_0_10px_rgba(0,242,255,0.5)]' :
                          'bg-surface-variant'
                        }`}>
                          {pipelineStep === 1 ? (
                            <span className="material-symbols-outlined text-[14px] text-on-primary-container animate-spin">sync</span>
                          ) : pipelineStep >= 2 ? (
                            <span className="material-symbols-outlined text-[14px] text-on-tertiary-container font-bold">check</span>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-outline-variant"></div>
                          )}
                        </div>
                        <div>
                          <h4 className={`font-body-lg text-body-lg ${pipelineStep === 1 ? 'text-primary-fixed' : 'text-on-surface'}`}>LlamaParse Document Extraction</h4>
                          <p className="font-label-sm text-label-sm text-tertiary-fixed-dim">
                            {pipelineStep === 1 ? 'Parsing PDF/DOCX with LlamaParse cloud...' : pipelineStep >= 2 ? 'Complete — Markdown extracted' : 'Pending'}
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-md relative pb-lg">
                        <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-outline-variant/30"></div>
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-4 border-background mt-1 ${
                          pipelineStep >= 3 ? 'bg-tertiary-container shadow-[0_0_10px_rgba(0,242,255,0.5)]' :
                          pipelineStep === 2 ? 'bg-primary-container shadow-[0_0_10px_rgba(0,242,255,0.5)]' :
                          'bg-surface-variant'
                        }`}>
                          {pipelineStep === 2 ? (
                            <span className="material-symbols-outlined text-[14px] text-on-primary-container animate-spin">sync</span>
                          ) : pipelineStep >= 3 ? (
                            <span className="material-symbols-outlined text-[14px] text-on-tertiary-container font-bold">check</span>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-outline-variant"></div>
                          )}
                        </div>
                         <div className={pipelineStep < 1 ? 'opacity-50' : ''}>
                           <h4 className={`font-body-lg text-body-lg ${pipelineStep === 2 ? 'text-primary-fixed' : 'text-on-surface'}`}>AI Feature Extraction</h4>
                           <p className="font-label-sm text-label-sm text-primary-fixed-dim">
                             {pipelineStep === 2 ? 'Running AI — extracting IoT specs...' : pipelineStep >= 3 ? 'Complete — specs structured' : 'Awaiting document parse'}
                           </p>
                         </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-md relative pb-lg">
                        <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-outline-variant/30"></div>
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-4 border-background mt-1 ${
                          pipelineStep >= 4 ? 'bg-tertiary-container shadow-[0_0_10px_rgba(0,242,255,0.5)]' :
                          pipelineStep === 3 ? 'bg-primary-container shadow-[0_0_10px_rgba(0,242,255,0.5)]' :
                          'bg-surface-variant'
                        }`}>
                          {pipelineStep === 3 ? (
                            <span className="material-symbols-outlined text-[14px] text-on-primary-container animate-spin">sync</span>
                          ) : pipelineStep >= 4 ? (
                            <span className="material-symbols-outlined text-[14px] text-on-tertiary-container font-bold">check</span>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-outline-variant"></div>
                          )}
                        </div>
                         <div className={pipelineStep < 2 ? 'opacity-50' : ''}>
                           <h4 className={`font-body-lg text-body-lg ${pipelineStep === 3 ? 'text-primary-fixed' : 'text-on-surface'}`}>Security Audit Report Generation</h4>
                           <p className="font-label-sm text-label-sm text-primary-fixed-dim">
                             {pipelineStep === 3 ? 'Scoring risks & generating recommendations...' : pipelineStep > 3 ? 'Complete — dashboard ready' : 'Pending'}
                           </p>
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pipeline Error Display */}
                {pipelineError && (
                  <div className="glass-panel rounded-xl p-md mt-4 border border-error/30 flex items-start gap-3">
                    <span className="material-symbols-outlined text-error mt-0.5">error</span>
                    <div>
                      <h4 className="font-body-lg text-body-lg text-error font-bold">Analysis Failed</h4>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{pipelineError}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Make sure the Python backend is running: <code className="text-primary">python backend/main.py</code></p>
                    </div>
                  </div>
                )}

                {/* Audit Database History */}
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-surface-tint">folder_open</span>
                    Available Platform Security Audits
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 text-on-surface-variant font-mono text-xs uppercase">
                          <th className="py-3 px-4">Device Specification Name</th>
                          <th className="py-3 px-4">Audit Date</th>
                          <th className="py-3 px-4">File Size</th>
                          <th className="py-3 px-4">Security Score</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 text-sm font-mono">
                        {history.map((dev) => (
                          <tr key={dev.id} className="hover:bg-surface-variant/10 transition-colors">
                            <td className="py-3.5 px-4 font-headline text-on-surface font-semibold">{dev.name}</td>
                            <td className="py-3.5 px-4 text-on-surface-variant">{dev.date}</td>
                            <td className="py-3.5 px-4 text-on-surface-variant">{dev.size}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                dev.score > 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                dev.score > 60 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                'bg-error-container/20 text-error border border-error/20'
                              }`}>
                                {dev.score}/100 ({dev.risk})
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                              <button 
                                onClick={() => loadDevice(dev)}
                                className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded font-mono text-xs transition-colors cursor-pointer"
                              >
                                View Dashboard
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistory(prev => prev.filter(d => d.id !== dev.id));
                                  triggerToast(`Removed audit data for ${dev.name}`, 'error');
                                }}
                                className="p-1 hover:bg-surface-variant/40 rounded text-on-surface-variant hover:text-error transition-all cursor-pointer"
                                title="Remove Audit"
                              >
                                <span className="material-symbols-outlined text-[16px] block">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Column: System Status */}
              <div className="col-span-1 lg:col-span-4">
                <div className="glass-panel rounded-xl p-md sticky top-[100px] space-y-6">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                      <span className="material-symbols-outlined text-surface-tint">memory</span>
                      System Status
                    </h3>
                    <div className="space-y-sm">
                      <div className="flex justify-between items-center p-sm bg-surface-container-low rounded-lg border border-outline-variant/20">
                        <span className="font-body-md text-body-md text-on-surface-variant">Analysis Engine</span>
                        <div className="flex items-center gap-xs">
                          <div className="w-2 h-2 rounded-full bg-[#00f3f3] shadow-[0_0_5px_#00f3f3]"></div>
                          <span className="font-label-sm text-label-sm text-tertiary-container">Online</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-sm bg-surface-container-low rounded-lg border border-outline-variant/20">
                        <span className="font-body-md text-body-md text-on-surface-variant">Report Generator</span>
                        <div className="flex items-center gap-xs">
                          <div className="w-2 h-2 rounded-full bg-[#00f3f3] shadow-[0_0_5px_#00f3f3]"></div>
                          <span className="font-label-sm text-label-sm text-tertiary-container">Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 3. SECURITY ANALYSIS VIEW */}
          {currentView === 'analysis' && (
            <div className="p-gutter md:p-lg space-y-xl max-w-container-max mx-auto w-full z-10 animate-fadeIn">

              {/* Security Score & Risks */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
                {/* Score Gauge */}
                <div className="glass-panel p-lg rounded-xl flex flex-col items-center justify-center col-span-1">
                  <h3 className="font-headline-md text-headline-md text-primary mb-md">Security Score</h3>
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full"
                      id="score-gauge"
                      style={{ background: `conic-gradient(#00dbe7 ${scoreProgress}%, rgba(255,255,255,0.1) 0)` }}
                    ></div>
                    <div className="absolute inset-2 bg-background rounded-full flex flex-col items-center justify-center border border-outline-variant/30">
                      <div className="flex items-baseline space-x-1">
                        <span className="font-display-lg text-display-lg font-bold text-surface-tint" id="score-counter">
                          {scoreProgress}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">/ 100</span>
                      </div>
                      <span className={`font-label-sm text-label-sm mt-1 font-bold ${
                        activeDevice.score >= 80 ? 'text-green-400' :
                        activeDevice.score >= 60 ? 'text-orange-400' : 'text-error'
                      }`}>{activeDevice.risk} Risk</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full mt-4">
                    {[
                      { label: 'Critical', count: activeDevice.vulns.critical, color: 'text-error', bg: 'bg-error/10' },
                      { label: 'High', count: activeDevice.vulns.high, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                      { label: 'Medium', count: activeDevice.vulns.medium, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                      { label: 'Low', count: activeDevice.vulns.low, color: 'text-primary-fixed', bg: 'bg-primary/10' },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} className={`${bg} rounded-lg p-2 text-center border border-white/5`}>
                        <div className={`font-bold text-lg ${color}`}>{count}</div>
                        <div className="font-mono text-[13px] text-on-surface-variant">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Risks */}
                <div className="col-span-1 md:col-span-2 space-y-sm">
                  <h3 className="font-headline-md text-headline-md text-error mb-sm">Critical Risks Detected (Click to expand)</h3>
                  {activeDevice.criticalRisks && activeDevice.criticalRisks.length > 0 ? (
                    activeDevice.criticalRisks.map((risk, index) => (
                      <div
                        key={risk.id || index}
                        onClick={() => setExpandedRiskId(expandedRiskId === risk.id ? null : risk.id)}
                        className={`glass-panel critical-glow p-md rounded-lg flex flex-col transition-all duration-300 cursor-pointer ${
                          expandedRiskId === risk.id ? 'border-error shadow-[0_0_20px_rgba(255,180,171,0.25)] bg-error-container/5' : ''
                        }`}
                        style={{ animationDelay: `${index * 0.15}s` }}
                      >
                        <div className="flex items-start space-x-md">
                          <span className="material-symbols-outlined text-error text-3xl shrink-0">
                            {risk.icon === 'gpp_bad' ? 'gpp_bad' : 'warning'}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-body-lg text-body-lg font-bold text-error">{risk.title}</h4>
                              <span className="material-symbols-outlined text-on-surface-variant text-sm transition-transform duration-300" style={{ transform: expandedRiskId === risk.id ? 'rotate(180deg)' : 'none' }}>
                                keyboard_arrow_down
                              </span>
                            </div>
                            <p className="font-body-md text-body-md text-on-surface-variant mt-1">{risk.desc}</p>
                          </div>
                        </div>
                        {expandedRiskId === risk.id && (
                          <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2 animate-fadeIn">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-on-surface-variant">Vector Severity Score:</span>
                              <span className="text-error font-bold">CRITICAL RISK</span>
                            </div>
                            <div className="bg-error-container/20 border border-error/30 p-3 rounded text-xs leading-relaxed text-red-200">
                              <span className="font-bold block mb-1">Recommended Mitigation:</span>
                              {activeDevice.vulnerabilityList?.find(v => v.title === risk.title)?.mitigation || 'Deploy firmware update with enclaved SSH authorization certificates immediately.'}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="glass-panel p-md rounded-lg text-center italic text-on-surface-variant">
                      No critical risks detected for this device profile.
                    </div>
                  )}
                </div>
              </section>

              {/* Device Overview */}
              <section>
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-md text-primary-fixed">Device Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-sm">
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Device Name</span>
                    <span className="font-body-lg text-body-lg font-bold truncate" title={activeDevice.name}>{activeDevice.name}</span>
                  </div>
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Type</span>
                    <span className="font-body-md text-body-md truncate" title={activeDevice.type}>{activeDevice.type}</span>
                  </div>
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Manufacturer</span>
                    <span className="font-body-md text-body-md truncate" title={activeDevice.manufacturer}>{activeDevice.manufacturer}</span>
                  </div>
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Model</span>
                    <span className="font-body-md text-body-md truncate" title={activeDevice.model}>{activeDevice.model}</span>
                  </div>
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Firmware</span>
                    <span className="font-label-md text-label-md text-tertiary-fixed truncate" title={activeDevice.firmware}>{activeDevice.firmware}</span>
                  </div>
                </div>
              </section>

              {/* GenAI Technical Specifications Profile */}
              <section className="stagger-enter" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center space-x-sm mb-md text-primary-fixed">
                  <span className="material-symbols-outlined text-[32px] text-surface-tint">memory</span>
                  <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg m-0">GenAI Technical Profile</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-sm">
                  {/* Card 1: Communication Protocols */}
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-between min-h-[90px]">
                    <span className="font-label-sm text-label-sm text-surface-tint font-mono uppercase tracking-wider mb-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">settings_ethernet</span>
                      Protocols
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeDevice.extractedSpecs?.communication_protocols?.length > 0 ? (
                        activeDevice.extractedSpecs.communication_protocols.map((proto, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-container font-mono text-[13px] text-on-surface border border-outline-variant/30">{proto}</span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">None documented</span>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Connectivity */}
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-between min-h-[90px]">
                    <span className="font-label-sm text-label-sm text-tertiary-fixed font-mono uppercase tracking-wider mb-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">wifi</span>
                      Connectivity
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeDevice.extractedSpecs?.connectivity?.length > 0 ? (
                        activeDevice.extractedSpecs.connectivity.map((conn, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-container font-mono text-[13px] text-on-surface border border-outline-variant/30">{conn}</span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">None documented</span>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Physical Interfaces */}
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-between min-h-[90px]">
                    <span className="font-label-sm text-label-sm text-secondary font-mono uppercase tracking-wider mb-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">usb</span>
                      Interfaces
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeDevice.extractedSpecs?.physical_interfaces?.length > 0 ? (
                        activeDevice.extractedSpecs.physical_interfaces.map((iface, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-container font-mono text-[13px] text-on-surface border border-outline-variant/30">{iface}</span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">None documented</span>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Security Features */}
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-between min-h-[90px]">
                    <span className="font-label-sm text-label-sm text-green-400 font-mono uppercase tracking-wider mb-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">shield</span>
                      Sec Features
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeDevice.extractedSpecs?.security_features?.length > 0 ? (
                        activeDevice.extractedSpecs.security_features.map((feat, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-container font-mono text-[13px] text-on-surface border border-outline-variant/30">{feat}</span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">None documented</span>
                      )}
                    </div>
                  </div>

                  {/* Card 5: Authentication Methods */}
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-between min-h-[90px]">
                    <span className="font-label-sm text-label-sm text-yellow-400 font-mono uppercase tracking-wider mb-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">key</span>
                      Auth Methods
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeDevice.extractedSpecs?.authentication_methods?.length > 0 ? (
                        activeDevice.extractedSpecs.authentication_methods.map((auth, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-container font-mono text-[13px] text-on-surface border border-outline-variant/30">{auth}</span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">None documented</span>
                      )}
                    </div>
                  </div>

                  {/* Card 6: API Support */}
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-between min-h-[90px]">
                    <span className="font-label-sm text-label-sm text-cyan-400 font-mono uppercase tracking-wider mb-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">api</span>
                      APIs Supported
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeDevice.extractedSpecs?.api_support?.length > 0 ? (
                        activeDevice.extractedSpecs.api_support.map((api, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-container font-mono text-[13px] text-on-surface border border-outline-variant/30">{api}</span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">None documented</span>
                      )}
                    </div>
                  </div>

                  {/* Card 7: Power Requirements */}
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-between min-h-[90px]">
                    <span className="font-label-sm text-label-sm text-orange-400 font-mono uppercase tracking-wider mb-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bolt</span>
                      Power Specs
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeDevice.extractedSpecs?.power_requirements?.length > 0 ? (
                        activeDevice.extractedSpecs.power_requirements.map((pwr, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-container font-mono text-[13px] text-on-surface border border-outline-variant/30">{pwr}</span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">None documented</span>
                      )}
                    </div>
                  </div>

                  {/* Card 8: Update Mechanism */}
                  <div className="glass-panel p-md rounded-lg flex flex-col justify-between min-h-[90px]">
                    <span className="font-label-sm text-label-sm text-purple-400 font-mono uppercase tracking-wider mb-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">update</span>
                      Updates
                    </span>
                    <span className="font-body-md text-body-md font-semibold text-on-surface mt-1 truncate" title={activeDevice.extractedSpecs?.update_mechanism || activeDevice.update_mechanism || 'N/A'}>
                      {activeDevice.extractedSpecs?.update_mechanism || activeDevice.update_mechanism || 'N/A'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Attack Surface Explorer */}
              <section>
                <div className="flex items-center justify-between mb-md">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[28px] text-error">radar</span>
                    <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary-fixed m-0">Attack Surface Explorer</h2>
                  </div>
                  {activeDevice.attackSurfaces && activeDevice.attackSurfaces.length > 0 && (
                    <span className="px-3 py-1 rounded-full bg-error/10 border border-error/30 text-error font-mono text-xs font-bold">
                      {activeDevice.attackSurfaces.length} Exposure{activeDevice.attackSurfaces.length !== 1 ? 's' : ''} Identified
                    </span>
                  )}
                </div>

                {/* Quick summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
                  <div className="glass-panel p-md rounded-lg">
                    <div className="flex items-center space-x-sm mb-sm text-surface-tint">
                      <span className="material-symbols-outlined">api</span>
                      <h4 className="font-body-lg font-bold">Exposed APIs</h4>
                    </div>
                    <p className="text-sm text-on-surface-variant">{activeDevice.exposedAPIs}</p>
                  </div>
                  <div className="glass-panel p-md rounded-lg">
                    <div className="flex items-center space-x-sm mb-sm text-tertiary-fixed">
                      <span className="material-symbols-outlined">router</span>
                      <h4 className="font-body-lg font-bold">Open Ports</h4>
                    </div>
                    <p className="text-sm text-on-surface-variant">{activeDevice.openPorts}</p>
                  </div>
                  <div className="glass-panel p-md rounded-lg">
                    <div className="flex items-center space-x-sm mb-sm text-secondary">
                      <span className="material-symbols-outlined">dns</span>
                      <h4 className="font-body-lg font-bold">Network Config</h4>
                    </div>
                    <p className="text-sm text-on-surface-variant">{activeDevice.networkConfig}</p>
                  </div>
                </div>

                {/* Categorized Attack Surface Cards */}
                {activeDevice.attackSurfaces && activeDevice.attackSurfaces.length > 0 && (() => {
                  const categories = [
                    { key: 'Network Surface',        icon: 'lan',              color: 'text-cyan-400',   border: 'border-t-cyan-400/60',   bg: 'bg-cyan-500/5' },
                    { key: 'API Surface',            icon: 'api',              color: 'text-purple-400', border: 'border-t-purple-400/60', bg: 'bg-purple-500/5' },
                    { key: 'Physical Surface',       icon: 'developer_board',  color: 'text-orange-400', border: 'border-t-orange-400/60', bg: 'bg-orange-500/5' },
                    { key: 'Wireless Surface',       icon: 'wifi_tethering',   color: 'text-green-400',  border: 'border-t-green-400/60',  bg: 'bg-green-500/5' },
                    { key: 'Authentication Surface', icon: 'lock_person',      color: 'text-yellow-400', border: 'border-t-yellow-400/60', bg: 'bg-yellow-500/5' },
                  ];
                  const riskColor = (r) => r === 'Critical' ? 'text-error bg-error/10 border-error/30' : r === 'High' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' : r === 'Medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-primary-fixed bg-primary/10 border-primary/30';
                  return (
                    <div className="space-y-md">
                      {categories.map(cat => {
                        const surfaces = activeDevice.attackSurfaces.filter(s => s.surface_category === cat.key);
                        if (surfaces.length === 0) return null;
                        return (
                          <div key={cat.key}>
                            <div className={`flex items-center gap-2 mb-sm`}>
                              <span className={`material-symbols-outlined ${cat.color}`}>{cat.icon}</span>
                              <h3 className={`font-headline text-sm font-bold ${cat.color} uppercase tracking-widest`}>{cat.key}</h3>
                              <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${riskColor(surfaces[0]?.risk_level)}`}>{surfaces.length} surface{surfaces.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-sm">
                              {surfaces.map((surf, idx) => (
                                <div key={idx} className={`glass-panel rounded-lg border-t-2 ${cat.border} ${cat.bg} p-md transition-all hover:scale-[1.01]`}>
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={`font-headline text-sm font-bold text-on-surface`}>{surf.surface_name}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${riskColor(surf.risk_level)}`}>{surf.risk_level}</span>
                                  </div>
                                  <div className="mb-2">
                                    <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Evidence: </span>
                                    <code className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-tertiary-fixed border border-outline-variant/20 font-mono">{surf.evidence}</code>
                                  </div>
                                  <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3">{surf.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Fallback if no attack surfaces */}
                {(!activeDevice.attackSurfaces || activeDevice.attackSurfaces.length === 0) && (
                  <div className="glass-panel rounded-lg p-6 text-center text-on-surface-variant italic font-mono text-xs">
                    No attack surface data available. Run a full analysis to populate this section.
                  </div>
                )}
              </section>

              {/* Deterministic Security Scoring Profile */}
              {activeDevice.securityScoring && (
                <section>
                  <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-md text-primary-fixed">Deterministic Security Scoring Profile</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    {/* Reason card */}
                    <div className="glass-panel p-md rounded-lg md:col-span-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-sm mb-sm text-surface-tint">
                          <span className="material-symbols-outlined">psychology</span>
                          <h4 className="font-body-lg font-bold">Reason for Score</h4>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {activeDevice.securityScoring.reason_for_score}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-outline-variant/10 flex justify-between items-center text-xs font-mono">
                        <span className="text-on-surface-variant">Computed Rating:</span>
                        <span className={`font-bold ${
                          activeDevice.score >= 90 ? 'text-green-400' :
                          activeDevice.score >= 70 ? 'text-orange-400' :
                          activeDevice.score >= 50 ? 'text-yellow-400' : 'text-error'
                        }`}>{activeDevice.securityScoring.risk_level}</span>
                      </div>
                    </div>

                    {/* Positive Contributors */}
                    <div className="glass-panel p-md rounded-lg md:col-span-1">
                      <div className="flex items-center space-x-sm mb-sm text-green-400">
                        <span className="material-symbols-outlined">add_circle</span>
                        <h4 className="font-body-lg font-bold">Positive Contributors</h4>
                      </div>
                      <ul className="space-y-2 text-xs font-mono text-on-surface-variant">
                        {activeDevice.securityScoring.positive_contributors && activeDevice.securityScoring.positive_contributors.length > 0 ? (
                          activeDevice.securityScoring.positive_contributors.map((contrib, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-400 font-bold shrink-0">+</span>
                              <span>{contrib}</span>
                            </li>
                          ))
                        ) : (
                          <li className="italic text-on-surface-variant">No positive security attributes detected.</li>
                        )}
                      </ul>
                    </div>

                    {/* Negative Contributors */}
                    <div className="glass-panel p-md rounded-lg md:col-span-1">
                      <div className="flex items-center space-x-sm mb-sm text-error">
                        <span className="material-symbols-outlined">remove_circle</span>
                        <h4 className="font-body-lg font-bold">Negative Contributors</h4>
                      </div>
                      <ul className="space-y-2 text-xs font-mono text-on-surface-variant">
                        {activeDevice.securityScoring.negative_contributors && activeDevice.securityScoring.negative_contributors.length > 0 ? (
                          activeDevice.securityScoring.negative_contributors.map((contrib, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-error font-bold shrink-0">-</span>
                              <span>{contrib}</span>
                            </li>
                          ))
                        ) : (
                          <li className="italic text-on-surface-variant">No negative security vulnerabilities detected.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* Score Breakdown Table */}
              {activeDevice.securityScoring?.score_breakdown && activeDevice.securityScoring.score_breakdown.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-md">
                    <span className="material-symbols-outlined text-[28px] text-surface-tint">table_chart</span>
                    <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary-fixed m-0">Deterministic Score Breakdown</h2>
                  </div>
                  <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-outline-variant/20 bg-surface-container-high">
                      <div className="col-span-3 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Category</div>
                      <div className="col-span-3 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Rule / Item</div>
                      <div className="col-span-4 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Description</div>
                      <div className="col-span-1 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant text-center">Applied</div>
                      <div className="col-span-1 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant text-right">Δ Score</div>
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                      {activeDevice.securityScoring.score_breakdown.map((row, idx) => (
                        <div key={idx} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs transition-colors ${
                          row.applied ? (row.change > 0 ? 'bg-green-500/5 hover:bg-green-500/10' : row.change < 0 ? 'bg-error/5 hover:bg-error/10' : 'hover:bg-surface-container-low/40') : 'opacity-40 hover:opacity-60'
                        }`}>
                          <div className="col-span-3 font-mono text-[11px] text-surface-tint">{row.category}</div>
                          <div className="col-span-3 font-bold text-on-surface">{row.item}</div>
                          <div className="col-span-4 text-on-surface-variant leading-relaxed text-[11px]">{row.description}</div>
                          <div className="col-span-1 flex justify-center">
                            {row.applied ? (
                              <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-sm text-outline">radio_button_unchecked</span>
                            )}
                          </div>
                          <div className={`col-span-1 text-right font-mono font-bold text-sm ${
                            row.change > 0 ? 'text-green-400' : row.change < 0 ? 'text-error' : 'text-on-surface-variant'
                          }`}>
                            {row.change > 0 ? `+${row.change}` : row.change < 0 ? `${row.change}` : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-outline-variant/20 bg-surface-container-high flex justify-end items-center gap-3">
                      <span className="font-mono text-xs text-on-surface-variant">Final Score:</span>
                      <span className={`font-mono text-lg font-extrabold ${
                        activeDevice.score >= 90 ? 'text-green-400' : activeDevice.score >= 70 ? 'text-orange-400' : activeDevice.score >= 50 ? 'text-yellow-400' : 'text-error'
                      }`}>{activeDevice.score}/100</span>
                      <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                        activeDevice.score >= 90 ? 'text-green-400 bg-green-500/10 border-green-500/30' : activeDevice.score >= 70 ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' : activeDevice.score >= 50 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-error bg-error/10 border-error/30'
                      }`}>{activeDevice.risk}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* OWASP IoT Top 10 Mapping */}
              {activeDevice.owaspMappings && activeDevice.owaspMappings.length > 0 && (
                <section>
                  <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-md text-primary-fixed">OWASP IoT Top 10 Mapping</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    {activeDevice.owaspMappings.map((mapping, idx) => (
                      <div key={idx} className="glass-panel p-md rounded-lg flex flex-col justify-between border-l-4 border-l-error">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-headline text-sm font-bold text-on-surface">
                              {mapping.owasp_category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              mapping.severity === 'Critical' ? 'bg-red-500/20 text-red-300' :
                              mapping.severity === 'High' ? 'bg-orange-500/20 text-orange-300' :
                              mapping.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {mapping.severity} Severity
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-on-surface mb-1">
                            Evidence: <span className="font-mono text-xs text-on-surface-variant bg-surface-container/50 px-1.5 py-0.5 rounded border border-outline-variant/20">{mapping.evidence}</span>
                          </p>
                          <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                            {mapping.reason}
                          </p>
                        </div>
                        {mapping.affected_surfaces && mapping.affected_surfaces.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-outline-variant/10 flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] text-surface-tint font-mono uppercase mr-1">Affected Surfaces:</span>
                            {mapping.affected_surfaces.map((s, i) => (
                              <span key={i} className="text-[10px] bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded font-mono border border-outline-variant/20">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Vulnerability Breakdown Table */}
              <section>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-md">
                  <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary-fixed">Vulnerability Breakdown</h2>
                  <div className="flex gap-2 flex-wrap">
                    {['All', 'Critical', 'High', 'Medium', 'Low'].map(f => (
                      <button
                        key={f}
                        onClick={() => setThreatFilter(f === 'All' ? null : f)}
                        className={`px-3 py-1 rounded-full font-mono text-xs font-bold border transition-all cursor-pointer ${
                          (threatFilter === null && f === 'All') || threatFilter === f
                            ? f === 'Critical' ? 'bg-error/20 border-error text-error' :
                              f === 'High' ? 'bg-orange-500/20 border-orange-500 text-orange-400' :
                              f === 'Medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
                              f === 'Low' ? 'bg-primary/20 border-primary text-primary-fixed' :
                              'bg-surface-tint/20 border-surface-tint text-surface-tint'
                            : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-outline-variant'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="glass-panel rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-outline-variant/20 text-on-surface-variant font-mono text-[13px] uppercase tracking-wider">
                    <div className="col-span-5">Vulnerability</div>
                    <div className="col-span-2 text-center">Severity</div>
                    <div className="col-span-2 text-center">Likelihood</div>
                    <div className="col-span-2 text-center">Impact</div>
                    <div className="col-span-1 text-right">Risk Score</div>
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {(activeDevice.vulnerabilityList || [])
                      .filter(v => !threatFilter || v.severity === threatFilter)
                      .map((vuln, idx) => {
                        const riskScore = (vuln.likelihood || 0) * (vuln.impact || 0);
                        const isExpanded = selectedThreat === vuln.id;
                        const sColor = vuln.severity === 'Critical' ? 'text-error' : vuln.severity === 'High' ? 'text-orange-400' : vuln.severity === 'Medium' ? 'text-yellow-400' : 'text-primary-fixed';
                        const sBg = vuln.severity === 'Critical' ? 'badge-critical' : vuln.severity === 'High' ? 'badge-high' : vuln.severity === 'Medium' ? 'badge-medium' : 'badge-low';
                        return (
                          <div
                            key={vuln.id || idx}
                            onClick={() => setSelectedThreat(isExpanded ? null : vuln.id)}
                            className={`transition-all duration-200 cursor-pointer ${isExpanded ? 'bg-surface-container/60' : 'hover:bg-surface-container-low/50'}`}
                          >
                            <div className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
                              <div className="col-span-5 flex items-center gap-3">
                                <span className={`material-symbols-outlined text-lg shrink-0 ${sColor}`}>
                                  {vuln.severity === 'Critical' ? 'dangerous' : vuln.severity === 'High' ? 'warning' : 'info'}
                                </span>
                                <div>
                                  <div className="font-headline text-sm font-semibold text-on-surface leading-tight">{vuln.title}</div>
                                  <div className="font-mono text-[13px] text-on-surface-variant mt-0.5 line-clamp-1">{vuln.desc}</div>
                                </div>
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <span className={`px-2 py-0.5 rounded font-mono text-[13px] font-bold ${sBg}`}>{vuln.severity}</span>
                              </div>
                              <div className="col-span-2 flex flex-col items-center gap-1">
                                <div className="risk-bar-track w-full">
                                  <div className="risk-bar-fill" style={{ width: `${((vuln.likelihood || 0) / 5) * 100}%` }}></div>
                                </div>
                                <span className="font-mono text-[13px] text-on-surface-variant">{vuln.likelihood || 0}/5</span>
                              </div>
                              <div className="col-span-2 flex flex-col items-center gap-1">
                                <div className="risk-bar-track w-full">
                                  <div className="risk-bar-fill" style={{ width: `${((vuln.impact || 0) / 5) * 100}%`, background: 'linear-gradient(90deg,#ff9800,#ff5252)' }}></div>
                                </div>
                                <span className="font-mono text-[13px] text-on-surface-variant">{vuln.impact || 0}/5</span>
                              </div>
                              <div className="col-span-1 flex justify-end items-center gap-1">
                                <span className={`font-mono text-sm font-bold ${
                                  riskScore >= 20 ? 'text-error' : riskScore >= 12 ? 'text-orange-400' : riskScore >= 6 ? 'text-yellow-400' : 'text-primary-fixed'
                                }`}>{riskScore}</span>
                                <span className="material-symbols-outlined text-on-surface-variant text-xs transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="px-5 pb-5 pt-1 animate-fadeIn border-t border-outline-variant/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/20">
                                    <h5 className="font-mono text-[13px] uppercase tracking-wider text-on-surface-variant mb-2">Description</h5>
                                    <p className="text-sm text-on-surface leading-relaxed">{vuln.desc}</p>
                                  </div>
                                  <div className="bg-error-container/10 border border-error/20 rounded-lg p-4">
                                    <h5 className="font-mono text-[13px] uppercase tracking-wider text-error mb-2 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-xs">shield</span>
                                      Recommended Mitigation
                                    </h5>
                                    <p className="text-sm text-on-surface leading-relaxed">{vuln.mitigation}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {(activeDevice.vulnerabilityList || []).filter(v => !threatFilter || v.severity === threatFilter).length === 0 && (
                      <div className="px-5 py-8 text-center text-on-surface-variant italic font-mono text-sm">
                        No vulnerabilities found for this filter.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => setCurrentView('reports')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container font-mono text-xs font-bold rounded-lg pulse-btn hover:bg-primary-fixed transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  View Full Report
                </button>
                <button
                  onClick={() => handleExport('JSON')}
                  className="flex items-center gap-2 px-5 py-2.5 glass-panel border border-outline-variant/40 hover:border-primary/40 font-mono text-xs text-on-surface-variant hover:text-primary transition-all rounded-lg cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Export JSON
                </button>
              </section>

            </div>
          )}

          {/* 4. COMPLIANCE & REPORTS VIEW */}
          {currentView === 'reports' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header section with DOCX and PDF download targets */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-headline text-on-surface">Recommendations &amp; Audit Report</h2>
                  <p className="text-sm text-on-surface-variant mt-1">AI-generated mitigation strategies based on deep vulnerability scanning.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleExport('DOCX')}
                    disabled={isExporting}
                    className="px-4 py-2.5 rounded border border-primary text-primary font-mono text-xs font-bold hover:bg-primary/10 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download DOCX
                  </button>
                  <button 
                    onClick={() => handleExport('PDF')}
                    disabled={isExporting}
                    className="px-4 py-2.5 rounded bg-primary text-on-primary font-mono text-xs font-bold hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Bento Grid Layout (Col 1-12) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Bento: Executive Summary & Projection (Col 1-4) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Summary Card */}
                  <div className="glass-panel rounded-lg p-5 glow-border transition-all duration-300">
                    <h3 className="font-headline text-lg font-semibold text-on-surface mb-4 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                      <span className="material-symbols-outlined text-primary">analytics</span>
                      Executive Summary
                    </h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                        <span className="font-mono text-xs text-on-surface-variant">Device Type</span>
                        <span className="text-sm text-on-surface font-semibold">{activeDevice.type}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                        <span className="font-mono text-xs text-on-surface-variant">Total Risks</span>
                        <span className="text-sm text-error font-bold">{activeDevice.vulns.critical + activeDevice.vulns.high} Detected</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                        <span className="font-mono text-xs text-on-surface-variant">Overall Severity</span>
                        <span className="text-sm text-secondary font-semibold">{activeDevice.risk} Level</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-[13px] text-on-surface-variant uppercase tracking-wider block mb-1">Top Finding</span>
                      <div className="bg-error-container/20 border border-error/30 p-3 rounded flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">warning</span>
                        <span className="text-xs text-on-surface font-medium leading-relaxed">{activeDevice.topFinding}</span>
                      </div>
                    </div>
                  </div>

                  {/* Projection Gauge Card */}
                  <div className="glass-panel rounded-lg p-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <h3 className="font-headline text-lg font-semibold text-on-surface mb-4 relative z-10 border-b border-outline-variant/10 pb-3">Security Projection</h3>
                    <div className="flex justify-between items-end mb-4 relative z-10">
                      <div>
                        <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Current Score</p>
                        <span className="text-4xl font-extrabold text-white tracking-tighter">{activeDevice.score}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-1">Projected (Post-Fix)</p>
                        <span className="text-4xl font-extrabold text-primary text-gradient tracking-tighter">{currentProjectedScore}</span>
                      </div>
                    </div>
                    {/* Split Gauge Bar */}
                    <div className="h-4 bg-surface-container-highest rounded-full overflow-hidden flex relative z-10 mb-2">
                      <div 
                        className="h-full bg-outline-variant/70 transition-all duration-1000 ease-out" 
                        style={{ width: `${activeDevice.score}%` }}
                      ></div>
                      {currentProjectedScore > activeDevice.score && (
                        <div 
                          className="h-full bg-primary animate-pulse opacity-85" 
                          style={{ width: `${currentProjectedScore - activeDevice.score}%` }}
                        ></div>
                      )}
                    </div>
                    <p className="font-mono text-[13px] text-primary text-right relative z-10">
                      {currentProjectedScore > activeDevice.score 
                        ? `+${currentProjectedScore - activeDevice.score} Potential Improvement` 
                        : "Select mitigations on the right to project improvements"}
                    </p>
                  </div>

                </div>

                {/* Right Bento: Recommendations Grid (Col 5-12) */}
                <div className="lg:col-span-8 glass-panel rounded-lg flex flex-col border-t-2 border-t-primary">
                  
                  <div className="p-5 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-headline text-lg font-semibold text-on-surface">AI Recommendations (Click to simulate fix)</h3>
                    <div className="flex gap-3 shrink-0">
                      <span className="flex items-center gap-1.5 font-mono text-[13px] text-on-surface-variant"><div className="w-2 h-2 rounded-full bg-error"></div> Critical</span>
                      <span className="flex items-center gap-1.5 font-mono text-[13px] text-on-surface-variant"><div className="w-2 h-2 rounded-full bg-[#ff9800]"></div> High</span>
                      <span className="flex items-center gap-1.5 font-mono text-[13px] text-on-surface-variant"><div className="w-2 h-2 rounded-full bg-[#ffeb3b]"></div> Medium</span>
                      <span className="flex items-center gap-1.5 font-mono text-[13px] text-on-surface-variant"><div className="w-2 h-2 rounded-full bg-primary-container"></div> Low</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 overflow-y-auto max-h-[360px]">
                    {(activeDevice.recommendations || []).map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => {
                          if (completedRecs.includes(rec.id)) {
                            setCompletedRecs(prev => prev.filter(id => id !== rec.id));
                            triggerToast(`Reverted mitigation: ${rec.title}`, 'info');
                          } else {
                            setCompletedRecs(prev => [...prev, rec.id]);
                            triggerToast(`Mitigated: ${rec.title} (+${rec.scoreReward} Score Reward)`, 'success');
                          }
                        }}
                        className={`grid grid-cols-12 gap-3 items-center p-3.5 bg-surface-container-low hover:bg-surface-variant/40 transition-all rounded border-l-4 cursor-pointer select-none ${
                          completedRecs.includes(rec.id) ? 'border-green-500 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.15)]' :
                          rec.severity === 'Critical' ? 'border-error' :
                          rec.severity === 'High' ? 'border-[#ff9800]' :
                          rec.severity === 'Medium' ? 'border-[#ffeb3b]' : 'border-primary-container'
                        }`}
                      >
                        <div className="col-span-12 sm:col-span-1 flex items-center justify-center shrink-0">
                          <span className={`material-symbols-outlined text-xl transition-all duration-200 ${
                            completedRecs.includes(rec.id) ? 'text-green-400' : 'text-on-surface-variant'
                          }`}>
                            {completedRecs.includes(rec.id) ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </div>
                        <div className="col-span-12 sm:col-span-3 flex flex-col">
                          <span className={`font-mono text-[13px] uppercase mb-0.5 ${
                            completedRecs.includes(rec.id) ? 'text-green-400' :
                            rec.severity === 'Critical' ? 'text-error' :
                            rec.severity === 'High' ? 'text-[#ff9800]' :
                            rec.severity === 'Medium' ? 'text-yellow-300' : 'text-primary-container'
                          }`}>{rec.severity}</span>
                          <span className={`font-headline text-sm font-semibold leading-snug ${completedRecs.includes(rec.id) ? 'text-green-200 line-through opacity-60' : 'text-on-surface'}`}>{rec.title}</span>
                        </div>
                        <div className="col-span-12 sm:col-span-6 flex flex-col">
                          <span className="font-mono text-[9px] text-on-surface-variant uppercase mb-0.5">Recommendation</span>
                          <span className={`text-xs font-medium leading-relaxed ${completedRecs.includes(rec.id) ? 'text-on-surface-variant opacity-75' : 'text-on-surface'}`}>{rec.action}</span>
                        </div>
                        <div className="col-span-12 sm:col-span-2 text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                          <span className={`inline-flex px-2 py-0.5 rounded font-mono text-[13px] font-bold ${
                            completedRecs.includes(rec.id) ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            +{rec.scoreReward} Score
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                </div>

                {/* Executive Audit Report Panel */}
                <div className="glass-panel rounded-lg border-t-2 border-t-tertiary mt-6 overflow-hidden">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-outline-variant/20">
                    <div>
                      <h3 className="font-headline text-lg font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-[22px] text-tertiary-fixed">description</span>
                        Executive Compliance Report
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary-fixed font-mono text-[10px] border border-tertiary-container/50 ml-1">AI Generated</span>
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">AI-generated structured audit: device metadata → attack surfaces → OWASP mapping → score → mitigations → projection.</p>
                    </div>
                    <div className="flex gap-2 items-center shrink-0 flex-wrap">
                      {reportText && (
                        <>
                          {/* View toggle */}
                          <div className="flex rounded overflow-hidden border border-outline-variant/30">
                            <button
                              onClick={() => setReportViewMode('rendered')}
                              className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                                reportViewMode === 'rendered' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-surface-variant/40'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px] align-middle mr-1">article</span>Rendered
                            </button>
                            <button
                              onClick={() => setReportViewMode('raw')}
                              className={`px-3 py-1.5 font-mono text-xs transition-colors border-l border-outline-variant/30 ${
                                reportViewMode === 'raw' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-surface-variant/40'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px] align-middle mr-1">code</span>Raw
                            </button>
                          </div>
                          <button
                            onClick={handleCopyReport}
                            className="px-3 py-1.5 rounded bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono text-xs hover:bg-surface-variant transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                            Copy
                          </button>
                          <button
                            onClick={handleDownloadReport}
                            className="px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-xs hover:bg-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            .md
                          </button>
                          <button
                            onClick={generateReport}
                            disabled={reportLoading}
                            className="px-3 py-1.5 rounded bg-tertiary-container/30 border border-tertiary-container/50 text-tertiary-fixed font-mono text-xs hover:bg-tertiary-container/50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <span className={`material-symbols-outlined text-[14px] ${reportLoading ? 'animate-spin' : ''}`}>refresh</span>
                            Regenerate
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content Area */}
                  {reportLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-tertiary-container/50 border-t-tertiary-fixed animate-spin"></div>
                        <span className="material-symbols-outlined text-[24px] text-tertiary-fixed absolute inset-0 flex items-center justify-center">psychology</span>
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-xs text-on-surface font-semibold">AI is compiling your audit...</p>
                        <p className="font-mono text-[11px] text-on-surface-variant mt-1">Analyzing {activeDevice.attackSurfaces?.length || 0} attack surfaces &amp; {activeDevice.owaspMappings?.length || 0} OWASP mappings</p>
                      </div>
                    </div>
                  ) : reportText ? (
                    <div className="overflow-y-auto max-h-[600px]">
                      {reportViewMode === 'rendered' ? (
                        <div className="p-6 space-y-1">
                          {renderMarkdown(reportText)}
                        </div>
                      ) : (
                        <pre className="p-5 text-[11px] text-on-surface-variant leading-relaxed font-mono whitespace-pre-wrap select-text bg-surface-container-lowest">
                          {reportText}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                      <div className="w-20 h-20 rounded-full bg-tertiary-container/10 border border-tertiary-container/30 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-[36px] text-tertiary-fixed">find_in_page</span>
                      </div>
                      <h4 className="font-headline text-base font-semibold text-on-surface mb-2">No Report Generated Yet</h4>
                      <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
                        Generate a CISO-ready executive compliance report covering device metadata, all attack surfaces, OWASP IoT Top 10 mappings, the security score rationale, and a full mitigation roadmap.
                      </p>
                      <button
                        onClick={generateReport}
                        className="px-8 py-3 bg-tertiary-container/30 border border-tertiary-container text-tertiary-fixed font-mono text-xs font-bold rounded-lg hover:bg-tertiary-container/50 hover:shadow-[0_0_20px_rgba(0,243,243,0.2)] transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        Generate AI Executive Report
                      </button>
                    </div>
                  )}
                </div>

              </div>
          )}

        </div>

        {/* Footer */}
        <footer className="bg-surface-container-lowest border-t border-outline-variant/10 w-full py-6 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 max-w-[1440px] mx-auto gap-4 text-xs font-mono text-on-surface-variant">
            <span className="text-surface-tint font-bold">
              © 2026 CyberSentinel AI. Advanced Enterprise IoT Defense.
            </span>
            <nav className="flex gap-4">
              <a className="hover:text-on-surface hover:underline" href="#">SOC2 Compliance</a>
              <a className="hover:text-on-surface hover:underline" href="#">ISO 27001</a>
              <a className="hover:text-on-surface hover:underline" href="#">Terms of Service</a>
              <a className="hover:text-on-surface hover:underline" href="#">Security Disclosure</a>
            </nav>
          </div>
        </footer>

      </main>

    </div>
  );
}


