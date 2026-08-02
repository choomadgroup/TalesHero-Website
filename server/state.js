// Shared in-memory server state (resets on restart)
let _maintenance = false;

export function isMaintenanceMode()     { return _maintenance; }
export function setMaintenanceMode(val) { _maintenance = !!val; }
