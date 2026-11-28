const progressBarContainer = document.getElementById("upload");
let lastTimestamp = null, currentProgressBar = null;

function getTimestampParameter() {
    return `?t=${(new Date).getTime()}`;
}

function createProgressBar() {
    let t = document.createElement("div");
    t.classList.add("upload-progress-container");
    t.setAttribute("role", "progressbar");
    t.setAttribute("aria-label", "Status upload data ke GitHub");
    t.setAttribute("aria-valuenow", "0");
    t.setAttribute("aria-valuemin", "0");
    t.setAttribute("aria-valuemax", "100");

    let e = document.createElement("div");
    e.classList.add("upload-progress-bar");
    t.appendChild(e);

    let a = document.createElement("div");
    a.classList.add("upload-status");
    a.setAttribute("aria-live", "polite");
    a.textContent = "Dalam antrian...";
    t.appendChild(a);

    progressBarContainer.appendChild(t);
    return e;
}

function removeProgressBar() {
    setTimeout(() => {
        if (currentProgressBar) {
            progressBarContainer.removeChild(progressBarContainer.querySelector(".upload-progress-container"));
            currentProgressBar = null;
        }
    }, 500);
}

async function fetchData() {
    if (!currentProgressBar) {
        currentProgressBar = createProgressBar();
    }

    try {
        let t = `https://4211421036.github.io/qualityair/data.json${getTimestampParameter()}`;
        let e = await fetch(t, {
            method: "GET",
            cache: "no-store",
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });

        if (!e.ok) {
            throw new Error(`HTTP error! status: ${e.status}`);
        }

        let a = await e.json();
        if (!a || !a.data || a.data.ppm === undefined) {
            throw new Error("Invalid data structure");
        }

        let r = a.data.ppm, o = a.data.raw_value, i = a.timestamp;

        if (lastTimestamp !== i) {
            lastTimestamp = i;
            let s = 0;
            let l = setInterval(() => {
                s += 10;
                currentProgressBar.style.width = `${s}%`;
                currentProgressBar.style.backgroundColor = s <= 30 ? "#ff9800" : s <= 60 ? "#ffeb3b" : s <= 90 ? "#4caf50" : "#1a73e8";
                document.querySelector(".upload-status").textContent = `Uploading... ${s}%`;

                if (s >= 100) {
                    clearInterval(l);
                    document.querySelector(".upload-status").textContent = "Selesai diunggah";
                    removeProgressBar();
                    setTimeout(() => {
                        fetchData();
                    }, 1000);
                }
            }, 1000);

            document.getElementById("ppm-value").textContent = r.toFixed(1);
            document.getElementById("raw-value").textContent = o;
            document.getElementById("air-quality-status").textContent = getAirQualityStatus(r);
            document.getElementById("timestamp").textContent = formatTimestamp(i);
            updateHistoryChart(i, r, o);

            if (r > 100 && Notification.permission === "granted") {
                new Notification("Peringatan Kualitas Udara!", {
                    body: `Tingkat CO (ppm) sudah tidak normal: ${r.toFixed(1)} ppm. Harap ambil tindakan!`,
                    icon: "https://4211421036.github.io/qualityair/warning.png",
                    tag: "co-alert"
                });
            }
        } else {
            document.querySelector(".upload-status").textContent = "Dalam antrian...";
        }

        document.getElementById("ppm-value").classList.add("update-animation");
        setTimeout(() => {
            document.getElementById("ppm-value").classList.remove("update-animation");
        }, 500);
    } catch (n) {
        console.error("Error fetching data:", n);
        document.querySelector(".upload-status").textContent = "Gagal mengunduh data.";
    }
}

function toggleTheme() {
    let t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    document.querySelector(".theme-toggle i").className = t === "dark" ? "fas fa-sun" : "fas fa-moon";
}

fetchData();
setInterval(fetchData, 1000);

const savedTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.documentElement.setAttribute("data-theme", savedTheme);
document.querySelector(".theme-toggle i").className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";

let activeModal = null, startY = 0, currentY = 0;

function showModal(t) {
    let e = document.getElementById(t);
    e.classList.add("active");
    activeModal = e;
    document.querySelectorAll(".nav-item").forEach(e => {
        e.classList.remove("active");
        if (e.textContent.toLowerCase().includes(t.split("-")[0])) {
            e.classList.add("active");
        }
    });
}

function hideModal(t) {
    t.classList.remove("active");
    activeModal = null;
    document.querySelectorAll(".nav-item").forEach(t => {
        t.classList.remove("active");
        if (t.textContent.toLowerCase().includes("home")) {
            t.classList.add("active");
        }
    });
}

function getRecommendation(t) {
    if (t <= 50) {
        return "the air quality is good. It's safe to go outside.";
    } else if (t <= 100) {
        return "the air quality is moderate. Sensitive individuals should limit outdoor activities.";
    } else if (t <= 150) {
        return "the air quality is unhealthy for sensitive groups. Consider wearing a mask if outside.";
    } else if (t <= 200) {
        return "the air quality is unhealthy. Avoid outdoor activities if possible.";
    } else if (t <= 300) {
        return "the air quality is very unhealthy. Stay indoors and limit physical activities.";
    } else {
        return "the air quality is hazardous. Remain indoors and use air purifiers if available.";
    }
}

async function typeText(t, e, a = 50) {
    return new Promise(r => {
        let o = 0;
        t.textContent = "";
        function i() {
            if (o < e.length) {
                t.textContent += e.charAt(o);
                o++;
                setTimeout(i, a);
            } else {
                r();
            }
        }
        i();
    });
}

document.querySelectorAll(".modal").forEach(t => {
    t.addEventListener("touchstart", t => {
        startY = t.touches[0].clientY;
    });
    t.addEventListener("touchmove", e => {
        if (!activeModal) return;
        currentY = e.touches[0].clientY;
        let a = currentY - startY;
        if (a > 0) {
            e.preventDefault();
            t.style.transform = `translate(-50%, ${a}px)`;
        }
    });
    t.addEventListener("touchend", e => {
        if (activeModal && currentY - startY > 100) {
            hideModal(t);
        }
        t.style.transform = "translateX(-50%)";
    });
});

let lastForecast = null, isTyping = false;

async function updateRecommendation(t) {
    let e = document.getElementById("daily-recommendation");
    let a = t.reduce((t, e) => t + e, 0) / t.length;
    if (lastForecast !== null && a === lastForecast || isTyping) return;
    isTyping = true;
    lastForecast = a;
    let r = getRecommendation(a);
    let o = `Based on current CO levels prediction (${a.toFixed(1)} ppm), ${r}`;
    await typeText(e, o, 50);
    isTyping = false;
}

const historicalData = { times: [], values: [], rawValues: [], forecastTimes: [], forecastValues: [] };

function updateHistoryChart(t, e, a) {
    if (historicalData.times.length > 24) {
        historicalData.times.shift();
        historicalData.values.shift();
        historicalData.rawValues.shift();
    }
    historicalData.times.push(new Date(t).toLocaleTimeString());
    historicalData.values.push(e);
    historicalData.rawValues.push(a);
    historyChart.data.labels = historicalData.times;
    historyChart.data.datasets[0].data = historicalData.values;
    historyChart.update();
}

const historyCtx = document.getElementById("historyChart").getContext("2d");
const historyChart = new Chart(historyCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "CO Level (PPM)",
            data: [],
            borderColor: "#3b82f6",
            tension: 0.4,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--text-primary")
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--border-color")
                },
                ticks: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")
                }
            },
            x: {
                grid: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--border-color")
                },
                ticks: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")
                }
            }
        }
    }
});

const forecastCtx = document.getElementById("forecastChart").getContext("2d");
const forecastChart = new Chart(forecastCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Historical",
            data: [],
            borderColor: "#3b82f6",
            tension: 0.4,
            fill: false
        }, {
            label: "Forecast",
            data: [],
            borderColor: "#10b981",
            borderDash: [5, 5],
            tension: 0.4,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: "nearest"
        },
        plugins: {
            legend: {
                display: true,
                position: "top",
                labels: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--text-primary")
                }
            },
            tooltip: {
                mode: "index",
                intersect: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--border-color")
                },
                ticks: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")
                },
                title: {
                    display: true,
                    text: "CO Level (PPM)"
                }
            },
            x: {
                grid: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--border-color")
                },
                ticks: {
                    color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")
                },
                title: {
                    display: true,
                    text: "Time"
                }
            }
        }
    }
});

function predictNextValues(t, e = 6) {
    if (t.length < 2) return Array(e).fill(t[0] || 0);
    let a = t.slice(-6), r = [];
    for (let o = 1; o < a.length; o++) {
        r.push(a[o] - a[o - 1]);
    }
    let i = r.reduce((t, e) => t + e, 0) / r.length;
    let s = [], l = t[t.length - 1];
    for (let n = 0; n < e; n++) {
        l += i;
        let c = 0.2 * i, d = (Math.random() - 0.5) * c;
        s.push(Math.max(0, l + d));
    }
    return s;
}

function updateHistoryChart(t, e, a) {
    if (historicalData.times.length > 24) {
        historicalData.times.shift();
        historicalData.values.shift();
        historicalData.rawValues.shift();
    }
    let r = new Date(t).toLocaleTimeString();
    historicalData.times.push(r);
    historicalData.values.push(e);
    historicalData.rawValues.push(a);
    historyChart.data.labels = historicalData.times;
    historyChart.data.datasets[0].data = historicalData.values;
    historyChart.update();

    let o = new Date(t), i = [];
    historicalData.forecastValues = [];
    historicalData.forecastTimes = [];
    for (let s = 1; s <= 6; s++) {
        let l = new Date(o.getTime() + 5 * s * 60000).toLocaleTimeString();
        historicalData.forecastTimes.push(l);
        i.push(l);
    }
    historicalData.forecastValues = predictNextValues(historicalData.values);
    let n = historicalData.times.slice(-6), c = historicalData.values.slice(-6);
    forecastChart.data.labels = [...n, ...i];
    forecastChart.data.datasets[0].data = [...c, ...Array(6).fill(null)];
    forecastChart.data.datasets[1].data = [...Array(6).fill(null), ...historicalData.forecastValues];
    forecastChart.update();
    updateRecommendation(historicalData.forecastValues);
}

function updateChartColors() {
    let t = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
    let e = getComputedStyle(document.documentElement).getPropertyValue("--border-color");
    historyChart.options.scales.y.grid.color = e;
    historyChart.options.scales.x.grid.color = e;
    historyChart.options.scales.y.ticks.color = t;
    historyChart.options.scales.x.ticks.color = t;
    historyChart.options.plugins.legend.labels.color = t;
    forecastChart.options.scales.y.grid.color = e;
    forecastChart.options.scales.x.grid.color = e;
    forecastChart.options.scales.y.ticks.color = t;
    forecastChart.options.scales.x.ticks.color = t;
    forecastChart.options.plugins.legend.labels.color = t;
    historyChart.update();
    forecastChart.update();
}

function getAirQualityStatus(t) {
    if (t <= 50) {
        return "🟢 Safe";
    } else if (t <= 100) {
        return "🟡 Moderate";
    } else if (t <= 150) {
        return "🟠 Unhealthy for Sensitive Groups";
    } else if (t <= 200) {
        return "🔴 Unhealthy";
    } else {
        return "🟣 Very Dangerous";
    }
}

function updateGreeting() {
    let t = new Date().getHours();
    let e = document.getElementById("greeting");
    if (t >= 5 && t < 12) {
        e.textContent = "Good Morning";
    } else if (t >= 12 && t < 17) {
        e.textContent = "Good Afternoon";
    } else if (t >= 17 && t < 21) {
        e.textContent = "Good Evening";
    } else {
        e.textContent = "Good Night";
    }
}

function formatTimestamp(t) {
    let e = new Date(t);
    return `${e.getHours().toString().padStart(2, "0")}:${e.getMinutes().toString().padStart(2, "0")}`;
}

if (Notification.permission !== "granted") {
    Notification.requestPermission().then(t => {
        if (t === "granted") {
            console.log("Permission granted for notifications");
        }
    });
}

document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
});

updateGreeting();
setInterval(updateGreeting, 60000);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", t => {
    let e = t.matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", e);
    localStorage.setItem("theme", e);
    updateChartColors();
});