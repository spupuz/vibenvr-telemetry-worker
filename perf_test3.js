const { performance } = require('perf_hooks');

const row = {
    cameras: "12",
    groups: "3",
    events: "45000",
    gpu: "1",
    notifications: "0",
    mqtt_active: "1",
    motion_opencv: "0",
    motion_onvif: "2",
    motion_ai_engine: "10",
    onvif_count: "2",
    substream_count: "12"
};

const stats1 = { total_cameras: 0, total_groups: 0, total_events: 0, gpu_enabled: 0, notifications_enabled: 0, total_mqtt_active: 0, total_motion_opencv: 0, total_motion_onvif: 0, total_motion_ai_engine: 0, total_motion_ai: 0, total_onvif_cameras: 0, total_substream_cameras: 0 };
const stats2 = { total_cameras: 0, total_groups: 0, total_events: 0, gpu_enabled: 0, notifications_enabled: 0, total_mqtt_active: 0, total_motion_opencv: 0, total_motion_onvif: 0, total_motion_ai_engine: 0, total_motion_ai: 0, total_onvif_cameras: 0, total_substream_cameras: 0 };

let t0 = performance.now();
for(let i=0; i<100000; i++) {
    stats1.total_cameras += Number(row.cameras) || 0;
    stats1.total_groups += Number(row.groups) || 0;
    stats1.total_events += Number(row.events) || 0;
    if (Number(row.gpu) > 0) stats1.gpu_enabled++;
    if (Number(row.notifications) > 0) stats1.notifications_enabled++;
    if (Number(row.mqtt_active) > 0) stats1.total_mqtt_active++;
    stats1.total_motion_opencv += Number(row.motion_opencv) || 0;
    stats1.total_motion_onvif += Number(row.motion_onvif) || 0;
    stats1.total_motion_ai_engine += Number(row.motion_ai_engine) || 0;
    stats1.total_motion_ai += Number(row.motion_ai_engine) || 0;
    stats1.total_onvif_cameras += Number(row.onvif_count) || 0;
    stats1.total_substream_cameras += Number(row.substream_count) || 0;
}
let t1 = performance.now();
console.log("Number() took: " + (t1 - t0));


t0 = performance.now();
for(let i=0; i<100000; i++) {
    stats2.total_cameras += +row.cameras || 0;
    stats2.total_groups += +row.groups || 0;
    stats2.total_events += +row.events || 0;
    if (+row.gpu > 0) stats2.gpu_enabled++;
    if (+row.notifications > 0) stats2.notifications_enabled++;
    if (+row.mqtt_active > 0) stats2.total_mqtt_active++;
    stats2.total_motion_opencv += +row.motion_opencv || 0;
    stats2.total_motion_onvif += +row.motion_onvif || 0;
    stats2.total_motion_ai_engine += +row.motion_ai_engine || 0;
    stats2.total_motion_ai += +row.motion_ai_engine || 0;
    stats2.total_onvif_cameras += +row.onvif_count || 0;
    stats2.total_substream_cameras += +row.substream_count || 0;
}
t1 = performance.now();
console.log("+ unary took: " + (t1 - t0));
