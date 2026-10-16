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
let overallData = [];
let currentGfxType = null;
let currentSpotlightId = null;

let isFetchingData = false;
async function fetchAllData() {
    if (isFetchingData) return;
    isFetchingData = true;
    try {
        const [indRes, teamRes, overallRes] = await Promise.all([
            fetch('/api/leaderboard'),
            fetch('/api/team_leaderboard'),
            fetch('/api/overall_standings')
        ]);

        const [indJson, teamJson, overallJson] = await Promise.all([
            indRes.json(),
            teamRes.json(),
            overallRes.json()
        ]);
        
        if (indJson.status === 'success') {
            tournamentData = indJson.tournament_details;
            individualData = indJson.scores || [];
            const tNameEl = document.getElementById('tournament-name');
            if (tNameEl && tournamentData) tNameEl.textContent = tournamentData.name;
        }
        
        if (teamJson.status === 'success') {
            teamData = teamJson.teams || [];
        }

        if (overallJson.status === 'success') {
            overallData = overallJson.standings || [];
        }
        
        renderGFX();
    } catch(e) {
        console.error("Error fetching data", e);
    } finally {
        isFetchingData = false;
    }
}

const teamColors = {
    'Ahmedabad Aces': 'linear-gradient(180deg, #021B45 50%, #6F7E34 100%)',
    'Delhi Royals': 'linear-gradient(180deg, #442046 50%, #DCC6A5 100%)',
    'Gurugram Titans': 'linear-gradient(180deg, #03110F 50%, #E0B937 100%)',
    'Hyderabad Albatross': 'linear-gradient(180deg, #A8874D 50%, #556033 100%)',
    'KHT Bangalore Eagles': 'linear-gradient(180deg, #04160F 50%, #D8B07A 100%)',
    'Kolar Zioneers': 'linear-gradient(180deg, #E9CF63 50%, #E56A2B 100%)'
};

function getTeamBackground(teamName) {
    return teamColors[teamName] || '';
}

function renderGFX() {
    if(!currentGfxType) return;
    
    // Set active view
    document.querySelectorAll('.gfx-view').forEach(el => el.classList.remove('active'));
    
    if (currentGfxType === 'combo_hole_mini') {
        const p = document.getElementById('gfx-player_hole');
        const m = document.getElementById('gfx-mini_team_table');
        if (p) p.classList.add('active');
        if (m) m.classList.add('active');
    } else {
        const target = document.getElementById('gfx-' + currentGfxType);
        if(target) target.classList.add('active');
    }

    if (currentGfxType === 'team_table') {
        document.getElementById('gfx-subtitle').textContent = 'TEAM STANDINGS';
        const tbody = document.getElementById('team-body');
        tbody.innerHTML = '';
        teamData.forEach(team => {
            const bg = getTeamBackground(team.team_name);
            const styleAttr = bg ? `style="background: ${bg};"` : 'style="background: rgba(0,0,0,0.6);"';
            tbody.innerHTML += `
                <div class="team-row-pill" ${styleAttr}>
                    <div class="col-rank">${team.rank}</div>
                    <div class="col-team">${getAvatarHTML(team.team_image)} <span>${team.team_name}</span></div>
                    <div class="col-score ${getScoreClass(team.total_par)}">${team.over_display}</div>
                    <div class="col-score">${team.net_display}</div>
                </div>`;
        });
    }

    if (currentGfxType === 'overall_table') {
        document.getElementById('gfx-subtitle').textContent = 'OVERALL SEASON STANDINGS';
        const tbody = document.getElementById('overall-body');
        tbody.innerHTML = '';
        overallData.forEach(item => {
            const bg = getTeamBackground(item.team_name);
            const styleAttr = bg ? `style="background: ${bg};"` : 'style="background: rgba(0,0,0,0.6);"';
            
            const matchingTeam = teamData.find(t => t.team_name.toLowerCase().trim() === item.team_name.toLowerCase().trim());
            const logoUrl = (matchingTeam && matchingTeam.team_image) ? matchingTeam.team_image : item.team_image;

            tbody.innerHTML += `
                <div class="overall-row-pill" ${styleAttr}>
                    <div class="col-rank">${item.rank}</div>
                    <div class="col-team">${getAvatarHTML(logoUrl)} <span>${item.team_name}</span></div>
                    <div class="col-leg">${(item.legs && item.legs.KLR) || '-'}</div>
                    <div class="col-leg">${(item.legs && item.legs.HYD) || '-'}</div>
                    <div class="col-leg">${(item.legs && item.legs.BLR) || '-'}</div>
                    <div class="col-leg">${(item.legs && item.legs.GUR) || '-'}</div>
                    <div class="col-leg">${(item.legs && item.legs.AMD) || '-'}</div>
                    <div class="col-leg">${(item.legs && item.legs.DEL) || '-'}</div>
                    <div class="col-pts">${item.points || '-'}</div>
                </div>`;
        });
    }
    
    if (currentGfxType === 'mini_team_table' || currentGfxType === 'combo_hole_mini') {
        const tbody = document.getElementById('mini-team-body');
        tbody.innerHTML = '';
        teamData.forEach(team => {
            const bg = getTeamBackground(team.team_name);
            const styleAttr = bg ? `style="background: ${bg};"` : 'style="background: rgba(0,0,0,0.6);"';
            tbody.innerHTML += `
                <div class="mini-row" ${styleAttr}>
                    <div class="m-rank">${team.rank}</div>
                    <div class="m-name">${team.team_name}</div>
                    <div class="m-topar ${getScoreClass(team.total_par)}">${team.over_display}</div>
                    <div class="m-score">${team.net_display}</div>
                </div>`;
        });
    }
    
    if (currentGfxType === 'team_ticker') {
        const ticker = document.getElementById('team-ticker-body');
        const content = teamData.map(team => {
            const bg = getTeamBackground(team.team_name);
            const styleAttr = bg ? `background: ${bg};` : 'background: rgba(0,0,0,0.6);';
            return `<div class="ticker-item" style="border-right: 1px solid rgba(255,255,255,0.25); ${styleAttr}">
                <span class="ticker-rank">#${team.rank}</span>
                <span class="ticker-name">${team.team_name}</span>
                <span class="ticker-score-badge ${getScoreClass(team.total_par)}">${team.over_display}</span>
            </div>`;
        }).join('');
        ticker.innerHTML = content + content; // Duplicate for seamless loop
    }
    
    if (currentGfxType === 'individual_table') {
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
    
    if (currentGfxType === 'individual_ticker') {
        const ticker = document.getElementById('individual-ticker-body');
        const content = individualData.slice(0, 20).map(p => {
            const bg = getTeamBackground(p.team_name);
            const styleAttr = bg ? `background: ${bg};` : 'background: rgba(0,0,0,0.6);';
            const posBadge = (p.position && p.position !== '-') ? `#${p.position}` : '-';
            return `<div class="ticker-item" style="border-right: 1px solid rgba(255,255,255,0.25); ${styleAttr}">
                <span class="ticker-rank">${posBadge}</span>
                <span class="ticker-name">${p.firstname} ${p.lastname}</span>
                <span class="ticker-score-badge ${getScoreClass(p.to_par)}">${p.over_display}</span>
            </div>`;
        }).join('');
        ticker.innerHTML = content + content; // Duplicate for seamless loop
    }
    
    if (currentGfxType === 'player_spotlight') {
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
    
    if (currentGfxType === 'player_hole' || currentGfxType === 'combo_hole_mini') {
        const p = individualData.find(x => x.user_id === currentSpotlightId);
        if (p) {
            // Apply team gradient background
            const bg = getTeamBackground(p.team_name);
            if (bg) {
                document.getElementById('ph-bg').style.background = bg;
            } else {
                document.getElementById('ph-bg').style.background = 'rgba(0,0,0,0.8)';
            }
            
            document.getElementById('ph-avatar').innerHTML = getAvatarHTML(p.profile_image, 70);
            document.getElementById('ph-name').textContent = `${p.firstname} ${p.lastname}`;
            document.getElementById('ph-team').textContent = p.team_name || "INDEPENDENT";
            
            document.getElementById('ph-score').textContent = p.over_display;
            document.getElementById('ph-score').style.background = (p.to_par < 0) ? 'rgba(181, 28, 53, 0.9)' : (p.to_par > 0 ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0,0,0,0.5)');
            
            document.getElementById('ph-pos').textContent = p.position;
            document.getElementById('ph-hole').textContent = p.updated_hole || '-';
            document.getElementById('ph-net').textContent = p.net_display;
        }
    }
}

// Standalone GFX parameter check
const urlParams = new URLSearchParams(window.location.search);
let pathGfx = null;
const pathname = window.location.pathname;
if (pathname.startsWith('/gfx/')) {
    pathGfx = pathname.replace('/gfx/', '').replace('/', '').trim();
}
const lockedGfxType = urlParams.get('gfx') || pathGfx;
if (lockedGfxType) {
    currentGfxType = lockedGfxType;
}

let isPollingState = false;
async function pollState() {
    if (isPollingState) return;
    isPollingState = true;
    try {
        const response = await fetch('/api/state');
        if (!response.ok) return;
        const state = await response.json();
        
        const gfxContainer = document.getElementById('gfx-main');
        
        const targetGfxType = lockedGfxType || state.gfx_type;
        const targetShowGfx = lockedGfxType ? true : state.show_gfx;

        if (targetGfxType !== currentGfxType || state.spotlight_player_id !== currentSpotlightId) {
            currentGfxType = targetGfxType;
            currentSpotlightId = state.spotlight_player_id;
            
            // Adjust layouts
            gfxContainer.classList.remove('ticker-layout', 'fullscreen-mode');
            document.getElementById('gfx-header').style.display = 'flex';
            
            // Handle specific modes
            if (currentGfxType && currentGfxType.includes('ticker')) {
                gfxContainer.classList.add('ticker-layout');
                document.getElementById('gfx-header').style.display = 'none';
            } else if (currentGfxType === 'mini_team_table') {
                gfxContainer.classList.add('fullscreen-mode');
                document.getElementById('gfx-header').style.display = 'none';
            } else if (currentGfxType === 'combo_hole_mini') {
                gfxContainer.classList.add('fullscreen-mode');
                document.getElementById('gfx-header').style.display = 'none';
            } else if (currentGfxType === 'player_hole') {
                gfxContainer.classList.add('fullscreen-mode');
                document.getElementById('gfx-header').style.display = 'none';
            }
            
            renderGFX(); // re-render if type changed
        }
        
        // Visibility (runs every tick)
        if (targetShowGfx) {
            if (gfxContainer.classList.contains('fullscreen-mode')) {
                gfxContainer.classList.add('visible');
                gfxContainer.classList.remove('hidden');
                gfxContainer.style.opacity = '';
                gfxContainer.style.transform = '';
            } else {
                gfxContainer.classList.remove('visible', 'hidden');
                gfxContainer.style.opacity = '1';
                gfxContainer.style.transform = 'translateY(0)';
            }
        } else {
            if (gfxContainer.classList.contains('fullscreen-mode')) {
                gfxContainer.classList.add('hidden');
                gfxContainer.classList.remove('visible');
                gfxContainer.style.opacity = '';
                gfxContainer.style.transform = '';
            } else {
                gfxContainer.classList.remove('visible', 'hidden');
                gfxContainer.style.opacity = '0';
                gfxContainer.style.transform = 'translateY(-20px)';
            }
        }
    } catch (error) {
        console.error('Error polling state:', error);
    } finally {
        isPollingState = false;
    }
}

// Initial load
fetchAllData();

// Data refresh every 10 seconds for live scoring updates
setInterval(fetchAllData, 10000);

// Fast poll for control panel responsiveness
setInterval(pollState, 1000);
