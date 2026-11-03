// Shared helpers used by every page

const API_URL = "";

const getToken = () => localStorage.getItem("token");
const getRole = () => localStorage.getItem("role");

const saveSession = (token, role) => {
	localStorage.setItem("token", token);
	localStorage.setItem("role", role);
};

const logout = () => {
	localStorage.removeItem("token");
	localStorage.removeItem("role");
	window.location.href = "index.html";
};

// Sends to the login page if the user isn't logged in with the required role
const requireRole = (role) => {
	if(!getToken() || getRole() !== role) {
		window.location.href = "index.html";
	}
};

// fetch wrapper that adds the token and turns error responses into thrown errors
const api = (path, options = {}) => {
	return fetch(API_URL + path, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${ getToken() }`
		},
		body: options.body ? JSON.stringify(options.body) : undefined
	})
	.then(res => res.json().then(data => {
		// Expired or invalid token: send back to the login page (wrong password on login is a normal error)
		if(data.auth === "Failed. No Token" || (path === "/users/details" && res.status === 404) || (data.auth === "Failed" && /jwt|token/i.test(data.message || ""))) {
			logout();
		}
		if(!res.ok) {
			throw new Error(data.message || (data.error && data.error.message) || "Something went wrong");
		}
		return data;
	}));
};

// Escapes text before it goes into innerHTML
const escapeHtml = (text) => {
	return String(text == null ? "" : text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
};

const formatDate = (date) => {
	if(!date) return "";
	return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

// yyyy-mm-dd for <input type="date">
const toInputDate = (date) => {
	if(!date) return "";
	return new Date(date).toISOString().slice(0, 10);
};

const daysUntil = (date) => {
	let today = new Date();
	today.setHours(0, 0, 0, 0);
	let target = new Date(date);
	target.setHours(0, 0, 0, 0);
	return Math.round((target - today) / 86400000);
};

const relativeDay = (date) => {
	let days = daysUntil(date);
	if(days === 0) return "today";
	if(days === 1) return "tomorrow";
	if(days > 1) return `in ${ days } days`;
	return `${ Math.abs(days) } days ago`;
};

const showMessage = (element, text, type = "error") => {
	element.textContent = text;
	element.className = `message ${ type }`;
	element.hidden = !text;
};

const formatDateTime = (date) => {
	if(!date) return "";
	return new Date(date).toLocaleString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const formatTime = (date) => new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// yyyy-mm-ddThh:mm in local time for <input type="datetime-local">
const toInputDateTime = (date) => {
	if(!date) return "";
	let d = new Date(date);
	d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
	return d.toISOString().slice(0, 16);
};

// Clinic messages shown to patients
const PRE_VISIT_NOTE = "Please check that your insurance on file is correct. If you happen to be in between insurances, cash pay starts at $90.";
const CRISIS_HTML = `<strong>In crisis or thinking about harming yourself?</strong> Call or text <a href="tel:988">988</a> (Suicide &amp; Crisis Lifeline) any time, or call <a href="tel:911">911</a>.`;

//[SECTION] Mood chart
// Line chart of mood and anxiety (both 1-10) with hover tooltip and a table view for accessibility
const CHART_SERIES = [
	{ key: "mood", label: "Mood", color: "#0f8a78", hint: "higher is better" },
	{ key: "anxiety", label: "Anxiety", color: "#c46a12", hint: "lower is better" }
];

const renderMoodChart = (container, checkIns) => {
	if(!checkIns.length) {
		container.innerHTML = `<p class="muted">No check-ins in the last 30 days.</p>`;
		return;
	}

	let width = 640, height = 220;
	let pad = { top: 12, right: 72, bottom: 28, left: 28 };
	let innerW = width - pad.left - pad.right;
	let innerH = height - pad.top - pad.bottom;

	let x = (i) => pad.left + (checkIns.length === 1 ? innerW / 2 : (i / (checkIns.length - 1)) * innerW);
	let y = (v) => pad.top + innerH - ((v - 1) / 9) * innerH;
	let shortDate = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

	let grid = [1, 4, 7, 10].map(v => `
		<line x1="${ pad.left }" x2="${ pad.left + innerW }" y1="${ y(v) }" y2="${ y(v) }" class="chart-grid"/>
		<text x="${ pad.left - 8 }" y="${ y(v) + 4 }" text-anchor="end" class="chart-axis">${ v }</text>
	`).join("");

	let xLabels = [0, Math.floor((checkIns.length - 1) / 2), checkIns.length - 1]
		.filter((v, i, arr) => arr.indexOf(v) === i)
		.map(i => `<text x="${ x(i) }" y="${ height - 8 }" text-anchor="middle" class="chart-axis">${ shortDate(checkIns[i].createdOn) }</text>`)
		.join("");

	let lines = CHART_SERIES.map(s => {
		let points = checkIns.map((c, i) => `${ x(i) },${ y(c[s.key]) }`).join(" ");
		let last = checkIns[checkIns.length - 1];
		return `
			<polyline points="${ points }" fill="none" stroke="${ s.color }" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
			<circle cx="${ x(checkIns.length - 1) }" cy="${ y(last[s.key]) }" r="4" fill="${ s.color }" stroke="var(--surface)" stroke-width="2"/>
			<text x="${ x(checkIns.length - 1) + 10 }" y="${ y(last[s.key]) + 4 }" class="chart-label">${ s.label } ${ last[s.key] }</text>
		`;
	}).join("");

	container.innerHTML = `
		<div class="chart-legend">
			${ CHART_SERIES.map(s => `<span><i style="background:${ s.color }"></i>${ s.label } <span class="muted">(${ s.hint })</span></span>`).join("") }
		</div>
		<div class="chart-wrap">
			<svg viewBox="0 0 ${ width } ${ height }" role="img" aria-label="Mood and anxiety over the last ${ checkIns.length } check-ins">
				${ grid }${ xLabels }${ lines }
				<line class="chart-crosshair" y1="${ pad.top }" y2="${ pad.top + innerH }" style="display:none"/>
				<rect class="chart-hit" x="${ pad.left }" y="${ pad.top }" width="${ innerW }" height="${ innerH }" fill="transparent"/>
			</svg>
			<div class="chart-tooltip" hidden></div>
		</div>
		<details class="chart-table">
			<summary>Show as table</summary>
			<table>
				<thead><tr><th>Date</th><th>Mood</th><th>Anxiety</th><th>Sleep</th><th>Meds</th><th>Note</th></tr></thead>
				<tbody>
					${ checkIns.slice().reverse().map(c => `
						<tr>
							<td>${ shortDate(c.createdOn) }</td><td>${ c.mood }</td><td>${ c.anxiety }</td>
							<td>${ c.sleepHours != null ? c.sleepHours + " h" : "" }</td>
							<td>${ c.tookMedication ? "Taken" : "Missed" }</td>
							<td>${ escapeHtml(c.note) }</td>
						</tr>
					`).join("") }
				</tbody>
			</table>
		</details>
	`;

	// Hover: snap to the nearest check-in and show its values
	let svg = container.querySelector("svg");
	let hit = container.querySelector(".chart-hit");
	let crosshair = container.querySelector(".chart-crosshair");
	let tooltip = container.querySelector(".chart-tooltip");

	hit.addEventListener("mousemove", (e) => {
		let rect = svg.getBoundingClientRect();
		let svgX = ((e.clientX - rect.left) / rect.width) * width;
		let index = checkIns.length === 1 ? 0 : Math.round(((svgX - pad.left) / innerW) * (checkIns.length - 1));
		index = Math.max(0, Math.min(checkIns.length - 1, index));
		let c = checkIns[index];

		crosshair.setAttribute("x1", x(index));
		crosshair.setAttribute("x2", x(index));
		crosshair.style.display = "";

		tooltip.innerHTML = `
			<strong>${ shortDate(c.createdOn) }</strong>
			${ CHART_SERIES.map(s => `<div><i style="background:${ s.color }"></i>${ s.label } <b>${ c[s.key] }</b></div>`).join("") }
			${ c.sleepHours != null ? `<div class="muted">Sleep ${ c.sleepHours } h</div>` : "" }
			${ c.tookMedication ? "" : `<div class="muted">Missed medication</div>` }
			${ c.note ? `<div class="muted">"${ escapeHtml(c.note) }"</div>` : "" }
		`;
		tooltip.hidden = false;

		let left = (x(index) / width) * rect.width;
		tooltip.style.left = `${ Math.min(left + 12, rect.width - 170) }px`;
	});

	hit.addEventListener("mouseleave", () => {
		crosshair.style.display = "none";
		tooltip.hidden = true;
	});
};
