// Arduino Temperature Control System Simulator
// Exact same state machine + hysteresis as the Arduino code
// 230V AC Relay Circuit visualization

const WARNING_ON  = 35.0;
const WARNING_OFF = 33.0;
const DANGER_ON   = 40.0;
const DANGER_OFF  = 38.0;

// 0 = Normal, 1 = Warning, 2 = Danger
let systemState = 0;
let buzzerBlink = false;
let buzzerTimer = null;

const slider      = document.getElementById("tempSlider");
const tempValue   = document.getElementById("tempValue");
const statusEl    = document.getElementById("status");
const log         = document.getElementById("serialLog");
const greenLed    = document.getElementById("greenLed");
const yellowLed   = document.getElementById("yellowLed");
const redLed      = document.getElementById("redLed");
const relayState  = document.getElementById("relayState");
const buzzerState = document.getElementById("buzzerState");
const relayCircuit= document.getElementById("relayCircuit");
const loadStatus  = document.getElementById("loadStatus");

function logMsg(msg) {
  const time = new Date().toLocaleTimeString();
  log.value += `[${time}] ${msg}\n`;
  log.scrollTop = log.scrollHeight;
}

function setRelay(on) {
  relayState.textContent = on ? "ON" : "OFF";
  relayState.className = "out-value " + (on ? "on" : "off");

  if (on) {
    relayCircuit.classList.add("active");
    loadStatus.textContent = "ON";
  } else {
    relayCircuit.classList.remove("active");
    loadStatus.textContent = "OFF";
  }
}

function setBuzzer(mode) {
  clearInterval(buzzerTimer);
  buzzerTimer = null;

  if (mode === "off") {
    buzzerState.textContent = "OFF";
    buzzerState.className = "out-value off";
  } else if (mode === "on") {
    buzzerState.textContent = "ON";
    buzzerState.className = "out-value on";
  } else if (mode === "blink") {
    buzzerBlink = false;
    buzzerTimer = setInterval(() => {
      buzzerBlink = !buzzerBlink;
      buzzerState.textContent = buzzerBlink ? "ON" : "OFF";
      buzzerState.className = "out-value " + (buzzerBlink ? "on" : "off");
    }, 400);
  }
}

function updateOutputs() {
  greenLed.classList.remove("active");
  yellowLed.classList.remove("active");
  redLed.classList.remove("active");

  switch (systemState) {
    case 0:
      statusEl.textContent = "NORMAL";
      statusEl.style.color = "#22c55e";
      tempValue.style.color = "#22c55e";
      greenLed.classList.add("active");
      setRelay(true);
      setBuzzer("off");
      break;

    case 1:
      statusEl.textContent = "WARNING";
      statusEl.style.color = "#facc15";
      tempValue.style.color = "#facc15";
      yellowLed.classList.add("active");
      redLed.classList.add("active");
      setRelay(true);
      setBuzzer("blink");
      break;

    case 2:
      statusEl.textContent = "DANGER";
      statusEl.style.color = "#ef4444";
      tempValue.style.color = "#ef4444";
      redLed.classList.add("active");
      setRelay(false);
      setBuzzer("on");
      break;
  }
}

function runStateMachine(temp) {
  const prev = systemState;

  switch (systemState) {
    case 0:
      if (temp >= WARNING_ON) systemState = 1;
      break;
    case 1:
      if (temp >= DANGER_ON) systemState = 2;
      else if (temp <= WARNING_OFF) systemState = 0;
      break;
    case 2:
      if (temp <= DANGER_OFF) systemState = 1;
      break;
  }

  if (systemState !== prev) {
    const names = ["NORMAL", "WARNING", "DANGER"];
    logMsg(`State → ${names[systemState]}  (Temp: ${temp.toFixed(1)}°C)`);
  }

  updateOutputs();
}

function onTempChange() {
  const temp = parseFloat(slider.value);
  tempValue.textContent = temp.toFixed(1) + "°C";
  runStateMachine(temp);
}

slider.addEventListener("input", onTempChange);

logMsg("Simulator ready. Arduino state machine active.");
logMsg("Limits: Warning ≥35°C, Danger ≥40°C (hysteresis 33/38)");
logMsg("Relay controls 230V AC Cooler/Fan load.");
onTempChange();
