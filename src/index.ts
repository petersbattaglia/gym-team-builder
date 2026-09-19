import './styles.css';
import { NavBar } from './components/NavBar';
import { AthleteList } from './components/AthleteList';
import { AthleteSearch } from './components/AthleteSearch';
import { SharedState } from './components/SharedState';

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
    document.getElementById('cancelUpdate')!.addEventListener('click', () => {
        athleteList.cancelUpdate();
    });
}

function renderSearchPage() {
    athleteSearch.updateAthleteList(athleteList);
    const contentElement = document.getElementById('content')!;
    contentElement.innerHTML = athleteSearch.render();
    athleteSearch.updateSelectedList();
    document.getElementById('makeTeams')!.addEventListener('click', () => athleteSearch.makeTeams());
    document.getElementById('addOrUpdateAthlete')!.addEventListener('click', () => athleteSearch.handleAddOrUpdateAthlete());
    document.getElementById('cancelUpdate')!.addEventListener('click', () => athleteSearch.closeAthleteForm());
}

function attachNavListeners() {
    document.getElementById('athleteListPage')!.addEventListener('click', loadAthleteListPage);
    document.getElementById('athleteSearchPage')!.addEventListener('click', loadSearchPage);
}

function initApp() {
    renderNavBar();
    const initialPage = window.location.hash.substring(1) || 'athleteList';
    loadPage(initialPage);
}

function loadAthleteListPage() {
    loadPage('athleteList');
}

function loadSearchPage() {
    loadPage('buildTeams');
}

function setActiveNav(page: string) {
    document.getElementById('athleteListPage')?.classList.toggle('active', page === 'athleteList');
    document.getElementById('athleteSearchPage')?.classList.toggle('active', page === 'buildTeams');
}

function loadPage(page: string) {
    console.log('Loading page:', page);
    history.pushState({ page }, '', `#${page}`);
    setActiveNav(page);
    switch (page) {
        case 'athleteList':
            renderAthletePage();
            break;
        case 'buildTeams':
            renderSearchPage();
            break;
        default:
            renderAthletePage();
    }
}

document.addEventListener('DOMContentLoaded', initApp);

window.addEventListener('pageChange', (event: Event) => {
    const customEvent = event as CustomEvent<{ page: string }>;
    console.log('Page change event:', customEvent.detail.page);
    loadPage(customEvent.detail.page);
});

(window as any).athleteList = athleteList;
(window as any).athleteSearch = athleteSearch;
