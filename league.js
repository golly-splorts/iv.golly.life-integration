(function () {

  var LeaguePage = {

    baseApiUrl : getBaseApiUrl(),
    baseUIUrl : getBaseUIUrl(),

    loadingElem : null,
    season : null,
    day: null,
    urlSeason: null,
    urlDay: null,

    containers : [
      'league-standings-header-container',
      'league-standings-container'
    ],

    init : function() {
      this.getUrlParams();
      this.loading();
      this.loadConfig();
      this.registerDropdownListeners();
    },

    /**
     * Handle the case of an error, tell the user something is wrong
     */
    error : function(mode) {
      // Hide elements
      this.loadingElem.classList.add('invisible');
      for (var c in this.containers) {
        var elem = document.getElementById(this.containers[c]);
        elem.classList.add('invisible');
      }

      // Show error elements
      var container = document.getElementById('container-error');
      container.classList.remove("invisible");

    },

    /**
     * Show the loading message while loading API data.
     */
    loading : function() {
      this.loadingElem = document.getElementById('container-loading');
      this.loadingElem.classList.remove('invisible');
    },

    /**
     * Load parameters from the URL (if any are specified)
     * and pass them along to the API-calling functions.
     */
    modeApiResult: null,

    getUrlParams : function() {
      const urlParams = new URLSearchParams(window.location.search);
      this.urlSeason = urlParams.get('season');
      this.urlDay = urlParams.get('day');
    },

    loadConfig : function() {
      let url = this.baseApiUrl + '/mode';
      fetch(url)
      .then(res => res.json())
      .then((modeApiResult) => {
        this.modeApiResult = modeApiResult;
        this.populateDropdowns();
        this.processStandingsData(this.season, this.day);
      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      });
    },

    populateDropdowns: function() {
      const seasonDropdownMenu = document.getElementById('season-dropdown-menu');
      seasonDropdownMenu.innerHTML = '';
      const seasonDropdownButton = document.getElementById('season-dropdown-button');
      const mode = this.modeApiResult.mode;

      const currentSeason0 = this.modeApiResult.season;
      const currentSeason = currentSeason0 + 1;
      
      // 1-indexed
      let seasons = [];
      let defaultSeason;

      if (mode < 10) { // Pre-season
        if (currentSeason > 1) {
          for (let i = 1; i < currentSeason - 1; i++) {
            seasons.push(i);
          }
          defaultSeason = currentSeason - 1;
        } else {
          seasons.push(1);
          defaultSeason = 1;
        }
      } else { // In-season or post-season
        for (let i = 1; i <= currentSeason; i++) {
          seasons.push(i);
        }
        defaultSeason = currentSeason;
      }
      seasons.reverse();

      seasons.forEach(s => {
        const a = document.createElement('a');
        a.classList.add('dropdown-item');
        a.href = '#';
        a.dataset.value = s;
        a.textContent = s;
        seasonDropdownMenu.appendChild(a);
      });

      // Start with the default
      let selectedSeason = defaultSeason;

      // Handle a user-provided season via url params
      if (this.urlSeason) {
        const urlSeasonNum = parseInt(this.urlSeason, 10);
        if (!isNaN(urlSeasonNum) && urlSeasonNum > 0 && urlSeasonNum <= defaultSeason) {
            selectedSeason = urlSeasonNum;
        }
        // Otherwise, just use default
      }

      this.season = selectedSeason;
      seasonDropdownButton.textContent = selectedSeason;

      // Chain the day update drop-down (behavior depends on season drop-down)
      this.updateDayDropdown();
    },

    updateDayDropdown: function() {
      const dayDropdownMenu = document.getElementById('day-dropdown-menu');
      dayDropdownMenu.innerHTML = '';
      const dayDropdownButton = document.getElementById('day-dropdown-button');
      const selectedSeason = parseInt(this.season);
      const mode = this.modeApiResult.mode;
      const currentSeason = this.modeApiResult.season;
      const elapsed = this.modeApiResult.elapsed;
      const daysPerSeason = 49;

      let days = [];
      let defaultDayValue;

      if (mode >= 10 && mode < 20 && selectedSeason === currentSeason + 1) { // In-season, current season selected
        const currentDay = Math.floor(elapsed / 3600) + 1;
        if (currentDay > 1) {
          for (let i = 1; i <= currentDay; i++) {
            days.push(i);
          }
          defaultDayValue = currentDay;
        } else {
          // No full day has passed, so no days to list for this season.
          // The fallback below will handle this.
        }
      } else { // Pre-season, post-season, or a past season is selected
        for (let i = 1; i <= daysPerSeason; i++) {
          days.push(i);
        }
        defaultDayValue = daysPerSeason;
      }

      if (days.length === 0) {
        // This is a fallback for when no days are populated,
        // e.g. in-season, current season, day 1.
        days.push(1);
        defaultDayValue = 1;
      }
      days.reverse();

      days.forEach(d => {
        const a = document.createElement('a');
        a.classList.add('dropdown-item');
        a.href = '#';
        a.dataset.value = d;
        a.textContent = d;
        dayDropdownMenu.appendChild(a);
      });

      let selectedDay = defaultDayValue;
      if (this.urlDay) {
        const urlDayNum = parseInt(this.urlDay, 10);
        if (!isNaN(urlDayNum) && urlDayNum > 0 && urlDayNum <= defaultDayValue) {
            selectedDay = urlDayNum;
        }
        this.urlDay = null;
      }

      this.day = selectedDay;
      dayDropdownButton.textContent = selectedDay;
    },

    registerDropdownListeners: function() {
        const seasonDropdownMenu = document.getElementById('season-dropdown-menu');
        const dayDropdownMenu = document.getElementById('day-dropdown-menu');
        const seasonDropdownButton = document.getElementById('season-dropdown-button');
        const dayDropdownButton = document.getElementById('day-dropdown-button');

        seasonDropdownMenu.addEventListener('click', (event) => {
            event.preventDefault();
            if (event.target.classList.contains('dropdown-item')) {
                const selectedSeason = event.target.dataset.value;
                this.season = selectedSeason;
                seasonDropdownButton.textContent = selectedSeason;
                this.updateDayDropdown();
                this.processStandingsData(this.season, this.day);
            }
        });

        dayDropdownMenu.addEventListener('click', (event) => {
            event.preventDefault();
            if (event.target.classList.contains('dropdown-item')) {
                const selectedDay = event.target.dataset.value;
                this.day = selectedDay;
                dayDropdownButton.textContent = selectedDay;
                this.processStandingsData(this.season, this.day);
            }
        });
    },

    clearStandings: function() {
        const league1div1 = document.getElementById('league-1-division-1-ul');
        const league1div2 = document.getElementById('league-1-division-2-ul');
        const league2div1 = document.getElementById('league-2-division-1-ul');
        const league2div2 = document.getElementById('league-2-division-2-ul');
        league1div1.innerHTML = '';
        league1div2.innerHTML = '';
        league2div1.innerHTML = '';
        league2div2.innerHTML = '';
    },

    processStandingsData : function(season, day) {
      this.clearStandings();
      this.loading();

      let season0 = season - 1;
      let day0 = day - 1;
      let recordsUrl = this.baseApiUrl + '/standings/' + season0 + '/' + day0;
      fetch(recordsUrl)
      .then(res => res.json())
      .then((standingsApiResult) => {

        // Hide loading message and make league standings container visible
        this.loadingElem.classList.add('invisible');
        var leagueStandingsElem = document.getElementById('league-standings-container');
        leagueStandingsElem.classList.remove('invisible');
        var leagueStandingsHeaderElem = document.getElementById('league-standings-header-container');
        leagueStandingsHeaderElem.classList.remove('invisible');


        // Use league/division info to figure out where to update league/division names
        for (var iL in standingsApiResult.leagues) {
          var iLp1 = parseInt(iL) + 1;
          var league = standingsApiResult.leagues[iL];

          // Set the league name on the page
          var leagueNameId = 'league-' + iLp1 + '-name';
          var leagueNameElem = document.getElementById(leagueNameId);
          leagueNameElem.innerHTML = league;

          for (var iD in standingsApiResult.divisions) {
            var iDp1 = parseInt(iD) + 1;
            var division = standingsApiResult.divisions[iD];

            // Set the division name on the page
            var divisionNameId = 'league-' + iLp1 + '-division-' + iDp1 + '-name';
            var divisionNameElem = document.getElementById(divisionNameId);
            divisionNameElem.innerHTML = division;

            // Create the <ul> and <li> elements for the division team ranking list
            var ulElemId = 'league-' + iLp1 + '-division-' + iDp1 + '-ul';
            var ulElem = document.getElementById(ulElemId);

            // Now use the structured league/division nested dictionary
            teamStandingsItems = standingsApiResult.rankings[league][division];

            var iS;
            for (iS = 0; iS < teamStandingsItems.length; iS++) {

              var teamStandings = teamStandingsItems[iS];

              /////////////////////////////////
              // Add an entry for each team
              // to the league standings page
              //
              // <li>
              //   <h6>
              //     <span>
              //         (icon)
              //         (team name)
              //     </span>
              //     <span>
              //          (team win/loss record)
              //     </span>
              //   </h6>
              // </li>

              // Add an li element for this team
              var liElem = document.createElement('li');
              liElem.classList.add('list-group-item');
              liElem.classList.add('d-flex');
              liElem.classList.add('justify-content-between');
              liElem.classList.add('align-items-center');

              // ----------------
              // Left side: name + icon in a single span, wrapped by <h6>
              var h6 = document.createElement('h6');
              h6.classList.add('standings-team-name');

              var nameiconId = 'league-name-icon-holder';
              var nameicon = document.createElement('span');
              nameicon.setAttribute('id', nameiconId);

              // Icon first (far left)
              if (teamStandings.hasOwnProperty('teamAbbr')) {
                var icontainerId = "team-icon-container-" + teamStandings.teamAbbr.toLowerCase();
                var container = document.createElement('span');
                container.setAttribute('id', icontainerId);
                container.classList.add('icon-container');
                container.classList.add('league-icon-container');
                container.classList.add('text-center');

                var iconSize = "25";
                var iconId = "team-icon-" + teamStandings.teamAbbr.toLowerCase();
                var svg = document.createElement('object');
                svg.setAttribute('type', 'image/svg+xml');
                svg.setAttribute('rel', 'prefetch');
                svg.setAttribute('data', '../img/' + teamStandings.teamAbbr.toLowerCase() + '.svg');
                svg.setAttribute('height', iconSize);
                svg.setAttribute('width', iconSize);
                svg.setAttribute('id', iconId);
                svg.classList.add('icon');
                svg.classList.add('team-icon');
                svg.classList.add('invisible');

                // Attach icon to container, and container to nameicon
                container.appendChild(svg);
                nameicon.appendChild(container);

                // Wait a little bit for the data to load,
                // then modify the color and make it visible
                var paint = function(color, elemId) {
                  var mysvg = $('#' + elemId).getSVG();
                  var child = mysvg.find("g path:first-child()");
                  if (child.length > 0) {
                    child.attr('fill', color);
                    $('#' + elemId).removeClass('invisible');
                  }
                }
                // This fails pretty often, so try a few times.
                setTimeout(paint, 100,   teamStandings.teamColor, iconId);
                setTimeout(paint, 250,   teamStandings.teamColor, iconId);
                setTimeout(paint, 500,   teamStandings.teamColor, iconId);
                setTimeout(paint, 1000,  teamStandings.teamColor, iconId);
                setTimeout(paint, 1500,  teamStandings.teamColor, iconId);
              }

              // Name next
              var nameSpanElem = document.createElement('span');
              nameSpanElem.innerHTML = teamStandings.teamName;
              nameSpanElem.style.color = teamStandings.teamColor;
              nameicon.appendChild(nameSpanElem);

              // // Attach to left side
              // liElem.appendChild(nameicon);

              // Attach nameicon to h6
              h6.appendChild(nameicon);
              // Attach h6 to left side
              liElem.appendChild(h6);

              // ----------------
              // Right side: win-loss record, wrapped by <h6>
              var h6r = document.createElement('h6');
              h6r.classList.add('standings-team-record');

              var wlElem = document.createElement('span');
              wlElem.classList.add('standings-record');
              var winLossStr = teamStandings.teamWinLoss[0] + "-" + teamStandings.teamWinLoss[1];
              wlElem.innerHTML = winLossStr;

              //// Attach to right side
              //liElem.appendChild(wlElem);

              // Attach W-L record to h6 header
              h6r.appendChild(wlElem);
              // Attach h6 header to li element
              liElem.appendChild(h6r);

              ulElem.appendChild(liElem);

            } // finish for each team in the standings

            iD++;
          } // end each division loop

          iL++;
        } // end each league loop

      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      }); // end API /standings

    },


    /**
     * Register Event
     */
    registerEvent : function (element, event, handler, capture) {
      if (/msie/i.test(navigator.userAgent)) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, capture);
      }
    },

  };

  LeaguePage.registerEvent(window, 'load', function () {
    LeaguePage.init();
  }, false);

}());