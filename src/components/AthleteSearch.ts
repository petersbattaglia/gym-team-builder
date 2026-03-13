import { Athlete } from './Athlete';
import { AthleteList } from './AthleteList';
import { SharedState } from './SharedState';

export class AthleteSearch {
    private allAthletes: Athlete[] = [];
    private sharedState: SharedState;
    private searchResults: Athlete[] = [];
    private currentTeams: Athlete[][] = []; // <-- new: in-memory teams for DnD

    constructor(athleteList: AthleteList) {
        this.allAthletes = athleteList.getAthletes();
        this.sharedState = SharedState.getInstance();
        this.sharedState.addChangeListener(() => this.onAthleteChange());
    }

    render() {
        const selectedAthletes = this.sharedState.getSelectedAthletes();
        return `
            <div class="container">
                <h2>Build Teams</h2>
                <input type="text" id="athleteSearchInput" placeholder="Search athletes..." oninput="athleteSearch.searchAthletes()">
                <div id="searchResults"></div>
                <h3>Selected Athletes <span id="selectedCount">(${selectedAthletes.length})</span></h3>
                <button id="clearAllAthletes" onclick="athleteSearch.clearAllAthletes()">Clear All Athletes</button>
                <br /><br />
                <ul id="selectedAthletes" class="compact-list"></ul>
                <br />
                <label for="teamSize">Team Size</label>
                <select id="teamSize">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3" selected>3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                </select>
                <button id="makeTeams">Make Teams</button>
            </div>
        `;
    }

    searchAthletes() {
        const searchInput = document.getElementById('athleteSearchInput') as HTMLInputElement;
        if (searchInput) {
            const searchTerm = searchInput.value.toLowerCase();
            if(searchTerm === '') {
                this.searchResults = [];
            }
            else {
                const selectedAthletes = this.sharedState.getSelectedAthletes();
                
                this.searchResults = this.allAthletes.filter(athlete => 
                    (athlete.firstName.toLowerCase().includes(searchTerm) || 
                    athlete.lastName.toLowerCase().includes(searchTerm)) &&
                    !this.isAthleteSelected(athlete, selectedAthletes)
                );
            }
                
            this.displaySearchResults();
        }
    }

    displaySearchResults() {
        const resultsElement = document.getElementById('searchResults');
        if (resultsElement) {
            resultsElement.innerHTML = this.searchResults.map((athlete, index) =>
                `<div>
                    ${athlete.firstName} ${athlete.lastName} (${athlete.gender}, Skill: ${athlete.skillRating})
                    <button onclick="athleteSearch.addSelectedAthlete(${index})">Add</button>
                </div>`
            ).join('');
        }
    }

    clearSearchResults() {
        const resultsElement = document.getElementById('searchResults');
        if (resultsElement) {
            resultsElement.innerHTML = '';
        }
        const searchInput = document.getElementById('athleteSearchInput') as HTMLInputElement;
        if (searchInput) {
            searchInput.value = '';
        }
    }

    removeSelectedAthlete(index: number) {
        const selectedAthletes = this.sharedState.getSelectedAthletes();
        selectedAthletes.splice(index, 1);

        selectedAthletes.sort((a: Athlete, b: Athlete) => {
            // First, compare by first name
            const firstNameComparison = a.firstName.localeCompare(b.firstName);

            // If first names are equal, compare by last name
            if (firstNameComparison === 0) {
              return a.lastName.localeCompare(b.lastName);
            }

            // Otherwise, return the result of first name comparison
            return firstNameComparison;
        });

        this.sharedState.setSelectedAthletes(selectedAthletes);
        this.updateSelectedList();
        this.clearSearchResults(); // Clear search results when an athlete is removed
    }

    addSelectedAthlete(index: number) {
        const athlete = this.searchResults[index];
        const selectedAthletes = this.sharedState.getSelectedAthletes();
        if (athlete && !this.isAthleteSelected(athlete, selectedAthletes)) {
            selectedAthletes.push(athlete);

            selectedAthletes.sort((a: Athlete, b: Athlete) => {
                // First, compare by first name
                const firstNameComparison = a.firstName.localeCompare(b.firstName);

                // If first names are equal, compare by last name
                if (firstNameComparison === 0) {
                  return a.lastName.localeCompare(b.lastName);
                }

                // Otherwise, return the result of first name comparison
                return firstNameComparison;
            });

            this.sharedState.setSelectedAthletes(selectedAthletes);
            this.updateSelectedList();
        }
        this.clearSearchResults(); // Clear search results after adding an athlete
    }

    onAthleteChange() {
        this.updateSelectedList();
        // We don't need to update search results here
    }

    clearAllAthletes() {
        this.sharedState.setSelectedAthletes(([] as Athlete[]));
        this.updateSelectedList();
        this.clearSearchResults();
    }

    private isAthleteSelected(athlete: Athlete, selectedAthletes: Athlete[]): boolean {
        return selectedAthletes.some(selectedAthlete => 
            selectedAthlete.firstName === athlete.firstName && 
            selectedAthlete.lastName === athlete.lastName
        );
    }

    updateSelectedList() {
        const selectedAthletes = this.sharedState.getSelectedAthletes();
        selectedAthletes.sort((a: Athlete, b: Athlete) => {
            // First, compare by first name
            const firstNameComparison = a.firstName.localeCompare(b.firstName);

            // If first names are equal, compare by last name
            if (firstNameComparison === 0) {
              return a.lastName.localeCompare(b.lastName);
            }

            // Otherwise, return the result of first name comparison
            return firstNameComparison;
        });
        const listElement = document.getElementById('selectedAthletes');
        const countElement = document.getElementById('selectedCount');
        if (listElement && countElement) {
            listElement.innerHTML = selectedAthletes.map((athlete, index) =>
                `<li>
                    <span class="athlete-info">
                        ${athlete.firstName} ${athlete.lastName} (${athlete.gender}, Skill: ${athlete.skillRating})
                    </span>
                    <button onclick="athleteSearch.removeSelectedAthlete(${index})" class="remove-btn">Delete</button>
                </li>`
            ).join('');
            countElement.textContent = `(${selectedAthletes.length})`;
        }
    }

    makeTeams() {
        const teamSizeElement = document.getElementById('teamSize') as HTMLSelectElement;
        const teamSize = parseInt(teamSizeElement.value, 10);
        const selectedAthletes = this.sharedState.getSelectedAthletes();

        if (!teamSize || selectedAthletes.length === 0) {
            alert('Please select a team size and ensure you have selected athletes.');
            return;
        }

        const requestBody = {
            team_size: teamSize,
            attendees: selectedAthletes
        };

        fetch(this.sharedState.getEndpoint() + '/make-teams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            mode: 'cors',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Teams created:', data);

            // Normalize server response into array-of-arrays
            let teams: Athlete[][];
            if (Array.isArray(data)) {
                teams = data as Athlete[][];
            } else if (data && typeof data === 'object') {
                teams = Object.values(data) as Athlete[][];
            } else {
                console.error('Unexpected data format:', data);
                alert('Failed to parse teams response.');
                return;
            }

            // Keep teams in memory so we can mutate on drag/drop
            this.currentTeams = teams;

            // Remove any existing teams display
            const existingTeams = document.getElementById('createdTeams');
            if (existingTeams) {
                existingTeams.remove();
            }

            // Render the new teams into a container element
            const teamsContainer = document.createElement('div');
            teamsContainer.id = 'createdTeams';
            teamsContainer.innerHTML = this.renderTeams(this.currentTeams);

            // Insert into DOM right after the makeTeams button
            const makeTeamsButton = document.getElementById('makeTeams');
            if (makeTeamsButton && makeTeamsButton.parentNode) {
                makeTeamsButton.parentNode.insertBefore(teamsContainer, makeTeamsButton.nextSibling);
            }

            // Attach drag & drop handlers
            this.attachDragHandlers(teamsContainer);
        })
        .catch(error => {
            console.error('Error creating teams:', error);
            alert('Failed to create teams. Please check the console for more details.');
        });
    }

    // Render teams - now expects an array-of-arrays of Athlete
    renderTeams(data: Athlete[][]): string {
        if (!Array.isArray(data) || data.length === 0) {
            return '<p>No teams were created.</p>';
        }

        let teamsHtml = '<div id="createdTeamsInner" class="teams-grid">';
        data.forEach((team, index) => {
            const aggregate = Array.isArray(team) ? team.reduce((sum, a) => sum + (Number((a as any).skillRating) || 0), 0) : 0;
            teamsHtml += `
                <div class="team" data-team-index="${index}">
                    <h4>Team ${index + 1} (${team.length})</h4>
                    <ul class="team-list" data-team-index="${index}">
                        ${Array.isArray(team) ? team.map((ath, i) => `
                            <li draggable="true" class="team-member" data-team-index="${index}" data-athlete-index="${i}">
                                ${(ath.firstName || '')} ${(ath.lastName || '')} (${ath.gender || ''}, Skill: ${(ath as any).skillRating ?? ''})
                            </li>
                        `).join('') : ''}
                    </ul>
                    <div class="aggregate-score">Aggregate Score: <b>${aggregate}</b></div>
                </div>
            `;
        });
        teamsHtml += '</div>';
        return teamsHtml;
    }

    // Attach drag/drop handlers and update view on changes
    private attachDragHandlers(container: HTMLElement) {
        // cast NodeLists to HTMLElement collections for proper types
        const members = container.querySelectorAll('.team-member') as NodeListOf<HTMLElement>;
        members.forEach(el => {
            el.addEventListener('dragstart', (ev: Event) => {
                const e = ev as DragEvent;
                const target = e.currentTarget as HTMLElement;
                const teamIndex = target.dataset.teamIndex ?? '';
                const athleteIndex = target.dataset.athleteIndex ?? '';
                e.dataTransfer?.setData('text/plain', `${teamIndex}:${athleteIndex}`);
                if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
            });
        });

        const lists = container.querySelectorAll('.team-list') as NodeListOf<HTMLElement>;
        lists.forEach(list => {
            list.addEventListener('dragover', (ev: Event) => {
                ev.preventDefault();
                const e = ev as DragEvent;
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
            });

            list.addEventListener('drop', (ev: Event) => {
                ev.preventDefault();
                const e = ev as DragEvent;
                const payload = e.dataTransfer?.getData('text/plain');
                if (!payload) return;
                const [srcTeamStr, srcIdxStr] = payload.split(':');
                const srcTeam = parseInt(srcTeamStr, 10);
                const srcIdx = parseInt(srcIdxStr, 10);
                const targetTeam = parseInt((list as HTMLElement).dataset.teamIndex || '0', 10);

                if (!Array.isArray(this.currentTeams[srcTeam]) || !this.currentTeams[srcTeam][srcIdx]) return;

                const athlete = this.currentTeams[srcTeam].splice(srcIdx, 1)[0];
                this.currentTeams[targetTeam].push(athlete);

                const teamsContainer = document.getElementById('createdTeams');
                if (!teamsContainer) return;
                teamsContainer.innerHTML = this.renderTeams(this.currentTeams);
                this.attachDragHandlers(teamsContainer);
            });
        });
    }

    updateAthleteList(athleteList: AthleteList) {
        this.allAthletes = athleteList.getAthletes();
        // Update selected athletes if any of them have been modified
        const selectedAthletes = this.sharedState.getSelectedAthletes();
        const updatedSelectedAthletes = selectedAthletes.map(selectedAthlete => {
            const updatedAthlete = this.allAthletes.find(a => 
                a.firstName === selectedAthlete.firstName && a.lastName === selectedAthlete.lastName
            );
            return updatedAthlete || selectedAthlete;
        });

        updatedSelectedAthletes.sort((a: Athlete, b: Athlete) => {
            // First, compare by first name
            const firstNameComparison = a.firstName.localeCompare(b.firstName);
            
            // If first names are equal, compare by last name
            if (firstNameComparison === 0) {
              return a.lastName.localeCompare(b.lastName);
            }
            
            // Otherwise, return the result of first name comparison
            return firstNameComparison;
        });

        this.sharedState.setSelectedAthletes(updatedSelectedAthletes);
    }
}