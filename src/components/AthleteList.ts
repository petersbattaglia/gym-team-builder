import { Athlete } from './Athlete';
import { SharedState } from './SharedState';

export class AthleteList {
    private athletes: Athlete[] = [];
    private editingIndex: number | null = null;
    private sharedState: SharedState;

    constructor() {
        this.sharedState = SharedState.getInstance();
        this.loadAthletes();
    }

    private async loadAthletes() {
        try {
            const response = await fetch(this.sharedState.getEndpoint() + '/attendees', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received data:', data);
    
            if (data && data.response && data.response.response && Array.isArray(data.response.response)) {
                this.athletes = data.response.response.map((athlete: any) => ({
                    firstName: athlete.firstName || '',
                    lastName: athlete.lastName || '',
                    gender: athlete.gender || '',
                    skillRating: typeof athlete.skillRating === 'number' ? athlete.skillRating : 0
                })).sort((a: Athlete, b: Athlete) => {
                    // First, compare by first name
                    const firstNameComparison = a.firstName.localeCompare(b.firstName);

                    // If first names are equal, compare by last name
                    if (firstNameComparison === 0) {
                      return a.lastName.localeCompare(b.lastName);
                    }

                    // Otherwise, return the result of first name comparison
                    return firstNameComparison;
                  });
            } else {
                console.error('Unexpected data structure:', data);
                throw new Error('Unexpected data structure');
            }
            
            console.log('Processed athletes:', this.athletes);
            this.updateList();
        } catch (error) {
            console.error('Error loading athletes:', error);
            alert('Failed to load athletes. Please check the console for more details.');
        }
    }

    render() {
        return `
            <div class="container">
                <h2>Athlete List</h2>
                <div>
                    <input type="text" id="firstName" placeholder="First Name" />
                    <input type="text" id="lastName" placeholder="Last Name" />
                    <div class="radHolder">
                    <input type="radio" id="genderM" name="gender" value="Male" class="radSelector" /> <label for="genderM" class="radLabel">Male</label>
                    <input type="radio" id="genderF" name="gender" value="Female" class="radSelector" /> <label for="genderF" class="radLabel">Female</label>
                    </div>
                    <br />
                    <div class="radHolder">
                    ${Array.from({length: 5}, (_, i) => `<input type="radio" name="skillRating" id="skillRating${i+1}" value="${i+1}" class="radSelector" /> <label for="skillRating${i+1}" class="radLabel">${i+1}</label>`).join(' ')}
                    </div>
                    <br />
                    <div class="radHolder">
                    ${Array.from({length: 5}, (_, i) => `<input type="radio" name="skillRating" id="skillRating${i+6}" value="${i+6}" class="radSelector" /> <label for="skillRating${i+6}" class="radLabel">${i+6}</label>`).join(' ')}
                    </div>
                    <br />
                    <center>
                        <div style="display: inline;">
                            <button id="addOrUpdateAthlete">Add Athlete</button>&nbsp;&nbsp;&nbsp;
                            <button id="cancelUpdate" hidden="true">Cancel Update</button>
                        </div>
                    </center>
                </div>
                <ul id="athleteList"></ul>
            </div>
        `;
    }

    async addOrUpdateAthlete() {
        const firstName = (document.getElementById('firstName') as HTMLInputElement).value.trim();
        const lastName = (document.getElementById('lastName') as HTMLInputElement).value.trim();
        const gender = (document.querySelector('input[name="gender"]:checked') as HTMLInputElement).value;
        const skillRating = parseInt((document.querySelector('input[name="skillRating"]:checked') as HTMLInputElement).value, 10);

        if (firstName && lastName && gender && skillRating) {
            const athlete: Athlete = { firstName, lastName, gender, skillRating };
            
            if (this.editingIndex !== null) {
                // Update existing athlete
                if (this.isDuplicateAthlete(athlete, this.editingIndex)) {
                    alert('An athlete with this name already exists.');
                    return;
                }
                const oldAthlete = this.athletes[this.editingIndex];
                this.athletes[this.editingIndex] = athlete;
                this.sharedState.updateAthlete(oldAthlete, athlete);
                this.editingIndex = null;
                (document.getElementById('addOrUpdateAthlete') as HTMLButtonElement).textContent = 'Add Athlete';
            } else {
                // Add new athlete
                if (this.isDuplicateAthlete(athlete)) {
                    alert('An athlete with this name already exists.');
                    return;
                }
                this.athletes.push(athlete);
            }

            this.athletes.sort((a, b) => {
                // First, compare by first name
                const firstNameComparison = a.firstName.localeCompare(b.firstName);

                // If first names are equal, compare by last name
                if (firstNameComparison === 0) {
                  return a.lastName.localeCompare(b.lastName);
                }

                // Otherwise, return the result of first name comparison
                return firstNameComparison;
              });

            // Make POST request with updated athlete list
            try {
                const response = await fetch(this.sharedState.getEndpoint() + '/attendees', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ response: this.athletes }),
                    mode: 'cors'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Reload athletes
                await this.loadAthletes();
            } catch (error) {
                console.error('Error updating athletes:', error);
                alert('Failed to update athletes. Please try again.');
            }

            this.updateList();
            this.clearForm();

            //const selectedAthletes = this.sharedState.getSelectedAthletes();
            //selectedAthletes.push(athlete);

        } else {
            alert('Please fill out all fields.');
        }
    }

    private isDuplicateAthlete(athlete: Athlete, excludeIndex: number = -1): boolean {
        return this.athletes.some((existingAthlete, index) => 
            index !== excludeIndex &&
            existingAthlete.firstName.toLowerCase() === athlete.firstName.toLowerCase() &&
            existingAthlete.lastName.toLowerCase() === athlete.lastName.toLowerCase()
        );
    }

    updateList() {
        const listElement = document.getElementById('athleteList');
        if (listElement) {
            // Sort and group athletes by first letter of first name
            const sortedAthletes = this.athletes.sort((a, b) => a.firstName.localeCompare(b.firstName));
            const groupedAthletes: { [key: string]: any[] } = {};
            sortedAthletes.forEach(athlete => {
                const firstLetter = athlete.firstName.charAt(0).toUpperCase();
                if (!groupedAthletes[firstLetter]) {
                    groupedAthletes[firstLetter] = [];
                }
                groupedAthletes[firstLetter].push(athlete);
            });

            // Generate HTML
            let html = '';
            Object.keys(groupedAthletes).sort().forEach((firstLetter) => {
                const athletes = groupedAthletes[firstLetter];
                html += `<h2>${firstLetter}</h2>`; // Header with letter
                html += '<ul>';
                athletes.forEach((athlete, athleteIndex) => {
                    const athleteIndexInOriginalList = sortedAthletes.indexOf(athlete);
                    html += `
                        <li>
                            <span class="athlete-info">
                                ${athlete.firstName} ${athlete.lastName} (${athlete.gender}, Skill: ${athlete.skillRating})
                            </span>
                            <span class="athlete-actions">
                                <button onclick="athleteList.editAthlete(${athleteIndexInOriginalList})" class="edit-btn">Edit</button>
                                <button onclick="athleteList.removeAthlete(${athleteIndexInOriginalList})" class="remove-btn">Delete</button>
                            </span>
                        </li>
                    `;
                });
                html += '</ul>';
            });

            html += `<br /><br />${sortedAthletes.length} Total Athletes.`;

            listElement.innerHTML = html;
        }
    }

    editAthlete(index: number) {
        const athlete = this.athletes[index];
        (document.getElementById('firstName') as HTMLInputElement).value = athlete.firstName;
        (document.getElementById('lastName') as HTMLInputElement).value = athlete.lastName;
        if (athlete.gender == "Male") {
            (document.getElementById('genderM') as HTMLInputElement).checked = true;
        } else {
            (document.getElementById('genderF') as HTMLInputElement).checked = true;
        }

        (document.getElementById('skillRating'+athlete.skillRating.toString()) as HTMLInputElement).checked = true;

        this.editingIndex = index;
        (document.getElementById('addOrUpdateAthlete') as HTMLButtonElement).textContent = 'Update Athlete';
        (document.getElementById('cancelUpdate') as HTMLButtonElement).hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async removeAthlete(index: number) {
        this.athletes.splice(index, 1);
        
        // Make POST request with updated athlete list
        try {
            const response = await fetch(this.sharedState.getEndpoint() + '/attendees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ response: this.athletes })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Reload athletes
            await this.loadAthletes();
        } catch (error) {
            console.error('Error updating athletes:', error);
            alert('Failed to remove athlete. Please try again.');
        }
    }

    clearForm() {
        (document.getElementById('firstName') as HTMLInputElement).value = '';
        (document.getElementById('lastName') as HTMLInputElement).value = '';

        (document.getElementById('genderM') as HTMLInputElement).checked = false;
        (document.getElementById('genderF') as HTMLInputElement).checked = false;

        for(var i=0; i < 10; i++) {
            (document.getElementById('skillRating'+(i+1).toString()) as HTMLInputElement).checked = false;
        }

        this.editingIndex = null;
        (document.getElementById('addOrUpdateAthlete') as HTMLButtonElement).textContent = 'Add Athlete';

        (document.getElementById('cancelUpdate') as HTMLButtonElement).hidden = true;
    }

    cancelUpdate() {
        this.clearForm();
    }

    getAthletes(): Athlete[] {
        return this.athletes;
    }
}