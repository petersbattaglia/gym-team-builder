// SharedState.ts
import { Athlete } from './Athlete';

export class SharedState {
    private static instance: SharedState;
    private selectedAthletes: Athlete[] = [];
    private changeListeners: (() => void)[] = [];

    private constructor() {}

    static getInstance(): SharedState {
        if (!SharedState.instance) {
            SharedState.instance = new SharedState();
        }
        return SharedState.instance;
    }

    getSelectedAthletes(): Athlete[] {
        return this.selectedAthletes;
    }

    setSelectedAthletes(athletes: Athlete[]): void {
        this.selectedAthletes = athletes;
        this.notifyChangeListeners();
    }

    updateAthlete(oldAthlete: Athlete, newAthlete: Athlete): void {
        this.selectedAthletes = this.selectedAthletes.map(athlete => 
            (athlete.firstName === oldAthlete.firstName && athlete.lastName === oldAthlete.lastName) 
                ? { ...newAthlete }
                : athlete
        );
        this.notifyChangeListeners();
    }

    addChangeListener(listener: () => void): void {
        this.changeListeners.push(listener);
    }

    private notifyChangeListeners(): void {
        this.changeListeners.forEach(listener => listener());
    }
}