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
          for (let i = 1; i < currentSeason; i++) {
            seasons.push(i);
          }
          // default has to be 1 prior, because currentSeason has not started yet
          defaultSeason = currentSeason - 1;
        } else {
          // Nothing has started yet
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
      const mode = this.modeApiResult.mode;

      // 1-indexed
      const selectedSeason = parseInt(this.season);

      const currentSeason0 = this.modeApiResult.season;
      const currentSeason = currentSeason0 + 1;

      const elapsed = this.modeApiResult.elapsed;
      const daysPerSeason = 49;

      // 1-indexed
      let days = [];
      let defaultDayValue;

      // mode < 10: handled by default case

      // mode >= 10 && mode < 20:
      if (mode >= 10 && mode < 20 && selectedSeason === currentSeason) { // In-season, current season selected
        const currentDay0 = Math.floor(elapsed / 3600);
        const currentDay = currentDay0 + 1;
        if (currentDay > 1) {
          const lastCompletedDay = currentDay - 1;
          for (let i = 1; i <= lastCompletedDay; i++) {
            days.push(i);
          }
          defaultDayValue = lastCompletedDay;
        } else {
          // No full day has passed, so no days to list for this season.
          // Handled by default case below.
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
        const ids = [
            'league-1-division-1-tbody', 'league-1-division-2-tbody',
            'league-2-division-1-tbody', 'league-2-division-2-tbody'
        ];
        ids.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.innerHTML = '';
            }
        });
    },

    processStandingsData : function(season, day) {
      this.clearStandings();
      this.loading();

      let season0 = season - 1;
      let day0 = day - 1;
      const dps = 49; // days per season

      let recordsUrl = this.baseApiUrl + '/standings/' + season0 + '/' + day0;
      fetch(recordsUrl)
      .then(res => res.json())
      .then((standingsApiResult) => {

        const mode = this.modeApiResult.mode;
        const currentSeason0 = this.modeApiResult.season;
        const selectedSeason0 = season - 1;

        const viewingLastDay = (day == dps);
        const seasonIsOver = (selectedSeason0 < currentSeason0) || (selectedSeason0 === currentSeason0 && mode >= 20);

        if (seasonIsOver && viewingLastDay) {
            let seedsUrl = this.baseApiUrl + '/seeds/' + selectedSeason0;
            fetch(seedsUrl)
            .then(res => res.json())
            .then(seedsApiResult => {
                if (Object.keys(seedsApiResult).length === 0) {
                    this.populateStandings(standingsApiResult, null);
                } else {
                    this.populateStandings(standingsApiResult, seedsApiResult);
                }
            })
            .catch(err => {
                console.log(`Could not fetch seeds for season ${selectedSeason0}, falling back to standings-based logic. Error: ${err}`);
                this.populateStandings(standingsApiResult, null);
            });
        } else {
            this.populateStandings(standingsApiResult, null);
        }
      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      }); // end API /standings
    },

    populateStandings: function(standingsApiResult, seedsApiResult) {
        const mode = this.modeApiResult.mode;
        const showGamesLeft = mode >= 10 && mode < 20;

        const gl_headers = document.getElementsByClassName('games-left-col');
        for (let i = 0; i < gl_headers.length; i++) {
            if (showGamesLeft) {
                gl_headers[i].style.display = '';
            } else {
                gl_headers[i].style.display = 'none';
            }
        }

        // Hide loading message and make league standings container visible
        this.loadingElem.classList.add('invisible');
        var leagueStandingsElem = document.getElementById('league-standings-container');
        leagueStandingsElem.classList.remove('invisible');
        var leagueStandingsHeaderElem = document.getElementById('league-standings-header-container');
        leagueStandingsHeaderElem.classList.remove('invisible');

        let seedPrefixes = null;
        if (seedsApiResult) {
            seedPrefixes = {};
            for (const leagueName in seedsApiResult) {
                if (!standingsApiResult.rankings[leagueName]) continue;
                seedPrefixes[leagueName] = {};
                const teamsInLeague = seedsApiResult[leagueName];

                let allTeamsInLeague = [];
                for (const divisionName in standingsApiResult.rankings[leagueName]) {
                    standingsApiResult.rankings[leagueName][divisionName].forEach(team => {
                        allTeamsInLeague.push(team.teamName);
                    });
                }

                allTeamsInLeague.forEach(teamName => {
                    seedPrefixes[leagueName][teamName] = 'e-';
                });

                // Build a map of team names to their division
                const teamToDivisionMap = {};
                for (const divisionName in standingsApiResult.rankings[leagueName]) {
                    standingsApiResult.rankings[leagueName][divisionName].forEach(team => {
                        teamToDivisionMap[team.teamName] = divisionName;
                    });
                }

                // Identify division winners by finding the first team from each division in the seed-ordered list
                const divisionWinnerNames = new Set();
                const divisions = Object.keys(standingsApiResult.rankings[leagueName]);
                divisions.forEach(divisionName => {
                    for (const seededTeam of teamsInLeague) {
                        if (teamToDivisionMap[seededTeam.teamName] === divisionName) {
                            divisionWinnerNames.add(seededTeam.teamName);
                            break; // Found the winner for this division
                        }
                    }
                });

                // Assign prefixes: x- for division winners, w- for wild cards.
                // The 'e-' prefix has already been assigned to all teams.
                teamsInLeague.forEach(seededTeam => {
                    if (divisionWinnerNames.has(seededTeam.teamName)) {
                        seedPrefixes[leagueName][seededTeam.teamName] = 'x-';
                    } else {
                        seedPrefixes[leagueName][seededTeam.teamName] = 'w-';
                    }
                });
            }
        }

        // --- Pre-calculations for each league ---
        let leagueCalculations = {};
        for (var iL_pre in standingsApiResult.leagues) {
            var league_pre = standingsApiResult.leagues[iL_pre];
            var overall_league_standings = [];
            var wc_standings = [];

            for (var iD_pre in standingsApiResult.divisions) {
                var division_pre = standingsApiResult.divisions[iD_pre];
                if (standingsApiResult.rankings[league_pre] && standingsApiResult.rankings[league_pre][division_pre]) {
                    var teams = standingsApiResult.rankings[league_pre][division_pre];
                    teams.forEach((team, index) => {
                        overall_league_standings.push(team);
                        if (index > 0) { // Not a division leader
                            wc_standings.push(team);
                        }
                    });
                }
            }

            // Sort by wins (desc), then losses (asc)
            const sortTeams = (a, b) => {
                if (b.teamWinLoss[0] !== a.teamWinLoss[0]) {
                    return b.teamWinLoss[0] - a.teamWinLoss[0];
                }
                return a.teamWinLoss[1] - b.teamWinLoss[1];
            };

            overall_league_standings.sort(sortTeams);
            wc_standings.sort(sortTeams);

            leagueCalculations[league_pre] = {
                overall: overall_league_standings,
                wildcard: wc_standings
            };
        }


        // Use league/division info to figure out where to update league/division names
        for (var iL in standingsApiResult.leagues) {
          var iLp1 = parseInt(iL) + 1;
          var league = standingsApiResult.leagues[iL];

          // Set the league name on the page
          var leagueNameId = 'league-' + iLp1 + '-name';
          var leagueNameElem = document.getElementById(leagueNameId);
          leagueNameElem.innerHTML = league;

          // Get pre-calculated standings for this league
          const currentLeagueCalcs = leagueCalculations[league];
          const overall_league_standings = currentLeagueCalcs.overall;
          const wc_standings = currentLeagueCalcs.wildcard;

          for (var iD in standingsApiResult.divisions) {
            var iDp1 = parseInt(iD) + 1;
            var division = standingsApiResult.divisions[iD];

            // Set the division name on the page
            var divisionNameId = 'league-' + iLp1 + '-division-' + iDp1 + '-name';
            var divisionNameElem = document.getElementById(divisionNameId);
            divisionNameElem.innerHTML = division;

            var tbodyElemId = 'league-' + iLp1 + '-division-' + iDp1 + '-tbody';
            var tbodyElem = document.getElementById(tbodyElemId);

            // Use documentFragment to compile the table ahead of time, then insert into page.
            var fragment = document.createDocumentFragment();

            if (!standingsApiResult.rankings[league] || !standingsApiResult.rankings[league][division]) {
                continue;
            }

            teamStandingsItems = standingsApiResult.rankings[league][division];

            let teamPrefixes = null;
            if (seedPrefixes && seedPrefixes[league]) {
                teamStandingsItems.sort((a, b) => {
                    // Sort by wins descending
                    if (b.teamWinLoss[0] !== a.teamWinLoss[0]) {
                        return b.teamWinLoss[0] - a.teamWinLoss[0];
                    }
                    // wins/losses are zero sum, so skip losses

                    // Now, for teams with the same W-L record, use clinch status.
                    const prefixA = seedPrefixes[league][a.teamName];
                    const prefixB = seedPrefixes[league][b.teamName];

                    const order = { 'x-': 1, 'w-': 2, 'e-': 3 };

                    const orderA = order[prefixA] || 4; // Unranked last
                    const orderB = order[prefixB] || 4;

                    return orderA - orderB;
                });
            } else {
                // If seeds are not final, calculate prefixes and then sort
                teamPrefixes = {};
                const dps = 49;
                const day0 = this.day - 1;
                const divisionLeaderForPrefix = teamStandingsItems[0];

                teamStandingsItems.forEach((team, index) => {
                    let prefix = '';
                    const our_wins = team.teamWinLoss[0];
                    const our_losses = team.teamWinLoss[1];

                    if (index === 0) { // Is division leader
                        let is_div_clinched = false;
                        if (teamStandingsItems.length > 1) {
                            const second_place_losses = teamStandingsItems[1].teamWinLoss[1];
                            const magic = (dps + 1) - our_wins - second_place_losses;
                            if (magic <= 0) {
                                is_div_clinched = true;
                            }
                        }
                        if (day0 === dps - 1) { // Last day of season
                            is_div_clinched = true;
                        }
                        if (is_div_clinched) {
                            prefix = 'x-';
                        }
                    } else { // Not division leader
                        const elim_val = (dps + 1) - divisionLeaderForPrefix.teamWinLoss[0] - our_losses;
                        let wc_elim_val = Infinity;
                        if (wc_standings.length > 1) {
                            wc_elim_val = (dps + 1) - wc_standings[1].teamWinLoss[0] - our_losses;
                        }
                        const is_eliminated = (elim_val <= 0 && (wc_elim_val <= 0 || wc_standings.length < 2));
                        if (is_eliminated) {
                            prefix = 'e-';
                        }
                    }

                    if (!prefix) { // Playoff Clinch (w-)
                        let is_playoff_clinched = false;
                        if (overall_league_standings.length > 4) {
                            const challenger = overall_league_standings[4];
                            const playoff_clinch_magic = (dps + 1) - our_wins - challenger.teamWinLoss[1];
                            if (playoff_clinch_magic <= 0) {
                                is_playoff_clinched = true;
                            }
                        } else {
                            is_playoff_clinched = true;
                        }
                        if (is_playoff_clinched) {
                            prefix = 'w-';
                        }
                    }
                    teamPrefixes[team.teamName] = prefix;
                });

                teamStandingsItems.sort((a, b) => {
                    if (b.teamWinLoss[0] !== a.teamWinLoss[0]) {
                        return b.teamWinLoss[0] - a.teamWinLoss[0];
                    }
                    const prefixA = teamPrefixes[a.teamName];
                    const prefixB = teamPrefixes[b.teamName];
                    const order = { 'x-': 1, 'w-': 2, 'e-': 3 };
                    const orderA = order[prefixA] || 4;
                    const orderB = order[prefixB] || 4;
                    return orderA - orderB;
                });
            }

            const divisionLeader = teamStandingsItems[0];
            const dps = 49;
            const day0 = this.day - 1;

            for (var iS = 0; iS < teamStandingsItems.length; iS++) {
              var teamStandings = teamStandingsItems[iS];
              let prefix = '';

              const our_wins = teamStandings.teamWinLoss[0];
              const our_losses = teamStandings.teamWinLoss[1];

              if (seedPrefixes) {
                  prefix = seedPrefixes[league][teamStandings.teamName] || '';
              } else if (teamPrefixes) {
                  prefix = teamPrefixes[teamStandings.teamName] || '';
              }

              var tr = document.createElement('tr');

              // Col 1: Team Name + Icon
              var tdTeam = document.createElement('td');
              tdTeam.classList.add('text-left', 'team-cell'); // Align left + ADDED team-cell
              var nameicon = document.createElement('span');
              // Icon
              if (teamStandings.hasOwnProperty('teamAbbr')) {
                var container = document.createElement('span');
                container.classList.add('icon-container', 'league-icon-container', 'text-center');
                var iconSize = "25";
                var iconId = "team-icon-" + teamStandings.teamAbbr.toLowerCase() + '-' + iL + '-' + iD + '-' + iS;
                var svg = document.createElement('object');
                svg.setAttribute('type', 'image/svg+xml');
                svg.setAttribute('data', '../img/' + teamStandings.teamAbbr.toLowerCase() + '.svg');
                svg.setAttribute('height', iconSize);
                svg.setAttribute('width', iconSize);
                svg.setAttribute('id', iconId);
                svg.classList.add('icon', 'team-icon', 'invisible');
                container.appendChild(svg);
                nameicon.appendChild(container);
                var paint = function(color, elemId) {
                  var mysvg = $('#' + elemId).getSVG();
                  if (mysvg) {
                    var child = mysvg.find("g path:first-child()");
                    if (child.length > 0) {
                      child.attr('fill', color);
                      $('#' + elemId).removeClass('invisible');
                    }
                  }
                }
                setTimeout(paint, 100, teamStandings.teamColor, iconId);
                setTimeout(paint, 500, teamStandings.teamColor, iconId);
                setTimeout(paint, 1500, teamStandings.teamColor, iconId);
              }
              // Name
              var nameSpanElem = document.createElement('span');
              nameSpanElem.innerHTML = prefix + teamStandings.teamName;
              nameSpanElem.style.color = teamStandings.teamColor;

              nameSpanElem.style.fontWeight = '500';
              nameSpanElem.style.lineHeight = '1.2';
              nameicon.appendChild(nameSpanElem);
              tdTeam.appendChild(nameicon);
              tr.appendChild(tdTeam);

              // Col 2: Wins
              var tdW = document.createElement('td');
              tdW.classList.add('text-center'); // Align right
              tdW.textContent = our_wins;
              tr.appendChild(tdW);

              // Col 3: Losses
              var tdL = document.createElement('td');
              tdL.classList.add('text-center'); // Align right
              tdL.textContent = our_losses;
              tr.appendChild(tdL);

              // Col 4: Pct
              var tdPct = document.createElement('td');
              tdPct.classList.add('text-center'); // Align right
              const total_games = our_wins + our_losses;
              const pct = total_games > 0 ? (our_wins / total_games) : 0.0;
              tdPct.textContent = pct.toFixed(2);
              tr.appendChild(tdPct);

              // Col 5: Games Left
              if (showGamesLeft) {
                const dps = 49;
                var tdGl = document.createElement('td');
                tdGl.classList.add('text-center', 'games-left-col');
                const games_played = our_wins + our_losses;
                tdGl.textContent = dps - games_played;
                tr.appendChild(tdGl);
              }

              // Col 6: GB
              var tdGb = document.createElement('td');
              tdGb.classList.add('text-center'); // Align right
              if (iS === 0) {
                  tdGb.textContent = '-';
              } else {
                  const first_wins = divisionLeader.teamWinLoss[0];
                  const first_losses = divisionLeader.teamWinLoss[1];
                  const gb_val = ((first_wins - first_losses) - (our_wins - our_losses)) / 2;
                  tdGb.textContent = gb_val > 0 ? gb_val : '-';
              }
              tr.appendChild(tdGb);

              // Col 7: Elim #
              var tdElim = document.createElement('td');
              tdElim.classList.add('text-center'); // Align right
              if (iS === 0) {
                  tdElim.textContent = '-';
              } else {
                  const elim_val = (dps + 1) - divisionLeader.teamWinLoss[0] - our_losses;
                  tdElim.textContent = elim_val > 0 ? elim_val : '0';
              }
              tr.appendChild(tdElim);

              // Col 8: WC Elim #
              var tdWcElim = document.createElement('td');
              tdWcElim.classList.add('text-center'); // Align right
              if (iS === 0) {
                  tdWcElim.textContent = '-';
              } else {
                let wc_elim_val_str = '-';
                if (wc_standings.length > 1) {
                    const wc_elim_val = (dps + 1) - wc_standings[1].teamWinLoss[0] - our_losses;
                    if (wc_elim_val > 0) {
                      wc_elim_val_str = wc_elim_val;
                    } else {
                      wc_elim_val_str = '0';
                    }
                }
                tdWcElim.textContent = wc_elim_val_str;
              }
              tr.appendChild(tdWcElim);

              // Append row to fragment
              fragment.appendChild(tr);

            } // finish for each team in the standings
            
            // Append fragment to live DOM
            tbodyElem.appendChild(fragment);

          } // end each division loop
        } // end each league loop
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