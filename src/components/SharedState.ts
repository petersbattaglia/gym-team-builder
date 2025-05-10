// SharedState.ts
import { Athlete } from './Athlete';

export class SharedState {
    private static instance: SharedState;
    private endpoint: string = "https://teams.petersbattaglia.com"; //"https://internal-ts.petersbattaglia.com:8443" //  //
    private selectedAthletes: Athlete[] = [];
    private changeListeners: (() => void)[] = [];

    private constructor() {}

    static getInstance(): SharedState {
        if (!SharedState.instance) {
            SharedState.instance = new SharedState();
        }
        return SharedState.instance;
    }

    getEndpoint(): string {
        return this.endpoint;
    }

    getSelectedAthletes(): Athlete[] {
        if(localStorage.selectedAthletes) {
            this.selectedAthletes = JSON.parse(localStorage.selectedAthletes);
        }

        this.selectedAthletes.sort((a: Athlete, b: Athlete) => {
            // First, compare by first name
            const firstNameComparison = a.firstName.localeCompare(b.firstName);

            // If first names are equal, compare by last name
            if (firstNameComparison === 0) {
              return a.lastName.localeCompare(b.lastName);
            }

            // Otherwise, return the result of first name comparison
            return firstNameComparison;
        });


        return this.selectedAthletes;
    }

    setSelectedAthletes(athletes: Athlete[]): void {
        this.selectedAthletes = athletes;

        this.selectedAthletes.sort((a: Athlete, b: Athlete) => {
            // First, compare by first name
            const firstNameComparison = a.firstName.localeCompare(b.firstName);
            
            // If first names are equal, compare by last name
            if (firstNameComparison === 0) {
              return a.lastName.localeCompare(b.lastName);
            }
            
            // Otherwise, return the result of first name comparison
            return firstNameComparison;
        });

        localStorage.selectedAthletes = JSON.stringify(this.selectedAthletes);
        this.notifyChangeListeners();
    }

    updateAthlete(oldAthlete: Athlete, newAthlete: Athlete): void {
        this.selectedAthletes = this.selectedAthletes.map(athlete =>
            (athlete.firstName === oldAthlete.firstName && athlete.lastName === oldAthlete.lastName)
                ? { ...newAthlete }
                : athlete
        );
        localStorage.selectedAthletes = JSON.stringify(this.selectedAthletes);
        this.notifyChangeListeners();
    }

    addChangeListener(listener: () => void): void {
        this.changeListeners.push(listener);
    }

    private notifyChangeListeners(): void {
        this.changeListeners.forEach(listener => listener());
    }
}