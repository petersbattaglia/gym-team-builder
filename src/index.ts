import './styles.css';
import { NavBar } from './components/NavBar';
import { AthleteList } from './components/AthleteList';
import { AthleteSearch } from './components/AthleteSearch';

const navBar = new NavBar();
const athleteList = new AthleteList();
const athleteSearch = new AthleteSearch(athleteList);

function renderNavBar() {
    const appElement = document.getElementById('app')!;
    appElement.innerHTML = navBar.render() + '<div id="content"></div>';
    attachNavListeners();
}

function renderAthletePage() {
    const contentElement = document.getElementById('content')!;
    contentElement.innerHTML = athleteList.render();
    athleteList.updateList();
    document.getElementById('addOrUpdateAthlete')!.addEventListener('click', () => {
        athleteList.addOrUpdateAthlete();
        athleteSearch.updateAthleteList(athleteList);
    });
}

function renderSearchPage() {
    athleteSearch.updateAthleteList(athleteList);
    const contentElement = document.getElementById('content')!;
    contentElement.innerHTML = athleteSearch.render();
    athleteSearch.updateSelectedList();
    document.getElementById('makeTeams')!.addEventListener('click', () => athleteSearch.makeTeams());
}

function attachNavListeners() {
    document.getElementById('athleteListPage')!.addEventListener('click', renderAthletePage);
    document.getElementById('athleteSearchPage')!.addEventListener('click', renderSearchPage);
}

function initApp() {
    renderNavBar();
    renderAthletePage();
}

document.addEventListener('DOMContentLoaded', initApp);

(window as any).athleteList = athleteList;
(window as any).athleteSearch = athleteSearch;