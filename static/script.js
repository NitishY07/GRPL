const fallbackImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='150' height='150' fill='%23475569'/></svg>";

function getScoreClass(toPar) {
    if (toPar < 0) return 'score-under';
    if (toPar > 0) return 'score-over';
    return 'score-even';
}

function getAvatarHTML(url, size=32) {
    if(url) {
        return `<img src="${url}" class="avatar" style="width:${size}px; height:${size}px;" onerror="this.onerror=null; this.src='${fallbackImg}';">`;
    }
    return `<div class="avatar" style="width:${size}px; height:${size}px;"></div>`;
}

let tournamentData = null;
let individualData = [];
let teamData = [];
let currentGfxType = null;
let currentSpotlightId = null;

async function fetchAllData() {
    try {
        const indRes = await fetch('/api/leaderboard');
        const indJson = await indRes.json();
        
        const teamRes = await fetch('/api/team_leaderboard');
        const teamJson = await teamRes.json();
        
        if (indJson.status === 'success') {
            tournamentData = indJson.tournament_details;
            individualData = indJson.scores || [];
            document.getElementById('tournament-name').textContent = tournamentData.name;
        }
        
        if (teamJson.status === 'success') {
            teamData = teamJson.teams || [];
        }
        
        renderGFX();
    } catch(e) {
        console.error("Error fetching data", e);
    }
}

function renderGFX() {
    if(!currentGfxType) return;
    
    // Set active view
    document.querySelectorAll('.gfx-view').forEach(el => el.classList.remove('active'));
    document.getElementById('gfx-' + currentGfxType).classList.add('active');

    if (currentGfxType === 'team_table') {
        document.getElementById('gfx-subtitle').textContent = 'TEAM STANDINGS';
        const tbody = document.getElementById('team-body');
        tbody.innerHTML = '';
        teamData.forEach(team => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${team.rank}</strong></td>
                    <td><div class="team-info">${getAvatarHTML(team.team_image)} <span class="name">${team.team_name}</span></div></td>
                    <td class="${getScoreClass(team.total_par)}">${team.over_display}</td>
                    <td>${team.net_display}</td>
                </tr>`;
        });
    }
    else if (currentGfxType === 'team_ticker') {
        const ticker = document.getElementById('team-ticker-body');
        const content = teamData.map(team => 
            `<div class="ticker-item"><span style="color:#94a3b8">#${team.rank}</span> ${team.team_name} <span class="${getScoreClass(team.total_par)}">${team.over_display}</span></div>`
        ).join('');
        ticker.innerHTML = content + content; // Duplicate for seamless loop
    }
    else if (currentGfxType === 'individual_table') {
        document.getElementById('gfx-subtitle').textContent = 'INDIVIDUAL LEADERS (TOP 20)';
        const tbody = document.getElementById('individual-body');
        tbody.innerHTML = '';
        individualData.slice(0, 20).forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.position}</strong></td>
                    <td><div class="player-info">${getAvatarHTML(p.profile_image)} <span class="name">${p.firstname} ${p.lastname}</span></div></td>
                    <td class="${getScoreClass(p.to_par)}">${p.over_display}</td>
                    <td>${p.net_display}</td>
                    <td>${p.updated_hole || '-'}</td>
                </tr>`;
        });
    }
    else if (currentGfxType === 'individual_ticker') {
        const ticker = document.getElementById('individual-ticker-body');
        const content = individualData.slice(0, 20).map(p => 
            `<div class="ticker-item"><span style="color:#94a3b8">#${p.position}</span> ${p.firstname} ${p.lastname} <span class="${getScoreClass(p.to_par)}">${p.over_display}</span></div>`
        ).join('');
        ticker.innerHTML = content + content; // Duplicate for seamless loop
    }
    else if (currentGfxType === 'player_spotlight') {
        document.getElementById('gfx-subtitle').textContent = 'PLAYER SPOTLIGHT';
        const p = individualData.find(x => x.user_id === currentSpotlightId);
        if (p) {
            document.getElementById('spotlight-img').innerHTML = getAvatarHTML(p.profile_image, 150);
            document.getElementById('spotlight-name').textContent = `${p.firstname} ${p.lastname}`;
            document.getElementById('spotlight-team').textContent = p.team_name || "Independent";
            document.getElementById('spotlight-pos').textContent = p.position;
            document.getElementById('spotlight-topar').className = "value " + getScoreClass(p.to_par);
            document.getElementById('spotlight-topar').textContent = p.over_display;
            document.getElementById('spotlight-score').textContent = p.net_display;
            document.getElementById('spotlight-hole').textContent = p.updated_hole || '-';
        }
    }
}

async function pollState() {
    try {
        const response = await fetch('/api/state');
        const state = await response.json();
        
        const gfxContainer = document.getElementById('gfx-main');
        
        if (state.show_gfx) {
            gfxContainer.style.opacity = '1';
            gfxContainer.style.transform = 'translateY(0)';
        } else {
            gfxContainer.style.opacity = '0';
            gfxContainer.style.transform = 'translateY(-20px)';
        }

        if (state.gfx_type !== currentGfxType || state.spotlight_player_id !== currentSpotlightId) {
            currentGfxType = state.gfx_type;
            currentSpotlightId = state.spotlight_player_id;
            
            // Adjust layout for tickers
            if (currentGfxType.includes('ticker')) {
                gfxContainer.classList.add('ticker-layout');
                document.getElementById('gfx-header').style.display = 'none';
            } else {
                gfxContainer.classList.remove('ticker-layout');
                document.getElementById('gfx-header').style.display = 'flex';
            }
            
            renderGFX(); // re-render if type changed
        }
    } catch (error) {
        console.error('Error polling state:', error);
    }
}

// Initial load
fetchAllData();

// Data refresh every 30 seconds
setInterval(fetchAllData, 30000);

// Fast poll for control panel responsiveness
setInterval(pollState, 1000);
