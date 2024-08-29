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
            const response = await fetch('https://internal-ts.petersbattaglia.com:8443/attendees', {
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
                })).sort((a: Athlete, b: Athlete) => a.firstName.localeCompare(b.firstName));
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
                    <select id="gender">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    <select id="skillRating">
                        <option value="">Select Skill Rating</option>
                        ${Array.from({length: 5}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
                    </select>
                    <button id="addOrUpdateAthlete">Add Athlete</button>
                </div>
                <ul id="athleteList"></ul>
            </div>
        `;
    }

    async addOrUpdateAthlete() {
        const firstName = (document.getElementById('firstName') as HTMLInputElement).value.trim();
        const lastName = (document.getElementById('lastName') as HTMLInputElement).value.trim();
        const gender = (document.getElementById('gender') as HTMLSelectElement).value;
        const skillRating = parseInt((document.getElementById('skillRating') as HTMLSelectElement).value, 10);

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

            // Sort athletes by first name
            this.athletes.sort((a, b) => a.firstName.localeCompare(b.firstName));

            // Make POST request with updated athlete list
            try {
                const response = await fetch('https://internal-ts.petersbattaglia.com:8443/attendees', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ response: this.athletes }),
                    mode: 'cors' // Explicitly set CORS mode
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
            listElement.innerHTML = this.athletes.map((athlete, index) =>
                `<li>
                    <span class="athlete-info">
                        ${athlete.firstName} ${athlete.lastName} (${athlete.gender}, Skill: ${athlete.skillRating})
                    </span>
                    <span class="athlete-actions">
                        <button onclick="athleteList.editAthlete(${index})" class="edit-btn">Edit</button>
                        <button onclick="athleteList.removeAthlete(${index})" class="remove-btn">Delete</button>
                    </span>
                </li>`
            ).join('');
        }
    }

    editAthlete(index: number) {
        const athlete = this.athletes[index];
        (document.getElementById('firstName') as HTMLInputElement).value = athlete.firstName;
        (document.getElementById('lastName') as HTMLInputElement).value = athlete.lastName;
        (document.getElementById('gender') as HTMLSelectElement).value = athlete.gender;
        (document.getElementById('skillRating') as HTMLSelectElement).value = athlete.skillRating.toString();

        this.editingIndex = index;
        (document.getElementById('addOrUpdateAthlete') as HTMLButtonElement).textContent = 'Update Athlete';
    }

    async removeAthlete(index: number) {
        this.athletes.splice(index, 1);
        
        // Make POST request with updated athlete list
        try {
            const response = await fetch('https://internal-ts.petersbattaglia.com:8443/attendees', {
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
        (document.getElementById('gender') as HTMLSelectElement).value = '';
        (document.getElementById('skillRating') as HTMLSelectElement).value = '';
        this.editingIndex = null;
        (document.getElementById('addOrUpdateAthlete') as HTMLButtonElement).textContent = 'Add Athlete';
    }

    getAthletes(): Athlete[] {
        return this.athletes;
    }
}