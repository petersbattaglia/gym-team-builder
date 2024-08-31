import { Athlete } from './Athlete';
import { AthleteList } from './AthleteList';
import { SharedState } from './SharedState';

export class AthleteSearch {
    private allAthletes: Athlete[] = [];
    private sharedState: SharedState;
    private searchResults: Athlete[] = [];

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
                <ul id="selectedAthletes" class="compact-list"></ul>
                <br> <!-- Added line break here -->
                <label for="teamSize">Team Size</label>
                <select id="teamSize">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3" selected>3</option> <!-- Set default value to 3 -->
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
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
        this.sharedState.setSelectedAthletes(selectedAthletes);
        this.updateSelectedList();
        this.clearSearchResults(); // Clear search results when an athlete is removed
    }

    addSelectedAthlete(index: number) {
        const athlete = this.searchResults[index];
        const selectedAthletes = this.sharedState.getSelectedAthletes();
        if (athlete && !this.isAthleteSelected(athlete, selectedAthletes)) {
            selectedAthletes.push(athlete);
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
    
        fetch('https://internal-ts.petersbattaglia.com:8443/make-teams', {
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
            
            // Remove any existing teams display
            const existingTeams = document.getElementById('createdTeams');
            if (existingTeams) {
                existingTeams.remove();
            }
    
            // Render the new teams
            const teamsContainer = document.createElement('div');
            teamsContainer.innerHTML = this.renderTeams(data);
            
            // Find the make teams button and insert the new teams after it
            const makeTeamsButton = document.getElementById('makeTeams');
            if (makeTeamsButton && makeTeamsButton.parentNode) {
                makeTeamsButton.parentNode.insertBefore(teamsContainer, makeTeamsButton.nextSibling);
            }
        })
        .catch(error => {
            console.error('Error creating teams:', error);
            alert('Failed to create teams. Please check the console for more details.');
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
        this.sharedState.setSelectedAthletes(updatedSelectedAthletes);
    }

    renderTeams(data: any) {
        console.log('Received data:', data); // Log the received data
    
        let teams: Athlete[][];
        if (Array.isArray(data)) {
            teams = data;
        } else if (data && typeof data === 'object') {
            teams = Object.values(data);
        } else {
            console.error('Unexpected data format:', data);
            return '<p>Error: Unable to render teams due to unexpected data format.</p>';
        }
    
        if (!Array.isArray(teams) || teams.length === 0) {
            return '<p>No teams were created.</p>';
        }
    
        let teamsHtml = '<div id="createdTeams">';
        teams.forEach((team, index) => {
            if (Array.isArray(team)) {
                teamsHtml += `
                    <div class="team">
                        <h4>Team ${index + 1}</h4>
                        <ul>
                            ${team.map(athlete => `<li>${athlete.firstName} ${athlete.lastName}</li>`).join('')}
                        </ul>
                    </div>
                `;
            } else {
                console.error('Unexpected team format:', team);
            }
        });
        teamsHtml += '</div>';
        return teamsHtml;
    }
}