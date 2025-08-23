(function () {

  var LeaguePage = {

    baseApiUrl : getBaseApiUrl(),
    baseUIUrl : getBaseUIUrl(),

    loadingElem : null,
    season : null,

    currentSeason : null,
    currentDay : null,
    dps : null,

    containers : [
      'league-standings-date-picker-container',
      'league-standings-header-container',
      'league-standings-container'
    ],

    init : function() {
      this.loading();
      this.loadStandings();
    },

    /**
     * Handle the case of an error, tell the user something is wrong
     */
    error : function(mode) {
      // Hide elements
      this.loadingElem.classList.add('invisible');

      // TODO: This is not hiding the league standings container
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

    getCurrentSeasonDay : function() {

    },

    /**
     * Load the standings by getting the selected season/day, then
     * calling the appropriate APIs.
     */
    loadStandings : function() {

      // Start by getting DPS
      let url = this.baseApiUrl + '/dps';
      fetch(url)
      .then(res => res.json())
      .then((dpsApiResult) => {
        this.dps = dpsApiResult;
      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      });

      // // Get season url parameter
      // this.season = this.helpers.getUrlParameter('season');

      // Check current season and day
      let turl = this.baseApiUrl + '/today';
      fetch(turl)
      .then(res => res.json())
      .then((todayApiResult) => {

        this.currentSeason = todayApiResult[0];
        this.currentDay = todayApiResult[1];

        // Use this.season instead of this.currentSeason,
        // in case user selected different season.
        if (this.season==null) {
          this.season = this.currentSeason;
        }
        // Use this.day instead of this.currentDay,
        // in case user selected different day.
        if (this.day==null) {
          this.day = this.currentDay;
        } else if (this.day >= this.dps) {
          this.day = this.dps;
        }

        // Only continue with loading season standings
        // if specified season is valid
        if (this.season <= this.currentSeason) {
          this.updateSeasonHeader(this.season);
          this.populateSeasonDayPicker(this.dps, this.season, this.day);
          this.processStandingsData(this.season, this.day);
          this.registerEvents();
        }
      })
      .catch(err => {
        console.log(err);
        this.error(-1);
      });
    },

    changeHandler : function () {
      console.log('Dropdown change handler');

      newSeason = document.getElementById('season-picker-select');
      newDay    = document.getElementById('day-picker-select');

      newSeason0 = newSeason.value-1;
      newDay0    = newDay.value-1;
      
      console.log(newSeason0);
      console.log(newDay0);
      console.log(LeaguePage.currentSeason);

      // Set to current season if too large
      if (newSeason0 > LeaguePage.currentSeason) {
        newSeason0 = LeaguePage.currentSeason;
      }

      LeaguePage.updateSeasonHeader(newSeason0);

      // When this triggers, we get a set of new team boxes tacked on, with no logos
      // This should instead separate the drawing vs the updating
      //LeaguePage.processStandingsData(newSeason0, newDay0);
    },

    updateSeasonHeader : function(season0) {

      // Populate the "Season X" header
      var seasonHeaderContainer = document.getElementById('league-standings-header-container');

      // get element by id "landing-header-season" and change innerHTML to current season
      var seasonHead = document.getElementById('standings-header-season-number');
      if (seasonHead != null) {
        var sp1 = parseInt(season0) + 1;
        seasonHead.innerHTML = sp1;
      }

      seasonHeaderContainer.classList.remove('invisible');

    },

    populateSeasonDayPicker : function(dps, season0, day0) {

      // Populate the season/day drop-down pickers

      var pickerContainer, seasonPicker, dayPicker;

      // Show the container with the two dropdowns
      pickerContainer = document.getElementById('league-standings-date-picker-container');
      pickerContainer.classList.remove('invisible');

      // Get the two dropdown elements
      seasonPicker = document.getElementById('season-picker-select');
      dayPicker = document.getElementById('day-picker-select');

      var iSeason, iDay;

      // Populate season picker
      for (iSeason = 0; iSeason <= season0; iSeason++) {
        pickerOption = document.createElement('option');
        pickerOption['value'] = iSeason+1;
        pickerOption.text = iSeason+1;
        if(season0==iSeason) {
          pickerOption['selected'] = true;
        }

        seasonPicker.appendChild(pickerOption);
      }

      // Populate day picker
      for (iDay = 0; iDay <= Math.min(day0, dps-1); iDay++) {
        pickerOption = document.createElement('option');
        pickerOption['value'] = iDay+1;
        pickerOption.text = iDay+1;
        // Deal with "day 99" meaning season is over (again)
        if((day0==iDay) || (day0==99 && iDay==dps-1)) {
          pickerOption['selected'] = true;
        }

        dayPicker.appendChild(pickerOption);
      }

    },

    processStandingsData : function(season0, day0) {

      // Load the league standings
      let recordsUrl = this.baseApiUrl + '/standings/' + season0 + '/' + day0;
      fetch(recordsUrl)
      .then(res => res.json())
      .then((standingsApiResult) => {

        // Hide loading message and make league standings container visible
        this.loadingElem.classList.add('invisible');
        var leagueStandingsElem = document.getElementById('league-standings-container');
        leagueStandingsElem.classList.remove('invisible');

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
     * Register event handlers for this session (one time execution)
     */
    registerEvents : function () {
      //this.helpers.registerEvent(document.getElementById('season-picker-select'), 'change', this.handlers.selectors.change, false);
      //this.helpers.registerEvent(document.getElementById('day-picker-select'),    'change', this.handlers.selectors.change, false);

      this.helpers.registerEvent(document.getElementById('season-picker-select'), 'change', this.changeHandler, false);
      this.helpers.registerEvent(document.getElementById('day-picker-select'),    'change', this.changeHandler, false);
    },


    /** ****************************************************************************************************************************
     * Event Handlers
     */
    handlers : {

      selectors : {
        /**
         * Selector Handler - Change Event
         */
        change : function() {
          newSeason = document.getElementById('season-picker-select');
          newDay    = document.getElementById('day-picker-select');
          
          newSeason0 = newSeason.value-1;
          newDay0    = newDay.value-1;

          console.log(newSeason0);
          console.log(newDay0);
          console.log(LeaguePage.currentSeason);

          if (newSeason0 <= LeaguePage.currentSeason) {
            console.log('repopulating standings data');
            this.updateSeasonHeader(LeaguePage.season);
            this.processStandingsData(LeaguePage.season);
          }
        },
      }

    },

    /** ****************************************************************************************************************************
     * Helper functions
     */
    helpers : {
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
    }
  };

  LeaguePage.helpers.registerEvent(window, 'load', function () {
    LeaguePage.init();
  }, false);

}());