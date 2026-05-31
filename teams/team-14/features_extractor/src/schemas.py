from pydantic import BaseModel, Field
from typing import List, Optional

class IoTSpecifications(BaseModel):
    manufacturer: Optional[str] = Field(description="The manufacturer or brand of the device")
    device_name: Optional[str] = Field(description="The generic or marketing name of the device")
    model_number: Optional[str] = Field(description="The specific model number of the device")
    device_type: Optional[str] = Field(description="The type of the IoT device, e.g., IP Camera, Smart Meter, Industrial Sensor")
    power_requirements: List[str] = Field(description="Power inputs or requirements (e.g., 12 VDC, PoE, 24 VAC, Battery)")
    firmware_version: Optional[str] = Field(description="The firmware version mentioned in the document")
    communication_protocols: List[str] = Field(description="List of communication protocols (e.g., MQTT, HTTP, CoAP, Zigbee, BLE, TCP/IP)")
    open_ports: List[int] = Field(description="List of known or open network ports mentioned")
    connectivity: List[str] = Field(description="List of connectivity types (e.g., Wi-Fi, Ethernet, Cellular, PoE)")
    physical_interfaces: List[str] = Field(description="Physical interfaces available on the device (e.g., USB, UART, JTAG, RJ45)")
    authentication_methods: List[str] = Field(description="Methods used for authentication (e.g., passwords, certificates, biometric, OAuth)")
    security_features: List[str] = Field(description="Built-in security features (e.g., encryption, secure boot, IP address filtering, watermarks)")
    api_support: List[str] = Field(description="APIs or integration standards supported (e.g., ONVIF, ISAPI, REST API)")
    update_mechanism: Optional[str] = Field(description="How the device receives firmware or software updates (e.g., OTA, manual USB, web interface)")
