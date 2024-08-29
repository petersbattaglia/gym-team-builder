export class NavBar {
    render() {
        return `
            <div class="navbar">
                <div class="container">
                    <button id="athleteListPage">Athlete List</button>
                    <button id="athleteSearchPage">Build Teams</button> <!-- Changed from "Athlete Search" to "Build a Team" -->
                </div>
            </div>
        `;
    }
}